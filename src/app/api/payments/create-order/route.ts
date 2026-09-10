import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { getRazorpay } from '@/lib/razorpay'
import { createOrderSchema } from '@/lib/validations'
import { ok, handleError, unauthorized, fail, notFound } from '@/lib/api-response'

export const runtime = 'nodejs'

/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order for a booking and moves the booking to
 * "payment_processing" status. The order ID is returned to the frontend
 * which opens the Razorpay checkout modal.
 *
 * Flow: Booked → Create Order → Payment Processing → Checkout → Verify → Paid
 */
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const body = await req.json()
    const data = createOrderSchema.parse(body)

    // Find the booking — must belong to this user
    const booking = await db.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        car: { select: { name: true, brand: true } },
        payment: true,
      },
    })

    if (!booking) return notFound('Booking not found.')
    if (booking.userId !== user.id) return fail('You can only pay for your own bookings.', 403)

    // Booking must be in "booked" status to initiate payment
    if (booking.status !== 'booked') {
      if (booking.status === 'payment_processing') {
        // Already has an order — return the existing order ID (idempotent)
        if (booking.payment?.razorpayOrderId) {
          return ok({
            orderId: booking.payment.razorpayOrderId,
            amount: booking.payment.amount,
            currency: 'INR',
            bookingStatus: booking.status,
            message: 'Payment already initiated. Complete the checkout.',
          })
        }
      }
      if (booking.status === 'paid' || booking.status === 'pickup' || booking.status === 'in_use') {
        return fail('This booking has already been paid.', 400)
      }
      return fail(`Cannot initiate payment for a booking with status "${booking.status}".`, 400)
    }

    // Duplicate payment check: if a payment already exists and is processing/paid, block
    if (booking.payment && (booking.payment.status === 'processing' || booking.payment.status === 'paid')) {
      return fail('A payment is already in progress or completed for this booking.', 409)
    }

    // Amount in paise (Razorpay requires integer paise)
    const amountInPaise = Math.round(booking.totalPrice * 100)

    // Create Razorpay order
    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${booking.id.slice(-10)}`,
      notes: {
        bookingId: booking.id,
        userId: user.id,
        car: `${booking.car.brand} ${booking.car.name}`,
      },
    })

    // Update the booking to "payment_processing" and store the order ID
    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'payment_processing' },
      })

      if (booking.payment) {
        await tx.payment.update({
          where: { bookingId: booking.id },
          data: {
            razorpayOrderId: order.id,
            status: 'processing',
          },
        })
      } else {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            userId: user.id,
            amount: booking.totalPrice,
            method: 'card',
            status: 'processing',
            razorpayOrderId: order.id,
          },
        })
      }

      await tx.activity.create({
        data: {
          type: 'payment',
          message: `Payment order created for ${booking.car.brand} ${booking.car.name} (₹${booking.totalPrice})`,
          refId: booking.id,
        },
      })
    })

    return ok({
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      bookingStatus: 'payment_processing',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (err) {
    return handleError(err)
  }
}

import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { verifyPaymentSchema } from '@/lib/validations'
import { ok, handleError, unauthorized, fail, notFound } from '@/lib/api-response'

export const runtime = 'nodejs'

/**
 * POST /api/payments/verify
 *
 * Verifies the Razorpay payment signature after checkout completes.
 * If the signature is valid:
 *   - Payment status → "paid", verified = true
 *   - Booking status → "payment_processing" → "paid"
 *   - Points awarded to the customer
 * If the signature is invalid:
 *   - Payment stays in "processing", verified = false
 *   - Booking stays in "payment_processing"
 *   - Returns 400 error
 *
 * This is the "Payment Hold" pattern: the booking only becomes "paid"
 * after cryptographic verification, not just checkout completion.
 */
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const body = await req.json()
    const data = verifyPaymentSchema.parse(body)

    // Find the booking
    const booking = await db.booking.findUnique({
      where: { id: data.bookingId },
      include: { payment: true, car: true },
    })

    if (!booking) return notFound('Booking not found.')
    if (booking.userId !== user.id) return fail('You can only verify your own payments.', 403)

    // Booking must be in payment_processing state
    if (booking.status !== 'payment_processing') {
      if (booking.status === 'paid') {
        return fail('This booking is already paid.', 400)
      }
      return fail(`Cannot verify payment for a booking with status "${booking.status}".`, 400)
    }

    if (!booking.payment) return fail('No payment record found for this booking.', 400)

    // Duplicate verification check
    if (booking.payment.verified) {
      return fail('This payment has already been verified.', 409)
    }

    // Verify the Razorpay signature
    const isValid = verifyRazorpaySignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature,
    )

    if (!isValid) {
      // Signature verification FAILED — payment is not confirmed
      // Keep booking in payment_processing, mark payment as unverified
      await db.payment.update({
        where: { bookingId: booking.id },
        data: {
          razorpayPaymentId: data.razorpayPaymentId,
          razorpaySignature: data.razorpaySignature,
          verified: false,
        },
      })

      await db.activity.create({
        data: {
          type: 'payment',
          message: `Payment signature verification FAILED for booking ${booking.id}`,
          refId: booking.id,
        },
      })

      return fail('Payment signature verification failed. The payment was not confirmed. Please contact support.', 400)
    }

    // Signature is VALID — confirm the payment atomically
    const pointsEarned = Math.round(booking.totalPrice)

    await db.$transaction(async (tx) => {
      // Update payment to "paid" + verified
      await tx.payment.update({
        where: { bookingId: booking.id },
        data: {
          razorpayPaymentId: data.razorpayPaymentId,
          razorpaySignature: data.razorpaySignature,
          verified: true,
          status: 'paid',
          txnRef: data.razorpayPaymentId,
          method: 'razorpay',
        },
      })

      // Update booking to "paid"
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'paid' },
      })

      // Award points (if not already awarded)
      const existingPoints = await tx.pointTransaction.findFirst({
        where: { bookingId: booking.id, amount: { gt: 0 } },
      })
      if (!existingPoints && pointsEarned > 0) {
        await tx.pointTransaction.create({
          data: {
            userId: user.id,
            amount: pointsEarned,
            reason: `Points earned — payment verified for ${booking.car.brand} ${booking.car.name}`,
            bookingId: booking.id,
          },
        })
        await tx.user.update({
          where: { id: user.id },
          data: { points: { increment: pointsEarned } },
        })
      }

      await tx.activity.create({
        data: {
          type: 'payment',
          message: `Payment verified (₹${booking.totalPrice}) for ${booking.car.brand} ${booking.car.name} — booking is now PAID`,
          refId: booking.id,
        },
      })
    })

    return ok({
      verified: true,
      bookingStatus: 'paid',
      pointsEarned,
      message: 'Payment verified successfully. Your booking is now confirmed.',
    })
  } catch (err) {
    return handleError(err)
  }
}

import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { getRazorpay } from '@/lib/razorpay'
import { refundSchema } from '@/lib/validations'
import { ok, handleError, unauthorized, forbidden, fail, notFound } from '@/lib/api-response'

export const runtime = 'nodejs'

/**
 * POST /api/payments/refund
 *
 * Admin-only: initiates a Razorpay refund for a verified payment.
 * - Calls Razorpay's refund API with the payment_id
 * - Updates the payment status to "refunded"
 * - Reverses the awarded points
 * - Moves the booking to "cancelled"
 */
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden('Only administrators can issue refunds.')

    const body = await req.json()
    const data = refundSchema.parse(body)

    const payment = await db.payment.findUnique({
      where: { id: data.paymentId },
      include: {
        booking: { include: { car: true } },
      },
    })

    if (!payment) return notFound('Payment not found.')

    // Must be a verified, paid payment with a Razorpay payment ID
    if (!payment.verified || payment.status !== 'paid') {
      return fail('Only verified, paid payments can be refunded.', 400)
    }
    if (!payment.razorpayPaymentId) {
      return fail('No Razorpay payment ID found for this payment.', 400)
    }

    // Initiate the Razorpay refund
    const razorpay = getRazorpay()
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(payment.amount * 100), // paise
      notes: {
        reason: data.reason,
        adminId: user.id,
        paymentId: payment.id,
      },
    })

    // Update the payment + booking atomically
    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'refunded',
          refundReason: data.reason,
          razorpayRefundId: refund.id,
        },
      })

      // Cancel the booking
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'cancelled' },
      })

      // Reverse the awarded points
      const txn = await tx.pointTransaction.findFirst({
        where: { bookingId: payment.bookingId, amount: { gt: 0 } },
      })
      if (txn) {
        await tx.pointTransaction.create({
          data: {
            userId: payment.userId,
            amount: -txn.amount,
            reason: `Points reversed — refund processed for ${payment.booking.car.brand} ${payment.booking.car.name}`,
            bookingId: payment.bookingId,
          },
        })
        await tx.user.update({
          where: { id: payment.userId },
          data: { points: { decrement: txn.amount } },
        })
      }

      await tx.activity.create({
        data: {
          type: 'payment',
          message: `Refund processed (₹${payment.amount}) for ${payment.booking.car.brand} ${payment.booking.car.name} — refund ID: ${refund.id}`,
          refId: payment.id,
        },
      })
    })

    return ok({
      refundId: refund.id,
      status: 'refunded',
      message: 'Refund processed successfully. Points have been reversed.',
    })
  } catch (err) {
    return handleError(err)
  }
}

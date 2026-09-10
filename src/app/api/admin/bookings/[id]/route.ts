import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { bookingStatusSchema } from '@/lib/validations'
import { ok, handleError, notFound, fail } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

// Allowed workflow transitions (forward + cancellation)
// With Razorpay: booked → payment_processing → paid → pickup → in_use → returned → completed
const FLOW: Record<string, string[]> = {
  booked: ['payment_processing', 'paid', 'cancelled'],
  payment_processing: ['paid', 'cancelled'],
  paid: ['pickup', 'cancelled'],
  pickup: ['in_use'],
  in_use: ['returned'],
  returned: ['completed'],
  completed: [],
  cancelled: [],
}

/** PATCH /api/admin/bookings/[id] — advance booking workflow status */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const { id } = await params
    const booking = await db.booking.findUnique({ where: { id } })
    if (!booking) return notFound('Booking not found.')

    const body = await req.json()
    const { status } = bookingStatusSchema.parse(body)

    const allowed = FLOW[booking.status] || []
    if (!allowed.includes(status)) {
      return fail(
        `Cannot move a "${booking.status}" booking to "${status}". Allowed next steps: ${allowed.length ? allowed.join(', ') : 'none (final state)'}.`,
        400,
      )
    }

    const updated = await db.booking.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        car: { select: { id: true, name: true, brand: true, image: true, pricePerDay: true } },
      },
    })

    // When booking moves to "paid", also mark its payment as paid
    if (status === 'paid') {
      await db.payment.updateMany({
        where: { bookingId: id, status: 'pending' },
        data: { status: 'paid', txnRef: `TXN-${Date.now()}` },
      })
    }
    // If cancelled, refund the payment
    if (status === 'cancelled') {
      await db.payment.updateMany({
        where: { bookingId: id, status: 'paid' },
        data: { status: 'refunded' },
      })
      // Reverse points
      const txn = await db.pointTransaction.findFirst({
        where: { bookingId: id, amount: { gt: 0 } },
      })
      if (txn) {
        await db.pointTransaction.create({
          data: {
            userId: booking.userId,
            amount: -txn.amount,
            reason: 'Points reversed — booking cancelled',
            bookingId: id,
          },
        })
        await db.user.update({
          where: { id: booking.userId },
          data: { points: { decrement: txn.amount } },
        })
      }
    }

    await db.activity.create({
      data: {
        type: 'booking_status',
        message: `Booking for ${updated.car?.name ?? 'car'} moved to "${status}"`,
        refId: id,
      },
    })

    return ok({ booking: updated })
  } catch (err) {
    return handleError(err)
  }
}

const archiveSchema = z.object({ archived: z.boolean() })

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const { id } = await params
    const existing = await db.booking.findUnique({ where: { id } })
    if (!existing) return notFound('Booking not found.')
    const body = await req.json()
    const { archived } = archiveSchema.parse(body)
    const booking = await db.booking.update({ where: { id }, data: { archived } })
    return ok({ booking })
  } catch (err) {
    return handleError(err)
  }
}

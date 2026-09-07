import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { bookingStatusSchema } from '@/lib/validations'
import {
  ok,
  handleError,
  notFound,
  unauthorized,
  forbidden,
  fail,
} from '@/lib/api-response'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

/** PATCH /api/bookings/[id] — admin updates status; user can cancel own */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const { id } = await params
    const booking = await db.booking.findUnique({ where: { id } })
    if (!booking) return notFound('Booking not found.')

    const body = await req.json()
    const { status } = bookingStatusSchema.parse(body)

    const isAdmin = user.role === 'admin'
    const isOwner = booking.userId === user.id

    if (!isAdmin && !isOwner) return forbidden()

    // Users may only cancel their own upcoming bookings.
    if (!isAdmin) {
      if (status !== 'cancelled') {
        return forbidden('You can only cancel your own bookings.')
      }
      if (booking.status === 'completed') {
        return fail('Completed bookings cannot be cancelled.', 400)
      }
      if (booking.status === 'cancelled') {
        return fail('This booking is already cancelled.', 400)
      }
    }

    // If cancelling a previously-confirmed booking, refund the awarded points.
    const wasActive = booking.status === 'confirmed' || booking.status === 'pending'
    const isCancelling = status === 'cancelled'

    const updated = await db.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status },
      })

      if (wasActive && isCancelling) {
        // Reverse the points earned for this booking.
        const txn = await tx.pointTransaction.findFirst({
          where: { bookingId: booking.id, amount: { gt: 0 } },
        })
        if (txn) {
          await tx.pointTransaction.create({
            data: {
              userId: booking.userId,
              amount: -txn.amount,
              reason: `Points reversed — booking cancelled`,
              bookingId: booking.id,
            },
          })
          await tx.user.update({
            where: { id: booking.userId },
            data: { points: { decrement: txn.amount } },
          })
        }
      }

      return updatedBooking
    })

    return ok({ booking: updated })
  } catch (err) {
    return handleError(err)
  }
}

// satisfy Prisma type import for typed where-clauses if needed later
export type _BookingWhere = Prisma.BookingWhereInput

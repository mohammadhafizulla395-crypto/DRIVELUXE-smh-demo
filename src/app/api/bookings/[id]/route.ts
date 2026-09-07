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
    }

    const updated = await db.booking.update({
      where: { id },
      data: { status },
    })

    return ok({ booking: updated })
  } catch (err) {
    return handleError(err)
  }
}

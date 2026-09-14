import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, forbidden, notFound, handleError } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

const ticketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
})

/** PATCH /api/admin/tickets/[id] — update ticket status (admin only) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const { id } = await params
    const existing = await db.supportTicket.findUnique({ where: { id } })
    if (!existing) return notFound('Ticket not found.')

    const body = await req.json()
    const { status } = ticketStatusSchema.parse(body)

    const ticket = await db.supportTicket.update({
      where: { id },
      data: { status },
    })

    return ok({ ticket })
  } catch (err) {
    return handleError(err)
  }
}

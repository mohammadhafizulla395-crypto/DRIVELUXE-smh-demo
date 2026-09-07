import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, forbidden, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/tickets — all support tickets (admin only) */
export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const tickets = await db.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return ok({ tickets })
  } catch (err) {
    return handleError(err)
  }
}

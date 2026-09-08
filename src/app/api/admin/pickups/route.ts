import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/pickups — upcoming pickups (status paid/pickup, startDate >= today) */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pickups = await db.booking.findMany({
    where: {
      status: { in: ['booked', 'paid', 'pickup'] },
      startDate: { gte: today },
      archived: false,
    },
    orderBy: { startDate: 'asc' },
    take: 10,
    include: {
      user: { select: { id: true, name: true, email: true } },
      car: { select: { id: true, name: true, brand: true, image: true } },
    },
  })

  return ok({ pickups })
}

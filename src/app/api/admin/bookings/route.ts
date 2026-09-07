import { db } from '@/lib/db'
import { requireAdmin, parseTableQuery, sortFrom } from '@/lib/admin-helpers'
import { ok } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/bookings — full table */
export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const q = parseTableQuery(req)
  const where: Record<string, unknown> = {}
  where.archived = q.archived === true
  if (q.search) {
    where.OR = [
      { user: { name: { contains: q.search } } },
      { user: { email: { contains: q.search } } },
      { car: { name: { contains: q.search } } },
      { car: { brand: { contains: q.search } } },
      { pickupLocation: { contains: q.search } },
    ]
  }
  if (q.status) where.status = q.status

  const orderBy = sortFrom(q.sort, {
    newest: 'createdAt',
    start: 'startDate',
    end: 'endDate',
    price: 'totalPrice',
  })

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        car: { select: { id: true, name: true, brand: true, image: true, pricePerDay: true } },
        payment: { select: { id: true, status: true, method: true, amount: true } },
      },
    }),
    db.booking.count({ where }),
  ])

  return ok({
    bookings,
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  })
}

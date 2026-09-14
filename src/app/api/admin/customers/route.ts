import { db } from '@/lib/db'
import { requireAdmin, parseTableQuery, sortFrom } from '@/lib/admin-helpers'
import { ok } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/customers — full table of users */
export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const q = parseTableQuery(req)
  const where: Record<string, unknown> = {}
  where.archived = q.archived === true
  where.role = 'user'
  if (q.search) {
    where.OR = [
      { name: { contains: q.search } },
      { email: { contains: q.search } },
      { phone: { contains: q.search } },
    ]
  }

  const orderBy = sortFrom(q.sort, {
    newest: 'createdAt',
    name: 'name',
    points: 'points',
  })

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        points: true,
        role: true,
        archived: true,
        createdAt: true,
        _count: { select: { bookings: true, reviews: true, supportTickets: true } },
      },
    }),
    db.user.count({ where }),
  ])

  return ok({
    customers: users,
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  })
}

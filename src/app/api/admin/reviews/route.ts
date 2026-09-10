import { db } from '@/lib/db'
import { requireAdmin, parseTableQuery, sortFrom } from '@/lib/admin-helpers'
import { ok } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/reviews — full table with review-moderation workflow */
export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const q = parseTableQuery(req)
  const where: Record<string, unknown> = {}
  where.archived = q.archived === true
  if (q.search) {
    where.OR = [
      { comment: { contains: q.search } },
      { user: { name: { contains: q.search } } },
      { car: { name: { contains: q.search } } },
    ]
  }
  if (q.rating) where.rating = Number(q.rating)
  const status = q.status
  if (status) where.status = status

  const orderBy = sortFrom(q.sort, {
    newest: 'createdAt',
    rating: 'rating',
  })

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        car: { select: { id: true, name: true, brand: true, image: true } },
        employee: { select: { id: true, employeeId: true, name: true } },
      },
    }),
    db.review.count({ where }),
  ])

  return ok({
    reviews,
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  })
}

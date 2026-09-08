import { db } from '@/lib/db'
import { requireAdmin, parseTableQuery, sortFrom } from '@/lib/admin-helpers'
import { ok, handleError, notFound, fail } from '@/lib/api-response'
import { z } from 'zod'

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
  // status filter: pending | under_review | recommended | published | rejected
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

const decisionSchema = z.object({
  status: z.enum(['published', 'rejected']),
  adminNote: z.string().default(''),
})

/**
 * PATCH /api/admin/reviews/[id]
 * Admin makes the final decision on a review: publish or reject.
 * Reviews that are "recommended" by an employee can be published or rejected.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const review = await db.review.findUnique({ where: { id } })
    if (!review) return notFound('Review not found.')

    // Only recommended reviews can be decided by admin
    if (!['recommended', 'pending'].includes(review.status)) {
      return fail(`This review is "${review.status}" and cannot be re-decided.`, 400)
    }

    const body = await req.json()
    const { status } = decisionSchema.parse(body)

    const updated = await db.review.update({
      where: { id },
      data: { status },
    })

    await db.activity.create({
      data: { type: 'review', message: `Admin ${status} a review (rating ${review.rating})`, refId: id },
    })

    return ok({ review: updated })
  } catch (err) {
    return handleError(err)
  }
}

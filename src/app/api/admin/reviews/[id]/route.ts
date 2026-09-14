import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok, handleError, notFound, fail } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

const archiveSchema = z.object({ archived: z.boolean() })

/** PATCH /api/admin/reviews/[id] — moderate (archive/restore) a review */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const { id } = await params
    const existing = await db.review.findUnique({ where: { id } })
    if (!existing) return notFound('Review not found.')
    const body = await req.json()
    const { archived } = archiveSchema.parse(body)
    const review = await db.review.update({ where: { id }, data: { archived } })
    await db.activity.create({
      data: { type: 'review', message: `${archived ? 'Hidden' : 'Restored'} review by ${existing.userId}`, refId: id },
    })
    return ok({ review })
  } catch (err) {
    return handleError(err)
  }
}

const decisionSchema = z.object({
  status: z.enum(['published', 'rejected']),
  adminNote: z.string().default(''),
})

/**
 * PUT /api/admin/reviews/[id]
 * Admin makes the final decision on a review: publish or reject.
 * Reviews that are "recommended" by an employee can be published or rejected.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const review = await db.review.findUnique({ where: { id } })
    if (!review) return notFound('Review not found.')

    // Only recommended or pending reviews can be decided by admin
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

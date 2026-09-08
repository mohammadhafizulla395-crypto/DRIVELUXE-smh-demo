import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok, handleError, notFound } from '@/lib/api-response'
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

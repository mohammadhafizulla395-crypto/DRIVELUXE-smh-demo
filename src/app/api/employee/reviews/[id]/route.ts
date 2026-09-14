import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError, fail } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

const recommendSchema = z.object({
  recommendation: z.enum(['approve', 'reject', 'flag']),
  note: z.string().default(''),
})

/**
 * PATCH /api/employee/reviews/[id]
 * Employee reviews a customer review and recommends approve/reject/flag.
 * The review moves to "recommended" status — admin makes the final decision.
 * Employees CANNOT publish reviews.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const { id } = await params
    const review = await db.review.findUnique({ where: { id } })
    if (!review) return fail('Review not found.', 404)

    if (!['pending', 'under_review'].includes(review.status)) {
      return fail(`This review is already "${review.status}" and cannot be re-reviewed.`, 400)
    }

    const body = await req.json()
    const { recommendation, note } = recommendSchema.parse(body)

    const updated = await db.review.update({
      where: { id },
      data: {
        status: 'recommended',
        employeeId: employee.id,
        employeeRecommendation: recommendation,
        employeeNote: note,
        reviewedAt: new Date(),
      },
    })

    await db.employeeReport.create({
      data: {
        employeeId: employee.id,
        type: 'review_recommended',
        description: `Reviewed customer review (rating ${review.rating}) — recommendation: ${recommendation}. Note: ${note || 'N/A'}`,
        refId: review.id,
        status: 'pending',
      },
    })

    return ok({ review: updated })
  } catch (err) {
    return handleError(err)
  }
}

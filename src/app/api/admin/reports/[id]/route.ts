import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok, handleError, notFound } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().default(''),
})

/**
 * PATCH /api/admin/reports/[id]
 * Admin approves or rejects an employee report.
 * If approved and the report is a ticket resolution, close the ticket.
 * If approved and it's a review recommendation, publish/reject the review.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const report = await db.employeeReport.findUnique({ where: { id } })
    if (!report) return notFound('Report not found.')

    const body = await req.json()
    const { status, adminNote } = reviewSchema.parse(body)

    const updated = await db.employeeReport.update({
      where: { id },
      data: { status, adminNote, reviewedAt: new Date() },
    })

    // If approved, take the follow-up action based on report type
    if (status === 'approved') {
      if (report.type === 'ticket_resolved' && report.refId) {
        // Close the ticket
        await db.supportTicket.updateMany({
          where: { id: report.refId, status: 'waiting_approval' },
          data: { status: 'closed', adminNote },
        })
      } else if (report.type === 'review_recommended' && report.refId) {
        // Publish or reject the review based on the employee's recommendation
        const review = await db.review.findUnique({ where: { id: report.refId } })
        if (review && review.employeeRecommendation) {
          const newStatus = review.employeeRecommendation === 'reject' ? 'rejected' : 'published'
          await db.review.update({
            where: { id: review.id },
            data: { status: newStatus },
          })
        }
      }
    }

    await db.activity.create({
      data: {
        type: 'report',
        message: `Admin ${status} report from ${report.employeeId}: ${report.description.slice(0, 80)}`,
        refId: report.id,
      },
    })

    return ok({ report: updated })
  } catch (err) {
    return handleError(err)
  }
}

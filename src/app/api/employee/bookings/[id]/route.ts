import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError, fail } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

const assistSchema = z.object({
  action: z.enum(['extend', 'report_issue']),
  newEndDate: z.string().optional(),
  issueDescription: z.string().optional(),
})

/**
 * PATCH /api/employee/bookings/[id] — employee assists a booking.
 * Can: extend rental request, report issue.
 * Cannot: delete booking, refund money, approve payment (admin only).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const { id } = await params
    const booking = await db.booking.findUnique({ where: { id } })
    if (!booking) return fail('Booking not found.', 404)

    const body = await req.json()
    const { action, newEndDate, issueDescription } = assistSchema.parse(body)

    if (action === 'extend') {
      if (!newEndDate) return fail('New end date is required for extension.', 400)
      const end = new Date(newEndDate)
      if (end <= booking.endDate) return fail('New end date must be after the current end date.', 400)

      await db.employeeReport.create({
        data: {
          employeeId: employee.id,
          type: 'booking_assisted',
          description: `Requested extension for booking ${booking.id}: extend to ${end.toDateString()}. Customer: ${booking.userId}.`,
          refId: booking.id,
          status: 'pending',
        },
      })
      return ok({ message: 'Extension request submitted for admin approval.' })
    }

    if (action === 'report_issue') {
      if (!issueDescription) return fail('Issue description is required.', 400)
      await db.employeeReport.create({
        data: {
          employeeId: employee.id,
          type: 'booking_assisted',
          description: `Reported issue on booking ${booking.id}: ${issueDescription}`,
          refId: booking.id,
          status: 'pending',
        },
      })
      return ok({ message: 'Issue reported to admin.' })
    }

    return fail('Unknown action.', 400)
  } catch (err) {
    return handleError(err)
  }
}

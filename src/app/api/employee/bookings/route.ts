import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError, fail } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

/** GET /api/employee/bookings — all bookings (employees can view to assist customers) */
export async function GET(req: Request) {
  try {
    const { error } = await requireEmployee()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    where.archived = false
    if (status) where.status = status
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { car: { name: { contains: search } } },
        { pickupLocation: { contains: search } },
      ]
    }

    const bookings = await db.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        car: { select: { id: true, name: true, brand: true, image: true, pricePerDay: true } },
        payment: { select: { id: true, status: true, method: true, amount: true } },
      },
    })

    return ok({ bookings })
  } catch (err) {
    return handleError(err)
  }
}

const assistSchema = z.object({
  action: z.enum(['extend', 'report_issue']),
  // for extend: new endDate
  newEndDate: z.string().optional(),
  // for report_issue: description
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

      // Create an employee report for admin to approve the extension
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

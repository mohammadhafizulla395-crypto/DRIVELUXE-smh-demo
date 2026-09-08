import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError, fail } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

/** GET /api/employee/tickets — tickets assigned to this employee + unassigned (available) */
export async function GET(req: Request) {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const scope = searchParams.get('scope') || 'mine' // mine | available | all

    const where: Record<string, unknown> = {}
    if (scope === 'mine') {
      where.assignedEmployeeId = employee.id
    } else if (scope === 'available') {
      where.assignedEmployeeId = null
      where.status = 'open'
    }
    if (status) where.status = status

    const tickets = await db.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      take: 50,
    })

    return ok({ tickets })
  } catch (err) {
    return handleError(err)
  }
}

// Employee ticket workflow: Open → Assigned → Working → Solved → Waiting Approval → Closed
// Employees can: assign to self, move to working, move to solved (→ waiting_approval).
// Employees CANNOT close tickets (only admin).
const FLOW: Record<string, string[]> = {
  open: ['assigned'],
  assigned: ['working', 'reopened'],
  working: ['solved'],
  solved: ['waiting_approval'],
  waiting_approval: [],
  closed: ['reopened'],
  reopened: ['working'],
}

const updateSchema = z.object({
  status: z.enum(['open', 'assigned', 'working', 'solved', 'waiting_approval', 'closed', 'reopened']),
  resolution: z.string().optional(),
})

/** PATCH /api/employee/tickets/[id] — advance ticket workflow (employee scope) */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const { id } = await params
    const ticket = await db.supportTicket.findUnique({ where: { id } })
    if (!ticket) return fail('Ticket not found.', 404)

    const body = await req.json()
    const { status, resolution } = updateSchema.parse(body)

    // Employees cannot close tickets — only admin can
    if (status === 'closed') {
      return fail('Employees cannot close tickets. Move to "waiting_approval" for admin review.', 403)
    }

    // If ticket is open, employee can self-assign
    if (ticket.status === 'open' && status === 'assigned') {
      const updated = await db.supportTicket.update({
        where: { id },
        data: { status: 'assigned', assignedEmployeeId: employee.id },
      })
      await db.activity.create({
        data: { type: 'complaint', message: `${employee.name} assigned ticket "${ticket.subject}" to self`, refId: id },
      })
      return ok({ ticket: updated })
    }

    // For other transitions, employee must own the ticket
    if (ticket.assignedEmployeeId !== employee.id) {
      return fail('You can only update tickets assigned to you.', 403)
    }

    const allowed = FLOW[ticket.status] || []
    if (!allowed.includes(status)) {
      return fail(
        `Cannot move a "${ticket.status}" ticket to "${status}". Allowed: ${allowed.length ? allowed.join(', ') : 'none (final)'}.`,
        400,
      )
    }

    const updateData: Record<string, unknown> = { status }
    if (resolution) updateData.resolution = resolution

    const updated = await db.supportTicket.update({ where: { id }, data: updateData })

    // If moving to waiting_approval, create an employee report for admin review
    if (status === 'waiting_approval') {
      await db.employeeReport.create({
        data: {
          employeeId: employee.id,
          type: 'ticket_resolved',
          description: `Submitted ticket "${ticket.subject}" for admin approval. Resolution: ${resolution || 'N/A'}`,
          refId: id,
          status: 'pending',
        },
      })
      await db.activity.create({
        data: { type: 'report', message: `${employee.name} submitted ticket resolution for admin approval`, refId: id },
      })
    }

    return ok({ ticket: updated })
  } catch (err) {
    return handleError(err)
  }
}

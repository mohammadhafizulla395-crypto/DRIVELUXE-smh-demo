import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok, handleError, notFound, fail } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

// Complaints workflow: Open → In Progress → Resolved → Closed
const FLOW: Record<string, string[]> = {
  open: ['in_progress', 'resolved', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
}

const statusSchema = z.object({ status: z.enum(['open', 'in_progress', 'resolved', 'closed']) })
const archiveSchema = z.object({ archived: z.boolean() })

/** PATCH /api/admin/complaints/[id] — advance status OR archive */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const { id } = await params
    const ticket = await db.supportTicket.findUnique({ where: { id } })
    if (!ticket) return notFound('Ticket not found.')

    const body = await req.json()

    // Archive toggle
    if (typeof body.archived === 'boolean') {
      const { archived } = archiveSchema.parse(body)
      const updated = await db.supportTicket.update({ where: { id }, data: { archived } })
      return ok({ ticket: updated })
    }

    // Status workflow
    const { status } = statusSchema.parse(body)
    const allowed = FLOW[ticket.status] || []
    if (!allowed.includes(status)) {
      return fail(
        `Cannot move an "${ticket.status}" ticket to "${status}". Allowed: ${allowed.length ? allowed.join(', ') : 'none (final)'}.`,
        400,
      )
    }

    const updated = await db.supportTicket.update({ where: { id }, data: { status } })
    await db.activity.create({
      data: { type: 'complaint', message: `Ticket "${ticket.subject}" → ${status}`, refId: id },
    })
    return ok({ ticket: updated })
  } catch (err) {
    return handleError(err)
  }
}

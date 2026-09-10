import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/tickets — tickets assigned to this employee + unassigned (available) */
export async function GET(req: Request) {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const scope = searchParams.get('scope') || 'mine'

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

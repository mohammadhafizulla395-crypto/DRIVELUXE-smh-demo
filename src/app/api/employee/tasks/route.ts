import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError, fail } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/tasks — this employee's tasks */
export async function GET(req: Request) {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { employeeId: employee.id }
    if (status) where.status = status

    const tasks = await db.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return ok({ tasks })
  } catch (err) {
    return handleError(err)
  }
}

/** PATCH /api/employee/tasks/[id] — update task status */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const { id } = await params
    const task = await db.task.findUnique({ where: { id } })
    if (!task) return fail('Task not found.', 404)
    if (task.employeeId !== employee.id) return fail('This is not your task.', 403)

    const body = await req.json()
    const status = body.status
    if (!['pending', 'in_progress', 'done'].includes(status)) {
      return fail('Invalid task status.', 400)
    }

    const updated = await db.task.update({ where: { id }, data: { status } })
    return ok({ task: updated })
  } catch (err) {
    return handleError(err)
  }
}

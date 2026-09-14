import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError, fail } from '@/lib/api-response'

export const runtime = 'nodejs'

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

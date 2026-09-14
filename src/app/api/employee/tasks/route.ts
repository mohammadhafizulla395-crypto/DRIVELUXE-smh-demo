import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError } from '@/lib/api-response'

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

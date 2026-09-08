import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/performance — this employee's performance metrics + recent reports */
export async function GET() {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const [pendingTasks, recentReports] = await Promise.all([
      db.task.count({ where: { employeeId: employee.id, status: { not: 'done' } } }),
      db.employeeReport.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    return ok({
      metrics: {
        ticketsResolved: employee.ticketsResolved,
        averageResponse: employee.avgResponseMin,
        customerRating: employee.customerRating,
        pendingTasks,
      },
      recentReports,
    })
  } catch (err) {
    return handleError(err)
  }
}

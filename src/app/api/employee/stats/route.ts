import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/stats — employee dashboard operational cards */
export async function GET() {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [pendingTasks, assignedTickets, resolvedToday, pendingReports] =
      await Promise.all([
        db.task.count({ where: { employeeId: employee.id, status: { not: 'done' } } }),
        db.supportTicket.count({
          where: {
            assignedEmployeeId: employee.id,
            status: { in: ['assigned', 'working', 'reopened'] },
          },
        }),
        db.employeeReport.count({
          where: {
            employeeId: employee.id,
            type: 'ticket_resolved',
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
        db.employeeReport.count({ where: { employeeId: employee.id, status: 'pending' } }),
      ])

    return ok({ pendingTasks, assignedTickets, resolvedToday, pendingReports })
  } catch (err) {
    return handleError(err)
  }
}

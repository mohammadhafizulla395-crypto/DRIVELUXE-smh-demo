import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/attendance — this employee's attendance records (last 30 days) */
export async function GET() {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const records = await db.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'desc' },
    })

    return ok({ attendance: records })
  } catch (err) {
    return handleError(err)
  }
}

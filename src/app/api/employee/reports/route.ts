import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/reports — this employee's submitted reports (audit trail) */
export async function GET() {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const reports = await db.employeeReport.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return ok({ reports })
  } catch (err) {
    return handleError(err)
  }
}

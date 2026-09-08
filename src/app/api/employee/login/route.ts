import { db } from '@/lib/db'
import { verifyPassword, signEmployeeToken, setEmployeeCookie } from '@/lib/auth'
import { z } from 'zod'
import { ok, handleError, fail } from '@/lib/api-response'

export const runtime = 'nodejs'

// Employee login: Employee ID (EMP-XXXX) + password — NOT email
const employeeLoginSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * POST /api/employee/login
 * Employee portal authentication. Uses Employee ID (EMP-XXXX) not email.
 * Suspended employees are rejected.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = employeeLoginSchema.parse(body)

    const employee = await db.employee.findUnique({
      where: { employeeId: data.employeeId.toUpperCase() },
    })
    if (!employee) {
      return fail('Incorrect Employee ID or password.', 401)
    }

    const valid = await verifyPassword(data.password, employee.password)
    if (!valid) {
      return fail('Incorrect Employee ID or password.', 401)
    }

    if (employee.status === 'suspended') {
      return fail(
        'Your account has been suspended. Please contact your administrator.',
        403,
      )
    }
    if (employee.status === 'inactive') {
      return fail('Your account is inactive. Please contact your administrator.', 403)
    }

    const token = signEmployeeToken({
      employeeId: employee.id,
      employeeCode: employee.employeeId,
      role: employee.role,
    })
    await setEmployeeCookie(token)

    return ok({
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        status: employee.status,
        ticketsResolved: employee.ticketsResolved,
        avgResponseMin: employee.avgResponseMin,
        customerRating: employee.customerRating,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}

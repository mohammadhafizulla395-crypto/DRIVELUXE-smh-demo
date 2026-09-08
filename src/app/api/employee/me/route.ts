import { getEmployeeFromRequest } from '@/lib/auth'
import { ok, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/me — current employee session */
export async function GET() {
  const employee = await getEmployeeFromRequest()
  if (!employee) return unauthorized('Not authenticated.')
  return ok({ employee })
}

import { clearEmployeeCookie } from '@/lib/auth'
import { ok } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function POST() {
  await clearEmployeeCookie()
  return ok({ message: 'Logged out successfully.' })
}

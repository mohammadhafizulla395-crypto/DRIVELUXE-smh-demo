import { clearAuthCookie } from '@/lib/auth'
import { ok, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function POST() {
  try {
    await clearAuthCookie()
    return ok({ message: 'Logged out successfully.' })
  } catch (err) {
    return handleError(err)
  }
}

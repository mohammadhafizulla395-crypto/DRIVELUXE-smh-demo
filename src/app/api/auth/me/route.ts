import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized('Not authenticated.')
    return ok({ user })
  } catch (err) {
    return handleError(err)
  }
}

import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET() {
  const user = await getUserFromRequest()
  if (!user) return unauthorized('Not authenticated.')
  return ok({ user })
}

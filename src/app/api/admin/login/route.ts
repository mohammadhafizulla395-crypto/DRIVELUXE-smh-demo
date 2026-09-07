import { db } from '@/lib/db'
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { ok, handleError, fail } from '@/lib/api-response'

export const runtime = 'nodejs'

/**
 * POST /api/admin/login
 * Separate admin-portal login. Accepts the same credentials shape but ONLY
 * authenticates accounts with role === 'admin'. Non-admins are rejected.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = loginSchema.parse(body)

    const user = await db.user.findUnique({ where: { email: data.email } })
    if (!user) {
      return fail('Incorrect email or password.', 401)
    }

    const valid = await verifyPassword(data.password, user.password)
    if (!valid) {
      return fail('Incorrect email or password.', 401)
    }

    if (user.role !== 'admin') {
      return fail(
        'This portal is for administrators only. Please use the main site to log in.',
        403,
      )
    }

    const token = signToken({ userId: user.id, role: user.role })
    await setAuthCookie(token)

    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        points: user.points,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}

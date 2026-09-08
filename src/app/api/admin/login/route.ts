import { db } from '@/lib/db'
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth'
import { z } from 'zod'
import { ok, handleError, fail } from '@/lib/api-response'

export const runtime = 'nodejs'

// 3-step admin login: email + password + 6-digit PIN
const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  pin: z.string().length(6, 'Admin PIN must be exactly 6 digits').regex(/^\d{6}$/, 'PIN must be digits only'),
})

/**
 * POST /api/admin/login
 * Three-layer admin authentication:
 *   Step 1: Admin email
 *   Step 2: Password
 *   Step 3: 6-digit Admin PIN
 * All three are submitted together but validated in sequence so the response
 * tells the user which step failed.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = adminLoginSchema.parse(body)

    // Step 1: find user by email
    const user = await db.user.findUnique({ where: { email: data.email } })
    if (!user) {
      return fail('Incorrect email, password, or PIN.', 401)
    }

    // Must be an admin
    if (user.role !== 'admin') {
      return fail(
        'This portal is for administrators only. Please use the main site to log in.',
        403,
      )
    }

    // Step 2: verify password
    const validPassword = await verifyPassword(data.password, user.password)
    if (!validPassword) {
      return fail('Incorrect email, password, or PIN.', 401)
    }

    // Step 3: verify 6-digit PIN
    if (!user.pin) {
      return fail('No admin PIN is set on this account. Contact the system owner.', 500)
    }
    if (user.pin !== data.pin) {
      return fail('Incorrect admin PIN. Please try again.', 401)
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

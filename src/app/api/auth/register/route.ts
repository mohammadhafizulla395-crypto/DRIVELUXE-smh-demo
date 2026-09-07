import { db } from '@/lib/db'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'
import { created, handleError, fail } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    const existing = await db.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return fail('An account with this email already exists.', 409)
    }

    const password = await hashPassword(data.password)
    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password,
        role: 'user',
      },
      select: { id: true, name: true, email: true, role: true, phone: true, points: true },
    })

    const token = signToken({ userId: user.id, role: user.role })
    await setAuthCookie(token)

    return created({ user })
  } catch (err) {
    return handleError(err)
  }
}

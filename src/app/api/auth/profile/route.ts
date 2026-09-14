import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { profileSchema } from '@/lib/validations'
import { ok, handleError, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const body = await req.json()
    const data = profileSchema.parse(body)

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        phone: data.phone ? data.phone : null,
      },
      select: { id: true, name: true, email: true, role: true, phone: true, points: true },
    })

    return ok({ user: updated })
  } catch (err) {
    return handleError(err)
  }
}

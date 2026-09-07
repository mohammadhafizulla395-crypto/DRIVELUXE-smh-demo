import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { supportSchema } from '@/lib/validations'
import { ok, created, handleError, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/support — list the current user's support tickets */
export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const tickets = await db.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return ok({ tickets })
  } catch (err) {
    return handleError(err)
  }
}

/** POST /api/support — create a support ticket (problem submission) */
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const body = await req.json()
    const data = supportSchema.parse(body)

    const ticket = await db.supportTicket.create({
      data: {
        userId: user.id,
        subject: data.subject,
        category: data.category,
        message: data.message,
        status: 'open',
      },
    })

    return created({ ticket })
  } catch (err) {
    return handleError(err)
  }
}

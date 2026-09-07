import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ok, handleError, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/reviews/mine — list reviews written by the current user */
export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const reviews = await db.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        car: { select: { id: true, name: true, brand: true, image: true } },
      },
    })

    return ok({ reviews })
  } catch (err) {
    return handleError(err)
  }
}

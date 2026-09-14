import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ok, handleError, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/points — current user's points balance + transaction history */
export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const transactions = await db.pointTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return ok({
      points: user.points,
      transactions,
    })
  } catch (err) {
    return handleError(err)
  }
}

import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ok, handleError, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/payments — current customer's own payment history */
export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const payments = await db.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            status: true,
            car: { select: { id: true, name: true, brand: true, image: true } },
          },
        },
      },
    })

    return ok({ payments })
  } catch (err) {
    return handleError(err)
  }
}

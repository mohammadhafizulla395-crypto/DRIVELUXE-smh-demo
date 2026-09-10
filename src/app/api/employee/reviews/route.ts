import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/reviews — reviews pending employee review */
export async function GET(req: Request) {
  try {
    const { error } = await requireEmployee()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const where: Record<string, unknown> = { status }
    const reviews = await db.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } },
        car: { select: { id: true, name: true, brand: true, image: true } },
      },
    })

    return ok({ reviews })
  } catch (err) {
    return handleError(err)
  }
}

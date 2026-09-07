import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { reviewSchema } from '@/lib/validations'
import { ok, created, handleError, unauthorized, fail } from '@/lib/api-response'

export const runtime = 'nodejs'

/**
 * GET /api/reviews?carId=X  — public list of reviews for a car
 * GET /api/reviews           — (no carId) ignored; use /mine for own reviews
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const carId = searchParams.get('carId')

    if (!carId) {
      return ok({ reviews: [] })
    }

    const reviews = await db.review.findMany({
      where: { carId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    return ok({ reviews })
  } catch (err) {
    return handleError(err)
  }
}

/** POST /api/reviews — create a review (must be logged in + have booked the car) */
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const body = await req.json()
    const data = reviewSchema.parse(body)

    const car = await db.car.findUnique({ where: { id: data.carId } })
    if (!car) return fail('The selected car no longer exists.', 404)

    // Eligibility: the user must have a non-cancelled booking for this car.
    const hasBooking = await db.booking.findFirst({
      where: {
        userId: user.id,
        carId: data.carId,
        status: { not: 'cancelled' },
      },
    })
    if (!hasBooking) {
      return fail(
        'You can only review cars you have booked.',
        403,
      )
    }

    // One review per user per car (enforced by @@unique).
    const existing = await db.review.findUnique({
      where: { userId_carId: { userId: user.id, carId: data.carId } },
    })
    if (existing) {
      return fail('You have already reviewed this car.', 409)
    }

    const review = await db.review.create({
      data: {
        userId: user.id,
        carId: data.carId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    return created({ review })
  } catch (err) {
    return handleError(err)
  }
}

import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { bookingSchema } from '@/lib/validations'
import {
  ok,
  created,
  handleError,
  unauthorized,
  fail,
} from '@/lib/api-response'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime()
  const days = Math.round(ms / (1000 * 60 * 60 * 24))
  return Math.max(1, days)
}

// Points earned per dollar spent. 1 point per $1.
const POINTS_PER_DOLLAR = 1

/**
 * GET /api/bookings
 *  - admin: all bookings
 *  - user: own bookings only
 */
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: Prisma.BookingWhereInput = {}
    if (user.role !== 'admin') where.userId = user.id
    if (status) where.status = status

    const bookings = await db.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        car: {
          select: {
            id: true,
            name: true,
            brand: true,
            image: true,
            pricePerDay: true,
          },
        },
        user:
          user.role === 'admin'
            ? { select: { id: true, name: true, email: true } }
            : false,
      },
    })

    return ok({ bookings })
  } catch (err) {
    return handleError(err)
  }
}

/** POST /api/bookings — create booking (overlap check) + award points */
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    const body = await req.json()
    const data = bookingSchema.parse(body)

    const car = await db.car.findUnique({ where: { id: data.carId } })
    if (!car) return fail('The selected car no longer exists.', 404)
    if (!car.available) return fail('This car is currently unavailable.', 400)

    // The schema's refine guarantees endDate >= startDate (both valid dates).
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 0)

    if (startDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      return fail('Pickup date cannot be in the past.', 400)
    }

    // Overlap check: any active (non-cancelled) booking for this car that
    // intersects the requested range.
    const overlapping = await db.booking.findFirst({
      where: {
        carId: car.id,
        status: { not: 'cancelled' },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    })
    if (overlapping) {
      return fail(
        'This car is already booked for part of your selected dates. Please choose different dates.',
        409,
      )
    }

    const totalDays = daysBetween(startDate, endDate)
    const totalPrice = Math.round(totalDays * car.pricePerDay * 100) / 100
    const pointsEarned = Math.round(totalPrice * POINTS_PER_DOLLAR)

    // Atomic: create booking + pending payment + award points + activity.
    const booking = await db.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          userId: user.id,
          carId: car.id,
          startDate,
          endDate,
          totalDays,
          totalPrice,
          pickupLocation: data.pickupLocation,
          status: 'booked',
        },
        include: {
          car: {
            select: {
              id: true,
              name: true,
              brand: true,
              image: true,
              pricePerDay: true,
            },
          },
        },
      })

      // Create a pending payment for this booking (admin marks it paid)
      await tx.payment.create({
        data: {
          bookingId: created.id,
          userId: user.id,
          amount: totalPrice,
          method: 'card',
          status: 'pending',
        },
      })

      if (pointsEarned > 0) {
        await tx.pointTransaction.create({
          data: {
            userId: user.id,
            amount: pointsEarned,
            reason: `Points earned — booking for ${car.brand} ${car.name}`,
            bookingId: created.id,
          },
        })
        await tx.user.update({
          where: { id: user.id },
          data: { points: { increment: pointsEarned } },
        })
      }

      await tx.activity.create({
        data: {
          type: 'booking_created',
          message: `${user.name} booked ${car.brand} ${car.name} (${totalDays}d, $${totalPrice})`,
          refId: created.id,
        },
      })

      return created
    })

    return created({ booking, pointsEarned })
  } catch (err) {
    return handleError(err)
  }
}

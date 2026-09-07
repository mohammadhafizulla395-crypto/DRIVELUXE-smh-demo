import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, forbidden, handleError } from '@/lib/api-response'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const [totalCars, totalBookings, totalUsers, confirmedBookings, cars] =
      await Promise.all([
        db.car.count(),
        db.booking.count(),
        db.user.count(),
        db.booking.findMany({
          where: { status: { in: ['confirmed', 'completed'] } },
          select: { totalPrice: true, status: true },
        }),
        db.car.findMany({ select: { available: true, type: true } }),
      ])

    const revenue = confirmedBookings.reduce(
      (sum, b) => sum + b.totalPrice,
      0,
    )
    const availableCars = cars.filter((c) => c.available).length

    const typeCount: Record<string, number> = {}
    for (const c of cars) typeCount[c.type] = (typeCount[c.type] || 0) + 1

    return ok({
      totalCars,
      availableCars,
      totalBookings,
      totalUsers,
      revenue: Math.round(revenue * 100) / 100,
      fleetByType: typeCount,
    })
  } catch (err) {
    return handleError(err)
  }
}

// satisfy the import of Prisma type for future typed where-clauses
export type _AdminStatsWhere = Prisma.CarWhereInput

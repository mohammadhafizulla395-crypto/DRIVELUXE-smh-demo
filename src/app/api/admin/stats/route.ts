import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, forbidden } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET() {
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

  const revenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0)
  const availableCars = cars.filter((c) => c.available).length

  // bookings per type
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
}

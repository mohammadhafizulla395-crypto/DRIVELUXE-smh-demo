import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok } from '@/lib/api-response'

export const runtime = 'nodejs'

/**
 * GET /api/admin/settings
 * Returns operational settings + owner contact (hardcoded per project spec).
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const [totalCars, activeBookings, totalUsers, totalRevenue] = await Promise.all([
    db.car.count({ where: { archived: false } }),
    db.booking.count({ where: { status: { in: ['booked', 'paid', 'pickup', 'in_use'] } } }),
    db.user.count({ where: { role: 'user', archived: false } }),
    db.payment.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true },
    }),
  ])

  return ok({
    owner: {
      name: 'Hafizulla',
      phone: '91000527275',
      email: 'hafizullas58@gmail.com',
    },
    system: {
      totalCars,
      activeBookings,
      totalUsers,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      version: '2.5',
      environment: process.env.NODE_ENV,
    },
  })
}

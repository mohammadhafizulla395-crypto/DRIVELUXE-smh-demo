import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ok, unauthorized, forbidden, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/stats — operational dashboard cards (no graphs) */
export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      bookingsToday,
      pendingPickups,
      pendingReturns,
      openComplaints,
      totalCars,
      totalBookings,
      totalUsers,
      paidPayments,
    ] = await Promise.all([
      // Bookings created today
      db.booking.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      // Pending pickups: status is 'paid' or 'pickup' (customer paid, waiting for/doing pickup)
      db.booking.count({ where: { status: { in: ['paid', 'pickup'] } } }),
      // Pending returns: car is in use, due to be returned
      db.booking.count({ where: { status: 'in_use' } }),
      // Open complaints
      db.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      db.car.count({ where: { archived: false } }),
      db.booking.count({ where: { archived: false } }),
      db.user.count({ where: { archived: false } }),
      db.payment.findMany({
        where: { status: 'paid' },
        select: { amount: true },
      }),
    ])

    const revenue = paidPayments.reduce((sum, p) => sum + p.amount, 0)

    return ok({
      bookingsToday,
      pendingPickups,
      pendingReturns,
      openComplaints,
      totalCars,
      totalBookings,
      totalUsers,
      revenue: Math.round(revenue * 100) / 100,
    })
  } catch (err) {
    return handleError(err)
  }
}

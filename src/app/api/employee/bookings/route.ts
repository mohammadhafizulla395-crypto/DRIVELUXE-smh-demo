import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/bookings — all bookings (employees can view to assist customers) */
export async function GET(req: Request) {
  try {
    const { error } = await requireEmployee()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    where.archived = false
    if (status) where.status = status
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { car: { name: { contains: search } } },
        { pickupLocation: { contains: search } },
      ]
    }

    const bookings = await db.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        car: { select: { id: true, name: true, brand: true, image: true, pricePerDay: true } },
        payment: { select: { id: true, status: true, method: true, amount: true } },
      },
    })

    return ok({ bookings })
  } catch (err) {
    return handleError(err)
  }
}

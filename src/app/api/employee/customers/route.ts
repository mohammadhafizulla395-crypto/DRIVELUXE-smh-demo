import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/customers — searchable customer list (read-only for employees) */
export async function GET(req: Request) {
  try {
    const { error } = await requireEmployee()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()

    const where: Record<string, unknown> = { role: 'user', archived: false }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const customers = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        points: true,
        createdAt: true,
        _count: { select: { bookings: true, supportTickets: true } },
      },
    })

    return ok({ customers })
  } catch (err) {
    return handleError(err)
  }
}

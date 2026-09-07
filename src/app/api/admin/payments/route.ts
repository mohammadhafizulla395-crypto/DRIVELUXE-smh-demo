import { db } from '@/lib/db'
import { requireAdmin, parseTableQuery, sortFrom } from '@/lib/admin-helpers'
import { ok } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/payments — full table */
export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const q = parseTableQuery(req)
  const where: Record<string, unknown> = {}
  if (q.search) {
    where.OR = [
      { txnRef: { contains: q.search } },
      { user: { name: { contains: q.search } } },
      { user: { email: { contains: q.search } } },
    ]
  }
  if (q.status) where.status = q.status
  if (q.method) where.method = q.method

  const orderBy = sortFrom(q.sort, {
    newest: 'createdAt',
    amount: 'amount',
  })

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        booking: {
          select: {
            id: true, startDate: true, endDate: true, totalPrice: true,
            car: { select: { id: true, name: true, brand: true } },
          },
        },
      },
    }),
    db.payment.count({ where }),
  ])

  return ok({
    payments,
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  })
}

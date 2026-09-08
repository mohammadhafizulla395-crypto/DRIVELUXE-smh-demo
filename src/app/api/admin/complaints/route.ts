import { db } from '@/lib/db'
import { requireAdmin, parseTableQuery, sortFrom } from '@/lib/admin-helpers'
import { ok } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/complaints — full table */
export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const q = parseTableQuery(req)
  const where: Record<string, unknown> = {}
  where.archived = q.archived === true
  if (q.search) {
    where.OR = [
      { subject: { contains: q.search } },
      { message: { contains: q.search } },
      { user: { name: { contains: q.search } } },
      { user: { email: { contains: q.search } } },
    ]
  }
  if (q.status) where.status = q.status
  if (q.category) where.category = q.category

  const orderBy = sortFrom(q.sort, {
    newest: 'createdAt',
    updated: 'updatedAt',
  })

  const [tickets, total] = await Promise.all([
    db.supportTicket.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.supportTicket.count({ where }),
  ])

  return ok({
    complaints: tickets,
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  })
}

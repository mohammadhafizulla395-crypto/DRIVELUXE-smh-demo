import { db } from '@/lib/db'
import { requireAdmin, parseTableQuery, sortFrom } from '@/lib/admin-helpers'
import { ok } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/reports — all employee reports (for admin review) */
export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const q = parseTableQuery(req)
  const where: Record<string, unknown> = {}
  if (q.status) where.status = q.status
  if (q.type) where.type = q.type
  if (q.search) {
    where.OR = [
      { description: { contains: q.search } },
      { employee: { name: { contains: q.search } } },
      { employee: { employeeId: { contains: q.search } } },
    ]
  }

  const orderBy = sortFrom(q.sort, { newest: 'createdAt' })

  const [reports, total] = await Promise.all([
    db.employeeReport.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: {
        employee: { select: { id: true, employeeId: true, name: true, role: true } },
      },
    }),
    db.employeeReport.count({ where }),
  ])

  return ok({
    reports,
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  })
}

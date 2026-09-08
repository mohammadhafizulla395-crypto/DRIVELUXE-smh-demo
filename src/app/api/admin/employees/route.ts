import { db } from '@/lib/db'
import { requireAdmin, parseTableQuery, sortFrom } from '@/lib/admin-helpers'
import { hashPassword } from '@/lib/auth'
import { ok, created, handleError, fail } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

/** GET /api/admin/employees — full employee table */
export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const q = parseTableQuery(req)
  const where: Record<string, unknown> = {}
  if (q.search) {
    where.OR = [
      { name: { contains: q.search } },
      { employeeId: { contains: q.search } },
      { email: { contains: q.search } },
    ]
  }
  if (q.role) where.role = q.role
  if (q.status) where.status = q.status

  const orderBy = sortFrom(q.sort, {
    newest: 'createdAt',
    name: 'name',
    tickets: 'ticketsResolved',
  })

  const [employees, total] = await Promise.all([
    db.employee.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        ticketsResolved: true,
        avgResponseMin: true,
        customerRating: true,
        createdAt: true,
        _count: { select: { reports: true, assignedTickets: true } },
      },
    }),
    db.employee.count({ where }),
  ])

  return ok({
    employees,
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  })
}

const createSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  role: z.enum(['support', 'fleet', 'customer_care']).default('support'),
})

/** POST /api/admin/employees — create a new employee (admin only) */
export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await req.json()
    const data = createSchema.parse(body)

    // Check email uniqueness
    const existing = await db.employee.findUnique({ where: { email: data.email } })
    if (existing) return fail('An employee with this email already exists.', 409)

    // Generate next employee ID (EMP-XXXX)
    const count = await db.employee.count()
    const employeeId = `EMP-${1001 + count}`

    // Default password — employee changes on first login (not implemented in portfolio)
    const password = await hashPassword('emp123')

    const employee = await db.employee.create({
      data: {
        employeeId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        password,
        role: data.role,
        status: 'active',
      },
    })

    await db.activity.create({
      data: { type: 'employee', message: `Created employee ${employee.employeeId} (${employee.name})`, refId: employee.id },
    })

    return created({
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
        defaultPassword: 'emp123',
      },
    })
  } catch (err) {
    return handleError(err)
  }
}

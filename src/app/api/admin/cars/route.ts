import { db } from '@/lib/db'
import { requireAdmin, parseTableQuery, sortFrom } from '@/lib/admin-helpers'
import { carSchema } from '@/lib/validations'
import { ok, created, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/cars — full table (search, filter, sort, pagination, archived toggle) */
export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const q = parseTableQuery(req)
  const where: Record<string, unknown> = {}
  where.archived = q.archived === true
  if (q.search) {
    where.OR = [
      { name: { contains: q.search } },
      { brand: { contains: q.search } },
    ]
  }
  if (q.type) where.type = q.type
  if (q.transmission) where.transmission = q.transmission
  if (q.fuel) where.fuel = q.fuel

  const orderBy = sortFrom(q.sort, {
    newest: 'createdAt',
    name: 'name',
    price: 'pricePerDay',
    year: 'year',
  })

  const [cars, total] = await Promise.all([
    db.car.findMany({ where, orderBy, skip: (q.page - 1) * q.limit, take: q.limit }),
    db.car.count({ where }),
  ])

  return ok({
    cars,
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  })
}

/** POST /api/admin/cars — create */
export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const body = await req.json()
    const data = carSchema.parse(body)
    const car = await db.car.create({ data })
    await db.activity.create({
      data: { type: 'car', message: `Car created: ${car.brand} ${car.name}`, refId: car.id },
    })
    return created({ car })
  } catch (err) {
    return handleError(err)
  }
}

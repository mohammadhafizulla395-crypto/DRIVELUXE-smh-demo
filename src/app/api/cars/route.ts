import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { carSchema } from '@/lib/validations'
import {
  ok,
  created,
  handleError,
  unauthorized,
  forbidden,
} from '@/lib/api-response'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

/**
 * GET /api/cars
 * Query params: search, type, transmission, fuel, minPrice, maxPrice,
 *               sort (newest|price-asc|price-desc), featured, page, limit
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const type = searchParams.get('type') || ''
    const transmission = searchParams.get('transmission') || ''
    const fuel = searchParams.get('fuel') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sort = searchParams.get('sort') || 'newest'
    const featuredOnly = searchParams.get('featured') === 'true'
    const pageParam = Number(searchParams.get('page') || '1')
    const limitParam = Number(searchParams.get('limit') || '9')
    const page = Number.isFinite(pageParam) ? Math.max(1, Math.floor(pageParam)) : 1
    const limit = Number.isFinite(limitParam)
      ? Math.min(24, Math.max(1, Math.floor(limitParam)))
      : 9
    const onlyAvailable = searchParams.get('available') !== 'false'

    const where: Prisma.CarWhereInput = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
      ]
    }
    if (type) where.type = type
    if (transmission) where.transmission = transmission
    if (fuel) where.fuel = fuel
    if (featuredOnly) where.featured = true
    if (onlyAvailable) where.available = true

    if (minPrice || maxPrice) {
      const range: Prisma.FloatFilter = {}
      if (minPrice) range.gte = Number(minPrice)
      if (maxPrice) range.lte = Number(maxPrice)
      where.pricePerDay = range
    }

    const orderBy =
      sort === 'price-asc'
        ? { pricePerDay: 'asc' as const }
        : sort === 'price-desc'
          ? { pricePerDay: 'desc' as const }
          : { createdAt: 'desc' as const }

    const [cars, total] = await Promise.all([
      db.car.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.car.count({ where }),
    ])

    return ok({
      cars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (err) {
    return handleError(err)
  }
}

/** POST /api/cars — admin only */
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const body = await req.json()
    const data = carSchema.parse(body)

    const car = await db.car.create({ data })
    return created({ car })
  } catch (err) {
    return handleError(err)
  }
}

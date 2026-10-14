import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { carSchema } from '@/lib/validations'
import { FLEET, type StaticCar } from '@/data/fleet'
import {
  ok,
  created,
  handleError,
  unauthorized,
  forbidden,
} from '@/lib/api-response'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

/** Number of rows the bundled fallback fleet holds. */
const STATIC_FLEET_SIZE = FLEET.length

/**
 * The database is only probed once per process. When it is
 * unreachable (serverless SQLite) every request would otherwise
 * pay the same failing round-trip, so the first failure latches
 * the fallback on for the rest of the process lifetime.
 */
let dbAvailable = true

/**
 * Apply the same filters/pagination the database query uses to the
 * bundled fleet, so the public listing degrades gracefully instead
 * of returning a 500 when no database is reachable (the serverless
 * deployment cannot open an SQLite file).
 */
function staticCars(params: {
  search: string
  type: string
  transmission: string
  fuel: string
  minPrice: string | null
  maxPrice: string | null
  featuredOnly: boolean
  onlyAvailable: boolean
  sort: string
  page: number
  limit: number
}) {
  const {
    search, type, transmission, fuel, minPrice, maxPrice,
    featuredOnly, onlyAvailable, sort, page, limit,
  } = params

  const needle = search.toLowerCase()
  let rows: StaticCar[] = FLEET.filter((car) => {
    if (featuredOnly && !car.featured) return false
    if (onlyAvailable && !car.available) return false
    if (type && car.type !== type) return false
    if (transmission && car.transmission !== transmission) return false
    if (fuel && car.fuel !== fuel) return false
    if (minPrice && car.pricePerDay < Number(minPrice)) return false
    if (maxPrice && car.pricePerDay > Number(maxPrice)) return false
    if (needle) {
      const hay = `${car.name} ${car.brand}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })

  if (sort === 'price-asc') {
    rows = [...rows].sort((a, b) => a.pricePerDay - b.pricePerDay)
  } else if (sort === 'price-desc') {
    rows = [...rows].sort((a, b) => b.pricePerDay - a.pricePerDay)
  } else {
    rows = [...rows].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  const total = rows.length
  return {
    cars: rows.slice((page - 1) * limit, page * limit),
    total,
  }
}

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

    let cars
    let total
    let fromBundled = false
    if (dbAvailable) {
      try {
        ;[cars, total] = await Promise.all([
          db.car.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.car.count({ where }),
        ])
      } catch (dbErr) {
        // No reachable database (SQLite cannot be opened in a
        // serverless deployment). Serve the bundled fleet so the
        // public listing keeps working, then stop retrying the
        // database for the rest of this process.
        dbAvailable = false
        fromBundled = true
        console.warn(
          '[api/cars] database unavailable, serving bundled fleet:',
          dbErr instanceof Error ? dbErr.message : dbErr,
        )
      }
    } else {
      fromBundled = true
    }

    if (fromBundled) {
      const fallback = staticCars({
        search, type, transmission, fuel, minPrice, maxPrice,
        featuredOnly, onlyAvailable, sort, page, limit,
      })
      cars = fallback.cars as typeof cars
      total = fallback.total
    }

    return ok({
      cars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      source: fromBundled ? 'bundled' : 'database',
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

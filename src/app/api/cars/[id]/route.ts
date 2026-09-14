import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { carUpdateSchema } from '@/lib/validations'
import {
  ok,
  handleError,
  notFound,
  unauthorized,
  forbidden,
} from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const car = await db.car.findUnique({ where: { id } })
    if (!car) return notFound('Car not found.')

    // related cars (same type, excluding current)
    const related = await db.car.findMany({
      where: { type: car.type, id: { not: car.id }, available: true },
      take: 4,
      orderBy: { createdAt: 'desc' },
    })

    return ok({ car, related })
  } catch (err) {
    return handleError(err)
  }
}

/** PUT /api/cars/[id] — admin only (partial update) */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const { id } = await params
    const existing = await db.car.findUnique({ where: { id } })
    if (!existing) return notFound('Car not found.')

    const body = await req.json()
    const data = carUpdateSchema.parse(body)

    const car = await db.car.update({ where: { id }, data })
    return ok({ car })
  } catch (err) {
    return handleError(err)
  }
}

/** DELETE /api/cars/[id] — admin only */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()
    if (user.role !== 'admin') return forbidden()

    const { id } = await params
    const existing = await db.car.findUnique({ where: { id } })
    if (!existing) return notFound('Car not found.')

    await db.car.delete({ where: { id } })
    return ok({ message: 'Car deleted.' })
  } catch (err) {
    return handleError(err)
  }
}

import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { carSchema } from '@/lib/validations'
import { ok, handleError, notFound } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const { id } = await params
    const car = await db.car.findUnique({ where: { id } })
    if (!car) return notFound('Car not found.')
    return ok({ car })
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const { id } = await params
    const existing = await db.car.findUnique({ where: { id } })
    if (!existing) return notFound('Car not found.')
    const body = await req.json()
    const data = carSchema.parse(body)
    const car = await db.car.update({ where: { id }, data })
    await db.activity.create({
      data: { type: 'car', message: `Car updated: ${car.brand} ${car.name}`, refId: car.id },
    })
    return ok({ car })
  } catch (err) {
    return handleError(err)
  }
}

// Archive instead of hard delete
const archiveSchema = z.object({ archived: z.boolean() })

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const { id } = await params
    const existing = await db.car.findUnique({ where: { id } })
    if (!existing) return notFound('Car not found.')
    const body = await req.json()
    const { archived } = archiveSchema.parse(body)
    const car = await db.car.update({ where: { id }, data: { archived } })
    await db.activity.create({
      data: {
        type: 'car',
        message: `${archived ? 'Archived' : 'Restored'} car: ${existing.brand} ${existing.name}`,
        refId: existing.id,
      },
    })
    return ok({ car })
  } catch (err) {
    return handleError(err)
  }
}

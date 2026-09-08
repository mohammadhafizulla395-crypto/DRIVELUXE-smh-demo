import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok, handleError } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1, 'Select at least one item.'),
  action: z.enum(['archive', 'restore', 'setAvailable', 'setUnavailable']),
})

/** POST /api/admin/cars/bulk — bulk archive/restore/availability */
export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const body = await req.json()
    const { ids, action } = bulkSchema.parse(body)

    let data: Record<string, unknown> = {}
    if (action === 'archive') data.archived = true
    if (action === 'restore') data.archived = false
    if (action === 'setAvailable') data = { available: true, archived: false }
    if (action === 'setUnavailable') data.available = false

    const result = await db.car.updateMany({ where: { id: { in: ids } }, data })
    return ok({ updated: result.count })
  } catch (err) {
    return handleError(err)
  }
}

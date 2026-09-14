import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok, handleError } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1, 'Select at least one item.'),
  action: z.enum(['archive', 'restore']),
})

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const body = await req.json()
    const { ids, action } = bulkSchema.parse(body)
    const data = { archived: action === 'archive' }
    const result = await db.booking.updateMany({ where: { id: { in: ids } }, data })
    return ok({ updated: result.count })
  } catch (err) {
    return handleError(err)
  }
}

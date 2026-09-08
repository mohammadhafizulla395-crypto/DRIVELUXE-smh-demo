import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok, handleError } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(['archive', 'restore']),
})

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const body = await req.json()
    const { ids, action } = bulkSchema.parse(body)
    const result = await db.supportTicket.updateMany({
      where: { id: { in: ids } },
      data: { archived: action === 'archive' },
    })
    return ok({ updated: result.count })
  } catch (err) {
    return handleError(err)
  }
}

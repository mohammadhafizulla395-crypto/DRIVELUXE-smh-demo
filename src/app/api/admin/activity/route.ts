import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/admin/activity — recent activity feed */
export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '15')))

  const activities = await db.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return ok({ activities })
}

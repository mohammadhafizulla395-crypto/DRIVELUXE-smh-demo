import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, handleError } from '@/lib/api-response'

export const runtime = 'nodejs'

/** GET /api/employee/knowledge-base — articles for employees */
export async function GET(req: Request) {
  try {
    const { error } = await requireEmployee()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (category) where.category = category

    const articles = await db.knowledgeBase.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return ok({ articles })
  } catch (err) {
    return handleError(err)
  }
}

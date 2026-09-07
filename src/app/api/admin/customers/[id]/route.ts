import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok, handleError, notFound } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

const archiveSchema = z.object({ archived: z.boolean() })

/** PATCH /api/admin/customers/[id] — archive/restore a customer */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const { id } = await params
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return notFound('Customer not found.')
    const body = await req.json()
    const { archived } = archiveSchema.parse(body)
    const user = await db.user.update({ where: { id }, data: { archived } })
    return ok({ user: { id: user.id, name: user.name, archived: user.archived } })
  } catch (err) {
    return handleError(err)
  }
}

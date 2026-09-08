import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { hashPassword } from '@/lib/auth'
import { ok, handleError, notFound, fail } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

const updateSchema = z.object({
  action: z.enum(['suspend', 'activate', 'reset_password', 'change_role', 'update_info']),
  role: z.enum(['support', 'fleet', 'customer_care']).optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
})

/**
 * PATCH /api/admin/employees/[id]
 * Admin manages an employee: suspend, activate, reset password, change role, update info.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const employee = await db.employee.findUnique({ where: { id } })
    if (!employee) return notFound('Employee not found.')

    const body = await req.json()
    const { action, role, name, phone } = updateSchema.parse(body)

    let message = ''

    if (action === 'suspend') {
      if (employee.status === 'suspended') return fail('Employee is already suspended.', 400)
      await db.employee.update({ where: { id }, data: { status: 'suspended' } })
      message = `Suspended employee ${employee.employeeId} (${employee.name})`
    } else if (action === 'activate') {
      if (employee.status === 'active') return fail('Employee is already active.', 400)
      await db.employee.update({ where: { id }, data: { status: 'active' } })
      message = `Activated employee ${employee.employeeId} (${employee.name})`
    } else if (action === 'reset_password') {
      const newPass = await hashPassword('emp123')
      await db.employee.update({ where: { id }, data: { password: newPass } })
      message = `Reset password for ${employee.employeeId} (${employee.name}). New temp password: emp123`
    } else if (action === 'change_role') {
      if (!role) return fail('New role is required.', 400)
      await db.employee.update({ where: { id }, data: { role } })
      message = `Changed ${employee.employeeId}'s role to ${role}`
    } else if (action === 'update_info') {
      const data: Record<string, string> = {}
      if (name) data.name = name
      if (phone !== undefined) data.phone = phone
      if (Object.keys(data).length === 0) return fail('No fields to update.', 400)
      await db.employee.update({ where: { id }, data })
      message = `Updated info for ${employee.employeeId}`
    }

    await db.activity.create({
      data: { type: 'employee', message, refId: employee.id },
    })

    return ok({ message })
  } catch (err) {
    return handleError(err)
  }
}

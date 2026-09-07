import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-helpers'
import { ok, handleError, notFound, fail } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

// Payment workflow: Pending → Paid → Refunded
const FLOW: Record<string, string[]> = {
  pending: ['paid'],
  paid: ['refunded'],
  refunded: [],
}

const statusSchema = z.object({ status: z.enum(['pending', 'paid', 'refunded']) })

/** PATCH /api/admin/payments/[id] — advance payment status */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin()
    if (error) return error
    const { id } = await params
    const payment = await db.payment.findUnique({ where: { id } })
    if (!payment) return notFound('Payment not found.')

    const body = await req.json()
    const { status } = statusSchema.parse(body)

    const allowed = FLOW[payment.status] || []
    if (!allowed.includes(status)) {
      return fail(
        `Cannot move a "${payment.status}" payment to "${status}". Allowed: ${allowed.length ? allowed.join(', ') : 'none (final)'}.`,
        400,
      )
    }

    const updateData: Record<string, unknown> = { status }
    if (status === 'paid' && !payment.txnRef) {
      updateData.txnRef = `TXN-${Date.now()}`
    }

    const updated = await db.payment.update({ where: { id }, data: updateData })

    // Sync booking status with payment: paid payment → booking 'paid'; refunded → booking 'cancelled'
    if (status === 'paid') {
      await db.booking.updateMany({
        where: { id: payment.bookingId, status: 'booked' },
        data: { status: 'paid' },
      })
    }
    if (status === 'refunded') {
      await db.booking.updateMany({
        where: { id: payment.bookingId, status: { in: ['booked', 'paid'] } },
        data: { status: 'cancelled' },
      })
    }

    await db.activity.create({
      data: { type: 'payment', message: `Payment ${payment.txnRef ?? id} marked as "${status}"`, refId: id },
    })

    return ok({ payment: updated })
  } catch (err) {
    return handleError(err)
  }
}

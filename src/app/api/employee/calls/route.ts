import { db } from '@/lib/db'
import { requireEmployee } from '@/lib/employee-helpers'
import { ok, created, handleError } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'nodejs'

/** GET /api/employee/calls — this employee's call logs */
export async function GET() {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const calls = await db.customerCall.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return ok({ calls })
  } catch (err) {
    return handleError(err)
  }
}

const callSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  userId: z.string().optional(),
  bookingId: z.string().optional(),
  subject: z.string().min(2, 'Subject is required'),
  notes: z.string().default(''),
  outcome: z.enum(['logged', 'resolved', 'escalated']).default('logged'),
  duration: z.number().int().min(0).default(0),
})

/** POST /api/employee/calls — log a customer call */
export async function POST(req: Request) {
  try {
    const { employee, error } = await requireEmployee()
    if (error) return error

    const body = await req.json()
    const data = callSchema.parse(body)

    const call = await db.customerCall.create({
      data: {
        employeeId: employee.id,
        userId: data.userId || null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        bookingId: data.bookingId || null,
        subject: data.subject,
        notes: data.notes,
        outcome: data.outcome,
        duration: data.duration,
      },
    })

    await db.employeeReport.create({
      data: {
        employeeId: employee.id,
        type: 'call_logged',
        description: `Logged call with ${data.customerName}: ${data.subject}`,
        refId: call.id,
        status: 'pending',
      },
    })

    return created({ call })
  } catch (err) {
    return handleError(err)
  }
}

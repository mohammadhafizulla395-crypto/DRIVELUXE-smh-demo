'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CreditCard } from 'lucide-react'
import { paymentsApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { Payment, PaymentStatus } from '@/types'

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  refunded: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  refund_requested: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  refund_approved: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
}

export function PaymentHistory() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Array<Payment & { booking?: { id: string; startDate: string; endDate: string; totalPrice: number; status: string; car?: { id: string; name: string; brand: string; image: string } } }>>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    paymentsApi.mine()
      .then((res) => { if (active) setPayments(res.payments) })
      .catch((err) => {
        const e = err as ApiError
        toast({ title: 'Could not load payments', description: e.message, variant: 'destructive' })
      })
      .finally(() => active && setLoaded(true))
    return () => { active = false }
  }, [toast])

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalRefunded = payments.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground mt-1">All your payment transactions and refund status.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 border-white/10 bg-card/40">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">${totalPaid.toFixed(0)}</p>
        </Card>
        <Card className="p-4 border-white/10 bg-card/40">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Refunded</p>
          <p className="text-2xl font-bold text-rose-300 mt-1">${totalRefunded.toFixed(0)}</p>
        </Card>
      </div>

      {!loaded ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <Card className="p-12 text-center border-white/10 bg-card/30">
          <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No payments yet. Your payment history will appear here once you book a car.</p>
        </Card>
      ) : (
        <Card className="border-white/10 overflow-hidden p-0">
          <div className="overflow-x-auto scroll-dark">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Transaction</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Booking</th>
                  <th className="text-left font-medium px-4 py-3">Amount</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Method</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.txnRef || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {p.booking?.car && (
                        <div className="flex items-center gap-2">
                          <img src={p.booking.car.image} alt={p.booking.car.name} className="h-8 w-12 object-cover rounded" />
                          <span className="truncate max-w-[140px]">{p.booking.car.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">${p.amount.toFixed(0)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="border-white/10 capitalize">{p.method}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[p.status] ?? STATUS_STYLES.pending}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {format(new Date(p.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

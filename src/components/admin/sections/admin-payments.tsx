'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Search, X, RotateCcw, ShieldCheck, Loader2 } from 'lucide-react'
import { adminApi, ApiError, type AdminTableQuery } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  AdminPageHeader,
  AdminTableSkeleton,
  AdminPagination,
  AdminEmptyState,
} from '../admin-ui'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Payment, PaymentStatus } from '@/types'

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  processing: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  refunded: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  refund_requested: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  refund_approved: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
}

export function AdminPayments() {
  const { toast } = useToast()
  const [rows, setRows] = useState<Payment[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loadedKey, setLoadedKey] = useState('')
  const loaded = loadedKey !== ''
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('all')
  const [method, setMethod] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const queryKey = `${debounced}|${status}|${method}|${sort}|${page}`

  useEffect(() => {
    let active = true
    const q: AdminTableQuery = {
      search: debounced || undefined,
      status: status !== 'all' ? status : undefined,
      method: method !== 'all' ? method : undefined,
      sort,
      page,
      limit: 10,
    }
    adminApi.payments
      .list(q)
      .then((res) => {
        if (!active) return
        setRows(res.payments)
        setPagination(res.pagination)
        setLoadedKey(queryKey)
      })
      .catch((err) => {
        if (!active) return
        const e = err as ApiError
        toast({ title: 'Load failed', description: e.message, variant: 'destructive' })
        setRows([])
        setLoadedKey(queryKey)
      })
    return () => {
      active = false
    }
  }, [debounced, status, method, sort, page, queryKey, toast])

  const handleStatus = async (id: string, newStatus: PaymentStatus) => {
    try {
      await adminApi.payments.updateStatus(id, newStatus)
      toast({ title: 'Payment updated', description: `Marked as ${newStatus}` })
      setLoadedKey('') // force reload
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleRefund = async () => {
    if (!refundTarget) return
    setRefunding(true)
    try {
      const result = await adminApi.payments.refund(refundTarget.id, refundReason || 'Admin test refund')
      toast({
        title: 'Refund processed',
        description: `Refund ID: ${result.refundId}. Points reversed.`,
      })
      setRefundTarget(null)
      setRefundReason('')
      setLoadedKey('') // force reload
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Refund failed', description: e.message, variant: 'destructive' })
    } finally {
      setRefunding(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Payments"
        description="Track and manage payment lifecycle: Pending → Processing → Paid → Refunded. Razorpay Test Mode."
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by txn ref, order ID, or customer…"
            className="pl-9 bg-card/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-[140px] bg-card/40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={method} onValueChange={(v) => { setMethod(v); setPage(1) }}>
          <SelectTrigger className="w-[130px] bg-card/40"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="razorpay">Razorpay</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
          <SelectTrigger className="w-[150px] bg-card/40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="amount">Amount (high→low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!loaded ? (
        <AdminTableSkeleton cols={7} rows={8} />
      ) : rows.length === 0 ? (
        <AdminEmptyState title="No payments found" description="Adjust filters or wait for bookings to come in." />
      ) : (
        <Card className="border-white/10 overflow-hidden p-0">
          <div className="overflow-x-auto scroll-dark">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Order ID</th>
                  <th className="text-left font-medium px-4 py-3">Payment ID</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Customer</th>
                  <th className="text-left font-medium px-4 py-3">Amount</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Method</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="text-right font-medium px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.razorpayOrderId ? (
                        <span className="text-sky-300">{p.razorpayOrderId.slice(0, 18)}…</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {p.verified && (
                        <ShieldCheck className="inline h-3 w-3 text-emerald-400 ml-1" aria-label="Verified" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.razorpayPaymentId ? (
                        <span className="text-emerald-300">{p.razorpayPaymentId.slice(0, 18)}…</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="font-medium">{p.user?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">₹{p.amount.toFixed(0)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
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
                    <td className="px-4 py-3 text-right">
                      {p.status === 'paid' && p.verified ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-300 border-rose-500/30 hover:bg-rose-500/10 h-8"
                          onClick={() => { setRefundTarget(p); setRefundReason('') }}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Refund
                        </Button>
                      ) : p.status === 'pending' ? (
                        <Select
                          value={p.status}
                          onValueChange={(v) => handleStatus(p.id, v as PaymentStatus)}
                        >
                          <SelectTrigger className="w-[120px] h-8 bg-card/40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={p.status} disabled>{p.status}</SelectItem>
                            <SelectItem value="paid">Mark Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {p.status === 'refunded' ? 'Refunded' : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} onPage={setPage} />

      {/* Refund dialog */}
      <AlertDialog open={!!refundTarget} onOpenChange={(o) => !o && setRefundTarget(null)}>
        <AlertDialogContent className="bg-background border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Process test refund?</AlertDialogTitle>
            <AlertDialogDescription>
              {refundTarget && (
                <span>
                  Refund ₹{refundTarget.amount.toFixed(0)} for payment{' '}
                  <span className="font-mono text-xs">{refundTarget.razorpayPaymentId?.slice(0, 20)}…</span>
                  <br />
                  This will: cancel the booking, reverse awarded points, and call the Razorpay refund API.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Refund reason (min 5 chars)…"
              className="bg-card/40"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={refunding || refundReason.length < 5}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {refunding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" /> Process Refund
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

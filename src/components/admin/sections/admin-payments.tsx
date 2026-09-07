'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Search, X } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Payment, PaymentStatus } from '@/types'

const STATUS_FLOW: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['paid'],
  paid: ['refunded'],
  refunded: [],
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  refunded: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
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
      load()
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' })
    }
  }

  const totalAmount = rows.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : 0), 0)

  return (
    <div>
      <AdminPageHeader
        title="Payments"
        description="Track and manage payment lifecycle: Pending → Paid → Refunded."
        actions={
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Page revenue (paid)</p>
            <p className="text-lg font-bold text-emerald-300">${totalAmount.toFixed(0)}</p>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by txn ref or customer…"
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
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={method} onValueChange={(v) => { setMethod(v); setPage(1) }}>
          <SelectTrigger className="w-[130px] bg-card/40"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
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
        <AdminTableSkeleton cols={6} rows={8} />
      ) : rows.length === 0 ? (
        <AdminEmptyState title="No payments found" description="Adjust filters or wait for bookings to come in." />
      ) : (
        <Card className="border-white/10 overflow-hidden p-0">
          <div className="overflow-x-auto scroll-dark">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Txn Ref</th>
                  <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Booking</th>
                  <th className="text-left font-medium px-4 py-3">Amount</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Method</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="text-right font-medium px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const allowed = STATUS_FLOW[p.status] || []
                  return (
                    <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-xs">
                        {p.txnRef || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.user?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {p.booking?.car?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold">${p.amount.toFixed(0)}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant="outline" className="border-white/10 capitalize">{p.method}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[p.status]}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {format(new Date(p.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {allowed.length > 0 ? (
                          <Select
                            value={p.status}
                            onValueChange={(v) => handleStatus(p.id, v as PaymentStatus)}
                          >
                            <SelectTrigger className="w-[130px] h-8 bg-card/40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={p.status} disabled>{p.status}</SelectItem>
                              {allowed.map((s) => (
                                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">Final</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} onPage={setPage} />
    </div>
  )
}

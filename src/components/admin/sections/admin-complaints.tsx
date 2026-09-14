'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Search, X, Archive, RotateCcw } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
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
import type { SupportTicket, TicketStatus } from '@/types'

const FLOW: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress', 'resolved', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  in_progress: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  closed: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  booking: 'Booking',
  refund: 'Refund',
  payment: 'Payment',
  other: 'Other',
}

export function AdminComplaints() {
  const { toast } = useToast()
  const [rows, setRows] = useState<SupportTicket[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkTarget, setBulkTarget] = useState<'archive' | 'restore' | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    setLoaded(false)
    const q: AdminTableQuery = {
      search: debounced || undefined,
      status: status !== 'all' ? status : undefined,
      category: category !== 'all' ? category : undefined,
      sort: 'newest',
      page,
      limit: 10,
      archived,
    }
    adminApi.complaints
      .list(q)
      .then((res) => {
        setRows(res.complaints)
        setPagination(res.pagination)
      })
      .catch((err) => {
        const e = err as ApiError
        toast({ title: 'Load failed', description: e.message, variant: 'destructive' })
        setRows([])
      })
      .finally(() => setLoaded(true))
  }, [debounced, status, category, page, archived, toast])

  useEffect(() => {
    load()
  }, [load])

  const toggleSelect = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const handleStatus = async (id: string, newStatus: TicketStatus) => {
    try {
      await adminApi.complaints.updateStatus(id, newStatus)
      setRows((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)))
      toast({ title: 'Ticket updated', description: `→ ${newStatus.replace('_', ' ')}` })
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleArchive = async (id: string, archived: boolean) => {
    try {
      await adminApi.complaints.archive(id, archived)
      toast({ title: archived ? 'Archived' : 'Restored' })
      load()
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Action failed', description: e.message, variant: 'destructive' })
    }
  }

  const confirmBulk = async () => {
    if (!bulkTarget || selected.length === 0) return
    setBulkBusy(true)
    try {
      await adminApi.complaints.bulk(selected, bulkTarget)
      toast({ title: `${bulkTarget === 'archive' ? 'Archived' : 'Restored'} ${selected.length} tickets` })
      setSelected([])
      setBulkTarget(null)
      load()
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Bulk action failed', description: e.message, variant: 'destructive' })
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Complaints"
        description="Manage support tickets. Workflow: Open → In Progress → Resolved → Closed."
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, message, or customer…"
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
          <SelectTrigger className="w-[140px] bg-card/40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="booking">Booking</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={archived ? 'default' : 'outline'} onClick={() => { setArchived(!archived); setPage(1) }} className={archived ? 'bg-primary text-primary-foreground' : ''}>
          {archived ? 'Showing archived' : 'Show archived'}
        </Button>
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm">
          <span className="font-medium">{selected.length} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulkTarget('archive')}>
              <Archive className="h-3.5 w-3.5 mr-1" /> Archive
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkTarget('restore')}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore
            </Button>
          </div>
        </div>
      )}

      {!loaded ? (
        <AdminTableSkeleton cols={5} rows={8} />
      ) : rows.length === 0 ? (
        <AdminEmptyState title="No complaints found" description="When customers submit support requests, they appear here." />
      ) : (
        <div className="space-y-3">
          {rows.map((t) => {
            const allowed = FLOW[t.status] || []
            return (
              <Card key={t.id} className="border-white/10 bg-card/40 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selected.includes(t.id)}
                    onCheckedChange={() => toggleSelect(t.id)}
                    aria-label={`Select ${t.subject}`}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{t.subject}</h3>
                      <Badge variant="outline" className="border-white/10">{CATEGORY_LABELS[t.category] ?? t.category}</Badge>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[t.status]}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.user?.name ?? 'Unknown'} · {t.user?.email ?? ''} · {format(new Date(t.createdAt), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{t.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {allowed.length > 0 ? (
                      <Select value={t.status} onValueChange={(v) => handleStatus(t.id, v as TicketStatus)}>
                        <SelectTrigger className="w-[140px] h-8 bg-card/40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={t.status} disabled>{t.status.replace('_', ' ')}</SelectItem>
                          {allowed.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">Final</span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleArchive(t.id, !t.archived)}
                      aria-label={t.archived ? 'Restore' : 'Archive'}
                    >
                      {t.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} onPage={setPage} />

      <AlertDialog open={!!bulkTarget} onOpenChange={(o) => !o && setBulkTarget(null)}>
        <AlertDialogContent className="bg-background border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>{bulkTarget === 'archive' ? 'Archive selected tickets?' : 'Restore selected tickets?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {selected.length} ticket(s) will be {bulkTarget === 'archive' ? 'archived' : 'restored'}. This is reversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulk} disabled={bulkBusy} className="bg-primary text-primary-foreground">
              {bulkBusy ? 'Working…' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

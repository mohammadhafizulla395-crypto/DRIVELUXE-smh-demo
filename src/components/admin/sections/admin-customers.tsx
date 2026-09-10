'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Archive, RotateCcw, Search, X } from 'lucide-react'
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
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

interface CustomerRow {
  id: string
  name: string
  email: string
  phone: string | null
  points: number
  role: string
  archived: boolean
  createdAt: string
  _count: { bookings: number; reviews: number; supportTickets: number }
}

export function AdminCustomers() {
  const { toast } = useToast()
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [sort, setSort] = useState('newest')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [detail, setDetail] = useState<CustomerRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<CustomerRow | null>(null)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    setLoaded(false)
    const q: AdminTableQuery = {
      search: debounced || undefined,
      sort,
      page,
      limit: 10,
      archived,
    }
    adminApi.customers
      .list(q)
      .then((res) => {
        setRows(res.customers as unknown as CustomerRow[])
        setPagination(res.pagination)
      })
      .catch((err) => {
        const e = err as ApiError
        toast({ title: 'Load failed', description: e.message, variant: 'destructive' })
        setRows([])
      })
      .finally(() => setLoaded(true))
  }, [debounced, sort, page, archived, toast])

  useEffect(() => {
    load()
  }, [load])

  const toggleSelect = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const toggleAll = () =>
    setSelected((s) => (s.length === rows.length ? [] : rows.map((r) => r.id)))

  const confirmArchive = async () => {
    if (!archiveTarget) return
    setArchiving(true)
    try {
      await adminApi.customers.archive(archiveTarget.id, !archiveTarget.archived)
      toast({
        title: archiveTarget.archived ? 'Customer restored' : 'Customer archived',
        description: archiveTarget.name,
      })
      setArchiveTarget(null)
      load()
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Action failed', description: e.message, variant: 'destructive' })
    } finally {
      setArchiving(false)
    }
  }

  const openDetail = (c: CustomerRow) => {
    setDetail(c)
    setDetailOpen(true)
  }

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Manage customer accounts. Archive instead of delete."
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="pl-9 bg-card/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
          <SelectTrigger className="w-[160px] bg-card/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="points">Most points</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={archived ? 'default' : 'outline'}
          onClick={() => { setArchived(!archived); setPage(1) }}
          className={archived ? 'bg-primary text-primary-foreground' : ''}
        >
          {archived ? 'Showing archived' : 'Show archived'}
        </Button>
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm">
          <span className="font-medium">{selected.length} selected</span>
        </div>
      )}

      {/* Table */}
      {!loaded ? (
        <AdminTableSkeleton cols={6} rows={8} />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          title="No customers found"
          description="Try adjusting your search or filters."
          action={
            <Button variant="outline" onClick={() => { setSearch(''); setArchived(false) }}>
              Reset
            </Button>
          }
        />
      ) : (
        <Card className="border-white/10 overflow-hidden p-0">
          <div className="overflow-x-auto scroll-dark">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3 w-10">
                    <Checkbox checked={selected.length === rows.length && rows.length > 0} onCheckedChange={toggleAll} aria-label="Select all" />
                  </th>
                  <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Phone</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Bookings</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Points</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Joined</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-white/5 hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => openDetail(c)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.includes(c.id)}
                        onCheckedChange={() => toggleSelect(c.id)}
                        aria-label={`Select ${c.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {c.phone || '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="outline" className="border-white/10">{c._count.bookings}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-primary">
                      {c.points}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {format(new Date(c.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setArchiveTarget(c)}
                        aria-label={c.archived ? 'Restore' : 'Archive'}
                      >
                        {c.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} onPage={setPage} />

      {/* Detail drawer */}
      <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
        <DrawerContent className="bg-background border-white/10 max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Customer details</DrawerTitle>
          </DrawerHeader>
          {detail && (
            <div className="px-6 pb-6 overflow-y-auto scroll-dark space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" value={detail.name} />
                <Field label="Email" value={detail.email} />
                <Field label="Phone" value={detail.phone || '—'} />
                <Field label="Points" value={String(detail.points)} />
                <Field label="Joined" value={format(new Date(detail.createdAt), 'MMM d, yyyy')} />
                <Field label="Status" value={detail.archived ? 'Archived' : 'Active'} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Stat label="Bookings" value={detail._count.bookings} />
                <Stat label="Reviews" value={detail._count.reviews} />
                <Stat label="Support tickets" value={detail._count.supportTickets} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setDetailOpen(false); setArchiveTarget(detail) }}
                  className={detail.archived ? '' : 'text-rose-300 border-rose-500/30 hover:bg-rose-500/10'}
                >
                  {detail.archived ? <RotateCcw className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
                  {detail.archived ? 'Restore' : 'Archive'}
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Archive confirm */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <AlertDialogContent className="bg-background border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveTarget?.archived ? 'Restore this customer?' : 'Archive this customer?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.name} will be {archiveTarget?.archived ? 'restored to active' : 'archived and unable to book'}. This action is reversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              disabled={archiving}
              className={archiveTarget?.archived ? 'bg-primary text-primary-foreground' : 'bg-rose-600 hover:bg-rose-700 text-white'}
            >
              {archiving ? 'Working…' : archiveTarget?.archived ? 'Restore' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3 border-white/10 bg-card/30 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </Card>
  )
}

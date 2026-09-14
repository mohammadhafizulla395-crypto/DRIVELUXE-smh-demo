'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  Search,
  Archive,
  RotateCcw,
  Loader2,
  Calendar,
  User as UserIcon,
  Car as CarIcon,
  MapPin,
  CreditCard,
  ChevronRight,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import type { AdminTableQuery, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn, formatCurrency } from '@/lib/utils'
import type { Booking, BookingStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
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
import {
  AdminPageHeader,
  AdminTableSkeleton,
  AdminPagination,
  AdminEmptyState,
} from '../admin-ui'

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'start', label: 'Start date' },
  { value: 'end', label: 'End date' },
  { value: 'price', label: 'Price' },
] as const

type SortValue = (typeof SORTS)[number]['value']

const STATUSES: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'booked', label: 'Booked' },
  { value: 'paid', label: 'Paid' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'in_use', label: 'In use' },
  { value: 'returned', label: 'Returned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

/** Allowed next transitions — mirrors the server's FLOW table. */
const FLOW: Record<BookingStatus, BookingStatus[]> = {
  booked: ['payment_processing', 'paid', 'cancelled'],
  payment_processing: ['paid', 'cancelled'],
  paid: ['pickup', 'cancelled'],
  pickup: ['in_use'],
  in_use: ['returned'],
  returned: ['completed'],
  completed: [],
  cancelled: [],
}

const STATUS_BADGE: Record<BookingStatus, string> = {
  booked: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  payment_processing: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  paid: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  pickup: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  in_use: 'border-violet-500/30 bg-violet-500/15 text-violet-300',
  returned: 'border-teal-500/30 bg-teal-500/15 text-teal-300',
  completed: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300',
  cancelled: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
}

const PAYMENT_BADGE: Record<string, string> = {
  pending: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  paid: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  refunded: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  booked: 'Booked',
  payment_processing: 'Payment Processing',
  paid: 'Paid',
  pickup: 'Pickup',
  in_use: 'In use',
  returned: 'Returned',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const TIMELINE: BookingStatus[] = [
  'booked',
  'payment_processing',
  'paid',
  'pickup',
  'in_use',
  'returned',
  'completed',
]

const PAGE_SIZE = 10

type ConfirmState = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive: boolean
  onConfirm: () => Promise<void>
}

const noConfirm: ConfirmState = {
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Confirm',
  destructive: false,
  onConfirm: async () => {},
}

export function AdminBookings() {
  const { toast } = useToast()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // query state
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortValue>('newest')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  // selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // detail drawer
  const [detail, setDetail] = useState<Booking | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // confirm dialog state
  const [confirm, setConfirm] = useState<ConfirmState>(noConfirm)

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // fetch
  useEffect(() => {
    let active = true
    setLoading(true)
    const q: AdminTableQuery = {
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      sort,
      archived,
      page,
      limit: PAGE_SIZE,
    }
    adminApi.bookings
      .list(q)
      .then((res) => {
        if (!active) return
        setBookings(res.bookings)
        setTotalPages(res.pagination.totalPages)
        setSelectedIds(new Set())
      })
      .catch((err) => {
        const e = err as ApiError
        toast({
          title: 'Failed to load bookings',
          description: e.message,
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [search, statusFilter, sort, archived, page, reloadKey, toast])

  const reload = () => setReloadKey((k) => k + 1)

  // ---------- selection ----------
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected =
    bookings.length > 0 && bookings.every((b) => selectedIds.has(b.id))
  const someSelected = bookings.some((b) => selectedIds.has(b.id))

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(bookings.map((b) => b.id)))
  }

  const clearSelection = () => setSelectedIds(new Set())

  // ---------- status update ----------
  const advanceStatus = async (booking: Booking, next: BookingStatus) => {
    setUpdatingId(booking.id)
    try {
      const res = await adminApi.bookings.updateStatus(booking.id, next)
      toast({
        title: 'Status updated',
        description: `Booking is now "${STATUS_LABEL[res.booking.status]}".`,
      })
      // Optimistic local update — the server response includes user and car
      // but not payment. For payment-affecting transitions, patch payment
      // locally so the badge reflects the new state without a full reload.
      const updated: Booking = {
        ...booking,
        ...res.booking,
        payment: booking.payment
          ? {
              ...booking.payment,
              status:
                next === 'paid'
                  ? 'paid'
                  : next === 'cancelled'
                    ? 'refunded'
                    : booking.payment.status,
            }
          : booking.payment,
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)),
      )
      setDetail((d) => (d && d.id === updated.id ? updated : d))
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Could not update status',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  // ---------- archive (single) ----------
  const archiveOne = (booking: Booking) => {
    setConfirm({
      open: true,
      title: booking.archived ? 'Restore booking?' : 'Archive booking?',
      description: booking.archived
        ? 'This booking will reappear in the active list.'
        : 'This booking will be hidden from the active list but kept in records.',
      confirmLabel: booking.archived ? 'Restore' : 'Archive',
      destructive: !booking.archived,
      onConfirm: async () => {
        try {
          await adminApi.bookings.archive(booking.id, !booking.archived)
          toast({
            title: booking.archived ? 'Booking restored' : 'Booking archived',
          })
          reload()
        } catch (err) {
          const e = err as ApiError
          toast({
            title: 'Action failed',
            description: e.message,
            variant: 'destructive',
          })
        } finally {
          setConfirm(noConfirm)
        }
      },
    })
  }

  // ---------- bulk ----------
  const runBulk = (action: 'archive' | 'restore', label: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setConfirm({
      open: true,
      title: `${label} ${ids.length} booking${ids.length === 1 ? '' : 's'}?`,
      description:
        action === 'archive'
          ? 'Selected bookings will be hidden from the active list.'
          : 'Selected bookings will reappear in the active list.',
      confirmLabel: label,
      destructive: action === 'archive',
      onConfirm: async () => {
        try {
          const res = await adminApi.bookings.bulk(ids, action)
          toast({
            title: 'Bulk action complete',
            description: `${res.updated} booking${res.updated === 1 ? '' : 's'} updated.`,
          })
          clearSelection()
          reload()
        } catch (err) {
          const e = err as ApiError
          toast({
            title: 'Bulk action failed',
            description: e.message,
            variant: 'destructive',
          })
        } finally {
          setConfirm(noConfirm)
        }
      },
    })
  }

  const selectedCount = selectedIds.size

  return (
    <div>
      <AdminPageHeader
        title="Bookings"
        description="Track every reservation through its workflow — booked → paid → pickup → in use → returned → completed."
      />

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by customer, car, or location…"
            className="pl-9 bg-card/40 border-white/10"
            aria-label="Search bookings"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger
              className="w-[150px] bg-card/40 border-white/10"
              aria-label="Filter by status"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-white/10">
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
            <SelectTrigger
              className="w-[150px] bg-card/40 border-white/10"
              aria-label="Sort bookings"
            >
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-white/10">
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={archived ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setArchived((a) => !a)
              setPage(1)
            }}
            className="border-white/10"
            aria-pressed={archived}
          >
            <Archive className="h-4 w-4" />
            {archived ? 'Showing archived' : 'Show archived'}
          </Button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <Button
            size="sm"
            variant="outline"
            className="border-white/10"
            onClick={() => runBulk('archive', 'Archive selected')}
          >
            <Archive className="h-3.5 w-3.5" /> Archive
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/10"
            onClick={() => runBulk('restore', 'Restore selected')}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restore
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={clearSelection}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <AdminTableSkeleton cols={8} rows={6} />
      ) : bookings.length === 0 ? (
        <AdminEmptyState
          title="No bookings found"
          description={
            archived
              ? 'No archived bookings match your filters.'
              : 'No bookings match your filters. Try adjusting search or status.'
          }
        />
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-card/30">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={
                      allSelected || (someSelected ? 'indeterminate' : false)
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all bookings"
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => {
                const isSelected = selectedIds.has(b.id)
                const allowed = FLOW[b.status] || []
                const isBusy = updatingId === b.id
                return (
                  <TableRow
                    key={b.id}
                    className={cn(
                      'border-white/5 cursor-pointer',
                      isSelected && 'bg-primary/5',
                    )}
                    onClick={() => setDetail(b)}
                  >
                    <TableCell
                      className="pl-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(b.id)}
                        aria-label={`Select booking ${b.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {b.user?.name ?? '—'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {b.user?.email ?? '—'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={b.car?.image}
                          alt={
                            b.car
                              ? `${b.car.brand} ${b.car.name}`
                              : 'Car'
                          }
                          className="h-8 w-12 object-cover rounded"
                        />
                        <div className="min-w-0">
                          <p className="text-sm truncate">
                            {b.car?.name ?? '—'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {b.car?.brand ?? '—'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-medium">
                          {format(new Date(b.startDate), 'MMM d')}
                        </p>
                        <p className="text-muted-foreground">
                          → {format(new Date(b.endDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {b.totalDays}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatCurrency(b.totalPrice)}
                    </TableCell>
                    <TableCell>
                      {b.payment ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-normal',
                            PAYMENT_BADGE[b.payment.status] ||
                              'border-white/10',
                          )}
                        >
                          {b.payment.status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('font-normal', STATUS_BADGE[b.status])}
                      >
                        {STATUS_LABEL[b.status]}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-right pr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1">
                        <Select
                          value=""
                          onValueChange={(v) =>
                            advanceStatus(b, v as BookingStatus)
                          }
                          disabled={allowed.length === 0 || isBusy}
                        >
                          <SelectTrigger
                            size="sm"
                            className="h-8 w-[120px] bg-card/40 border-white/10"
                            aria-label={`Update booking status — current: ${STATUS_LABEL[b.status]}`}
                          >
                            {isBusy ? (
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Updating…
                              </span>
                            ) : allowed.length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                Final
                              </span>
                            ) : (
                              <SelectValue placeholder="Advance…" />
                            )}
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-white/10">
                            {allowed.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => archiveOne(b)}
                          aria-label={
                            b.archived ? 'Restore booking' : 'Archive booking'
                          }
                        >
                          {b.archived ? (
                            <RotateCcw className="h-3.5 w-3.5" />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <AdminPagination page={page} totalPages={totalPages} onPage={setPage} />
      )}

      {/* Detail Drawer */}
      <Drawer
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        direction="right"
      >
        <DrawerContent className="bg-card border-white/10 sm:max-w-md">
          {detail && (
            <>
              <DrawerHeader className="border-b border-white/10">
                <DrawerTitle>Booking details</DrawerTitle>
                <DrawerDescription>
                  Booked on{' '}
                  {format(new Date(detail.createdAt), 'MMM d, yyyy')} · ID{' '}
                  {detail.id}
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Status badges */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={cn('font-medium', STATUS_BADGE[detail.status])}
                  >
                    {STATUS_LABEL[detail.status]}
                  </Badge>
                  {detail.payment && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium',
                        PAYMENT_BADGE[detail.payment.status] ||
                          'border-white/10',
                      )}
                    >
                      Payment: {detail.payment.status}
                    </Badge>
                  )}
                </div>

                {/* Customer */}
                <Section title="Customer" icon={UserIcon}>
                  <Row label="Name" value={detail.user?.name ?? '—'} />
                  <Row label="Email" value={detail.user?.email ?? '—'} />
                </Section>

                {/* Car */}
                <Section title="Car" icon={CarIcon}>
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={detail.car?.image}
                      alt={
                        detail.car
                          ? `${detail.car.brand} ${detail.car.name}`
                          : 'Car'
                      }
                      className="h-14 w-20 object-cover rounded"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {detail.car?.name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {detail.car?.brand ?? '—'}
                      </p>
                    </div>
                  </div>
                  <Row
                    label="Price/day"
                    value={
                      detail.car
                        ? formatCurrency(detail.car.pricePerDay)
                        : '—'
                    }
                  />
                </Section>

                {/* Dates & location */}
                <Section title="Rental period" icon={Calendar}>
                  <Row
                    label="Pickup"
                    value={format(
                      new Date(detail.startDate),
                      'EEE, MMM d, yyyy',
                    )}
                  />
                  <Row
                    label="Return"
                    value={format(
                      new Date(detail.endDate),
                      'EEE, MMM d, yyyy',
                    )}
                  />
                  <Row
                    label="Duration"
                    value={`${detail.totalDays} day${detail.totalDays === 1 ? '' : 's'}`}
                  />
                  <Row
                    label="Pickup location"
                    value={detail.pickupLocation}
                    icon={MapPin}
                  />
                </Section>

                {/* Price breakdown */}
                <Section title="Price breakdown" icon={CreditCard}>
                  <Row
                    label={`$${detail.car?.pricePerDay ?? 0} × ${detail.totalDays} day${detail.totalDays === 1 ? '' : 's'}`}
                    value={formatCurrency(
                      (detail.car?.pricePerDay ?? 0) * detail.totalDays,
                    )}
                  />
                  <Row
                    label="Total"
                    value={formatCurrency(detail.totalPrice)}
                    strong
                  />
                </Section>

                {/* Payment */}
                {detail.payment && (
                  <Section title="Payment" icon={CreditCard}>
                    <Row label="Method" value={detail.payment.method} />
                    <Row
                      label="Amount"
                      value={formatCurrency(detail.payment.amount)}
                    />
                    <Row label="Status" value={detail.payment.status} />
                    {detail.payment.txnRef && (
                      <Row label="Txn ref" value={detail.payment.txnRef} />
                    )}
                  </Section>
                )}

                {/* Workflow timeline */}
                <Section title="Workflow timeline" icon={RotateCcw}>
                  {detail.status === 'cancelled' ? (
                    <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                      This booking was cancelled.
                    </div>
                  ) : (
                    <ol className="space-y-1.5">
                      {TIMELINE.map((s, i) => {
                        const currentIdx = TIMELINE.indexOf(detail.status)
                        const isCurrent = s === detail.status
                        const isPast = i < currentIdx
                        const isFuture = i > currentIdx
                        return (
                          <li
                            key={s}
                            className={cn(
                              'flex items-center gap-2 text-sm rounded-md px-2 py-1.5',
                              isCurrent && 'bg-primary/10 text-primary',
                              isPast && 'text-muted-foreground line-through',
                              isFuture && 'text-muted-foreground/60',
                            )}
                          >
                            <span
                              className={cn(
                                'grid place-items-center h-5 w-5 rounded-full text-[10px] font-semibold shrink-0',
                                isCurrent &&
                                  'bg-primary text-primary-foreground',
                                isPast &&
                                  'bg-emerald-500/15 text-emerald-300',
                                isFuture &&
                                  'bg-white/5 text-muted-foreground',
                              )}
                            >
                              {isPast ? '✓' : i + 1}
                            </span>
                            {STATUS_LABEL[s]}
                            {isCurrent && (
                              <ChevronRight className="h-3 w-3 ml-auto" />
                            )}
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </Section>
              </div>
              <DrawerFooter className="border-t border-white/10 flex-row justify-end gap-2">
                <Button variant="ghost" onClick={() => setDetail(null)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10"
                  onClick={() => {
                    const target = detail
                    setDetail(null)
                    archiveOne(target)
                  }}
                >
                  {detail.archived ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                  {detail.archived ? 'Restore' : 'Archive'}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Confirm dialog */}
      <AlertDialog
        open={confirm.open}
        onOpenChange={(o) => !o && setConfirm(noConfirm)}
      >
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                confirm.destructive &&
                  'bg-rose-600 hover:bg-rose-600/90 text-white',
              )}
              onClick={confirm.onConfirm}
            >
              {confirm.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof UserIcon
  children: React.ReactNode
}) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h3>
      <div className="rounded-lg border border-white/10 bg-background/40 p-3 space-y-1.5">
        {children}
      </div>
    </section>
  )
}

function Row({
  label,
  value,
  strong,
  icon: Icon,
}: {
  label: string
  value: string
  strong?: boolean
  icon?: typeof MapPin
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span
        className={cn('text-right break-words', strong && 'font-semibold')}
      >
        {value}
      </span>
    </div>
  )
}

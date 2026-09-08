'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Search,
  X,
  Loader2,
  Calendar,
  User as UserIcon,
  Car as CarIcon,
  AlertTriangle,
  ShieldAlert,
  CalendarPlus,
} from 'lucide-react'
import {
  employeeApi,
  ApiError,
  type EmployeeTableQuery,
} from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn, formatCurrency } from '@/lib/utils'
import type { Booking, BookingStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AdminPageHeader,
  AdminTableSkeleton,
  AdminEmptyState,
} from '@/components/admin/admin-ui'

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

const STATUS_BADGE: Record<BookingStatus, string> = {
  booked: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
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

type AssistMode = 'extend' | 'report'

export function EmployeeBookings() {
  const { toast } = useToast()
  const [rows, setRows] = useState<Booking[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('all')

  // Assist dialog state
  const [assistMode, setAssistMode] = useState<AssistMode | null>(null)
  const [assistRow, setAssistRow] = useState<Booking | null>(null)
  const [newEndDate, setNewEndDate] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [assistBusy, setAssistBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    setLoaded(false)
    const q: EmployeeTableQuery = {
      search: debounced || undefined,
      status: status !== 'all' ? status : undefined,
    }
    employeeApi.bookings
      .list(q)
      .then((res) => setRows(res.bookings))
      .catch((err) => {
        const e = err as ApiError
        toast({
          title: 'Could not load bookings',
          description: e.message,
          variant: 'destructive',
        })
        setRows([])
      })
      .finally(() => setLoaded(true))
  }, [debounced, status, toast])

  useEffect(() => {
    load()
  }, [load])

  const openAssist = (row: Booking, mode: AssistMode) => {
    setAssistRow(row)
    setAssistMode(mode)
    setNewEndDate(row.endDate.split('T')[0])
    setIssueDescription('')
  }

  const closeAssist = () => {
    setAssistMode(null)
    setAssistRow(null)
    setNewEndDate('')
    setIssueDescription('')
    setAssistBusy(false)
  }

  const submitAssist = async () => {
    if (!assistRow || !assistMode) return
    if (assistMode === 'extend' && !newEndDate) {
      toast({
        title: 'New end date required',
        description: 'Please pick a date to extend the rental to.',
        variant: 'destructive',
      })
      return
    }
    if (assistMode === 'report' && issueDescription.trim().length < 10) {
      toast({
        title: 'Description too short',
        description: 'Please describe the issue (at least 10 characters).',
        variant: 'destructive',
      })
      return
    }
    setAssistBusy(true)
    try {
      await employeeApi.bookings.assist(assistRow.id, {
        action: assistMode,
        newEndDate: assistMode === 'extend' ? newEndDate : undefined,
        issueDescription:
          assistMode === 'report' ? issueDescription.trim() : undefined,
      })
      toast({
        title:
          assistMode === 'extend'
            ? 'Rental extended'
            : 'Issue reported to admin',
        description:
          assistMode === 'extend'
            ? `Extended to ${format(new Date(newEndDate), 'MMM d, yyyy')}.`
            : 'Your report has been submitted for review.',
      })
      closeAssist()
      load()
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Action failed',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setAssistBusy(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Bookings"
        description="Assist customers with their rentals — extend dates or report issues. Deletions, refunds, and payment approvals are admin-only."
      />

      {/* Permission notice */}
      <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-200/90 flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Employees cannot delete bookings, refund money, or approve payments.
          Use &quot;Report Issue&quot; to escalate these to an admin.
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, car, or pickup location…"
            className="pl-9 bg-card/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v)}
        >
          <SelectTrigger className="w-[160px] bg-card/40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!loaded ? (
        <AdminTableSkeleton cols={6} rows={6} />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          title="No bookings found"
          description="Try adjusting the search or status filter."
        />
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-white/10">
                <TableHead className="text-muted-foreground">Customer</TableHead>
                <TableHead className="text-muted-foreground">Car</TableHead>
                <TableHead className="text-muted-foreground">Dates</TableHead>
                <TableHead className="text-muted-foreground text-right">Total</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Payment</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => {
                const paymentStatus = b.payment?.status ?? 'pending'
                return (
                  <TableRow
                    key={b.id}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {b.user?.name ?? 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {b.user?.email ?? ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {b.car?.image ? (
                          <img
                            src={b.car.image}
                            alt={b.car.name}
                            className="h-8 w-12 rounded object-cover shrink-0"
                          />
                        ) : (
                          <CarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {b.car?.name ?? '—'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {b.car?.brand ?? ''}
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
                        <p className="text-muted-foreground mt-0.5">
                          {b.totalDays}d
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(b.totalPrice)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'capitalize',
                          STATUS_BADGE[b.status],
                        )}
                      >
                        {b.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'capitalize',
                          PAYMENT_BADGE[paymentStatus] ??
                            'border-white/10 bg-white/5 text-muted-foreground',
                        )}
                      >
                        {paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAssist(b, 'extend')}
                          className="h-8 border-white/10 bg-card/40"
                          disabled={b.status === 'cancelled' || b.status === 'completed'}
                        >
                          <CalendarPlus className="mr-1 h-3 w-3 text-teal-300" />
                          Extend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAssist(b, 'report')}
                          className="h-8 border-white/10 bg-card/40"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3 text-amber-300" />
                          Report
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

      {/* Assist dialog */}
      <Dialog
        open={assistMode !== null}
        onOpenChange={(o) => !o && closeAssist()}
      >
        <DialogContent className="bg-background border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {assistMode === 'extend' ? (
                <>
                  <CalendarPlus className="h-4 w-4 text-teal-300" />
                  Extend rental
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                  Report issue
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {assistMode === 'extend'
                ? 'Pick a new return date for this booking. An admin will approve the extension.'
                : 'Describe the issue. The report is sent to an admin for review (refund, payment, or cancellation).'}
            </DialogDescription>
          </DialogHeader>

          {assistRow && (
            <div className="rounded-lg border border-white/10 bg-card/40 px-3 py-2 text-xs space-y-0.5">
              <p>
                <span className="text-muted-foreground">Customer:</span>{' '}
                <span className="font-medium">
                  {assistRow.user?.name ?? '—'}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Car:</span>{' '}
                <span className="font-medium">
                  {assistRow.car?.brand} {assistRow.car?.name}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Current dates:</span>{' '}
                <span className="font-medium">
                  {format(new Date(assistRow.startDate), 'MMM d')} →{' '}
                  {format(new Date(assistRow.endDate), 'MMM d, yyyy')}
                </span>
              </p>
            </div>
          )}

          {assistMode === 'extend' ? (
            <div className="space-y-1.5">
              <Label htmlFor="newEndDate">New return date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newEndDate"
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Extension will be reviewed by an admin.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="issueDescription">Issue description</Label>
              <Textarea
                id="issueDescription"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe what the customer needs — refund, cancellation, payment dispute, etc."
                rows={4}
                className="bg-background/50 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters. The report is sent to admin.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAssist}
              disabled={assistBusy}
              className="border-white/10 bg-card/40"
            >
              Cancel
            </Button>
            <Button
              onClick={submitAssist}
              disabled={assistBusy}
              className="bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/30 hover:bg-teal-500/25 hover:text-teal-100 border border-teal-400/20"
            >
              {assistBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  {assistMode === 'extend'
                    ? 'Submit extension'
                    : 'Submit report'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Loader2,
  Hand,
  Wrench,
  CheckCircle2,
  Send,
  Mail,
  User as UserIcon,
} from 'lucide-react'
import { employeeApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { SupportTicket, EmployeeTicketStatus } from '@/types'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
  AdminEmptyState,
} from '@/components/admin/admin-ui'

const STATUS_BADGE: Record<EmployeeTicketStatus, string> = {
  open: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
  assigned: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  working: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  solved: 'border-violet-500/30 bg-violet-500/15 text-violet-300',
  waiting_approval:
    'border-teal-500/30 bg-teal-500/15 text-teal-300',
  closed: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300',
  reopened: 'border-orange-500/30 bg-orange-500/15 text-orange-300',
}

const STATUS_LABEL: Record<EmployeeTicketStatus, string> = {
  open: 'Open',
  assigned: 'Assigned',
  working: 'Working',
  solved: 'Solved',
  waiting_approval: 'Waiting approval',
  closed: 'Closed',
  reopened: 'Reopened',
}

// Cast helper — the API returns SupportTicket (a generic shape) but employee
// tickets reuse this type with the new EmployeeTicketStatus enum at runtime.
const statusOf = (t: SupportTicket): EmployeeTicketStatus =>
  t.status as unknown as EmployeeTicketStatus

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  booking: 'Booking',
  refund: 'Refund',
  payment: 'Payment',
  other: 'Other',
}

type Tab = 'mine' | 'available'

export function EmployeeTickets() {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('mine')
  const [rows, setRows] = useState<SupportTicket[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Solve dialog state
  const [solveRow, setSolveRow] = useState<SupportTicket | null>(null)
  const [resolution, setResolution] = useState('')
  const [solveBusy, setSolveBusy] = useState(false)

  const load = useCallback(() => {
    setLoaded(false)
    const q =
      tab === 'mine'
        ? { scope: 'mine' }
        : { scope: 'available', status: 'open' }
    employeeApi.tickets
      .list(q)
      .then((res) => setRows(res.tickets))
      .catch((err) => {
        const e = err as ApiError
        toast({
          title: 'Could not load tickets',
          description: e.message,
          variant: 'destructive',
        })
        setRows([])
      })
      .finally(() => setLoaded(true))
  }, [tab, toast])

  useEffect(() => {
    load()
  }, [load])

  const update = async (
    id: string,
    next: EmployeeTicketStatus,
    resolutionText?: string,
  ) => {
    setBusyId(id)
    try {
      await employeeApi.tickets.update(id, {
        status: next,
        resolution: resolutionText,
      })
      setRows((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: next as unknown as SupportTicket['status'] }
            : t,
        ),
      )
      // If "available" tab and we just assigned, remove from list
      if (tab === 'available' && next === 'assigned') {
        setRows((prev) => prev.filter((t) => t.id !== id))
      }
      toast({
        title: 'Ticket updated',
        description: `→ ${STATUS_LABEL[next]}`,
      })
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Update failed',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  const openSolve = (row: SupportTicket) => {
    setSolveRow(row)
    setResolution('')
  }

  const submitSolve = async () => {
    if (!solveRow) return
    if (resolution.trim().length < 10) {
      toast({
        title: 'Resolution too short',
        description: 'Please describe how the issue was resolved (min 10 chars).',
        variant: 'destructive',
      })
      return
    }
    setSolveBusy(true)
    try {
      await employeeApi.tickets.update(solveRow.id, {
        status: 'solved',
        resolution: resolution.trim(),
      })
      setRows((prev) =>
        prev.map((t) =>
          t.id === solveRow.id
            ? { ...t, status: 'solved' as unknown as SupportTicket['status'] }
            : t,
        ),
      )
      toast({
        title: 'Ticket solved',
        description: 'Marked as solved — ready to submit for approval.',
      })
      setSolveRow(null)
      setResolution('')
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Update failed',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setSolveBusy(false)
    }
  }

  const renderActions = (t: SupportTicket) => {
    const s = statusOf(t)
    const disabled = busyId === t.id
    const btn =
      'h-8 text-xs bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/30 hover:bg-teal-500/25 hover:text-teal-100 border border-teal-400/20'

    if (tab === 'available') {
      // Available tab — only "Assign to me"
      return (
        <Button
          size="sm"
          onClick={() => update(t.id, 'assigned')}
          disabled={disabled}
          className={btn}
        >
          {disabled ? (
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
          ) : (
            <Hand className="mr-1.5 h-3 w-3" />
          )}
          Assign to me
        </Button>
      )
    }

    switch (s) {
      case 'open':
        return (
          <Button
            size="sm"
            onClick={() => update(t.id, 'assigned')}
            disabled={disabled}
            className={btn}
          >
            <Hand className="mr-1.5 h-3 w-3" /> Assign to me
          </Button>
        )
      case 'assigned':
        return (
          <Button
            size="sm"
            onClick={() => update(t.id, 'working')}
            disabled={disabled}
            className={btn}
          >
            <Wrench className="mr-1.5 h-3 w-3" /> Start working
          </Button>
        )
      case 'working':
        return (
          <Button
            size="sm"
            onClick={() => openSolve(t)}
            disabled={disabled}
            className={btn}
          >
            <CheckCircle2 className="mr-1.5 h-3 w-3" /> Mark solved
          </Button>
        )
      case 'solved':
        return (
          <Button
            size="sm"
            onClick={() => update(t.id, 'waiting_approval')}
            disabled={disabled}
            className={btn}
          >
            <Send className="mr-1.5 h-3 w-3" /> Submit for approval
          </Button>
        )
      case 'waiting_approval':
        return (
          <span className="text-xs text-muted-foreground italic">
            Awaiting admin review
          </span>
        )
      case 'closed':
        return (
          <span className="text-xs text-muted-foreground italic">Final</span>
        )
      case 'reopened':
        return (
          <Button
            size="sm"
            onClick={() => update(t.id, 'working')}
            disabled={disabled}
            className={btn}
          >
            <Wrench className="mr-1.5 h-3 w-3" /> Resume work
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Support Tickets"
        description="Workflow: Open → Assigned → Working → Solved → Waiting Approval → Closed."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="bg-card/40 border border-white/10">
          <TabsTrigger value="mine">My Tickets</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {!loaded ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-28 w-full bg-white/5 rounded-xl"
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <AdminEmptyState
              title={
                tab === 'mine'
                  ? 'No tickets assigned to you'
                  : 'No available tickets'
              }
              description={
                tab === 'mine'
                  ? 'When you assign tickets to yourself, they appear here.'
                  : 'All open tickets have been claimed. Check back later.'
              }
            />
          ) : (
            <div className="space-y-3">
              {rows.map((t) => {
                const s = statusOf(t)
                return (
                  <Card
                    key={t.id}
                    className="border-white/10 bg-card/40 p-4"
                  >
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">
                            {t.subject}
                          </h3>
                          <Badge
                            variant="outline"
                            className="border-white/10 capitalize"
                          >
                            {CATEGORY_LABELS[t.category] ?? t.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(STATUS_BADGE[s])}
                          >
                            {STATUS_LABEL[s]}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            {t.user?.name ?? 'Unknown'}
                          </span>
                          {t.user?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {t.user.email}
                            </span>
                          )}
                          <span>
                            {format(new Date(t.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>

                        <p className="text-sm text-foreground/80 mt-2 line-clamp-3 whitespace-pre-line">
                          {t.message}
                        </p>
                      </div>

                      <div className="shrink-0 self-center">
                        {renderActions(t)}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Solve dialog */}
      <Dialog
        open={solveRow !== null}
        onOpenChange={(o) => !o && setSolveRow(null)}
      >
        <DialogContent className="bg-background border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-300" />
              Mark ticket as solved
            </DialogTitle>
            <DialogDescription>
              Describe how you resolved the issue. The customer and admin will
              see this.
            </DialogDescription>
          </DialogHeader>

          {solveRow && (
            <div className="rounded-lg border border-white/10 bg-card/40 px-3 py-2 text-xs">
              <p className="font-medium text-foreground">{solveRow.subject}</p>
              <p className="text-muted-foreground mt-1 line-clamp-2">
                {solveRow.message}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="resolution">Resolution</Label>
            <Textarea
              id="resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe the steps you took to resolve this issue…"
              rows={4}
              className="bg-background/50 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSolveRow(null)}
              disabled={solveBusy}
              className="border-white/10 bg-card/40"
            >
              Cancel
            </Button>
            <Button
              onClick={submitSolve}
              disabled={solveBusy}
              className="bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/30 hover:bg-teal-500/25 hover:text-teal-100 border border-teal-400/20"
            >
              {solveBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm solved
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Loader2,
  Phone,
  PhoneCall,
  Plus,
  User as UserIcon,
  Clock,
} from 'lucide-react'
import { employeeApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { CustomerCall } from '@/types'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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

const OUTCOME_BADGE: Record<CustomerCall['outcome'], string> = {
  logged: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300',
  resolved: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  escalated: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
}

const OUTCOME_LABEL: Record<CustomerCall['outcome'], string> = {
  logged: 'Logged',
  resolved: 'Resolved',
  escalated: 'Escalated',
}

interface CallForm {
  customerName: string
  customerPhone: string
  subject: string
  notes: string
  outcome: CustomerCall['outcome']
  duration: number
}

const emptyForm: CallForm = {
  customerName: '',
  customerPhone: '',
  subject: '',
  notes: '',
  outcome: 'logged',
  duration: 0,
}

export function EmployeeCalls() {
  const { toast } = useToast()
  const [calls, setCalls] = useState<CustomerCall[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CallForm>(emptyForm)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoaded(false)
    employeeApi.calls
      .list()
      .then((res) => setCalls(res.calls))
      .catch((err) => {
        const e = err as ApiError
        toast({
          title: 'Could not load calls',
          description: e.message,
          variant: 'destructive',
        })
        setCalls([])
      })
      .finally(() => setLoaded(true))
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const openDialog = () => {
    setForm(emptyForm)
    setOpen(true)
  }

  const submit = async () => {
    if (form.customerName.trim().length < 2) {
      toast({
        title: 'Customer name required',
        description: 'Please enter at least 2 characters.',
        variant: 'destructive',
      })
      return
    }
    if (form.customerPhone.trim().length < 5) {
      toast({
        title: 'Phone number required',
        description: 'Please enter a valid phone number.',
        variant: 'destructive',
      })
      return
    }
    if (form.subject.trim().length < 3) {
      toast({
        title: 'Subject required',
        description: 'Please enter a short subject for the call.',
        variant: 'destructive',
      })
      return
    }
    setBusy(true)
    try {
      const { call } = await employeeApi.calls.create({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        subject: form.subject.trim(),
        notes: form.notes.trim() || undefined,
        outcome: form.outcome,
        duration: Number.isFinite(form.duration) ? form.duration : 0,
      })
      setCalls((prev) => [call, ...prev])
      toast({
        title: 'Call logged',
        description: `Call with ${call.customerName} recorded.`,
      })
      setOpen(false)
      setForm(emptyForm)
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Could not log call',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Customer Calls"
        description="Log every customer interaction. Outcomes: Logged, Resolved, or Escalated."
        actions={
          <Button
            onClick={openDialog}
            className="bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/30 hover:bg-teal-500/25 hover:text-teal-100 border border-teal-400/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Log New Call
          </Button>
        }
      />

      {!loaded ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : calls.length === 0 ? (
        <AdminEmptyState
          title="No calls logged yet"
          description="Use “Log New Call” to record your first customer interaction."
          action={
            <Button
              onClick={openDialog}
              variant="outline"
              className="border-white/10 bg-card/40"
            >
              <Plus className="mr-2 h-4 w-4 text-teal-300" /> Log a call
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {calls.map((c) => (
            <Card
              key={c.id}
              className="border-white/10 bg-card/40 p-4 flex items-start gap-4"
            >
              <div
                className={cn(
                  'grid place-items-center h-10 w-10 rounded-lg shrink-0 ring-1',
                  c.outcome === 'resolved' &&
                    'bg-emerald-500/10 ring-emerald-500/20 text-emerald-300',
                  c.outcome === 'escalated' &&
                    'bg-rose-500/10 ring-rose-500/20 text-rose-300',
                  c.outcome === 'logged' &&
                    'bg-teal-500/10 ring-teal-500/20 text-teal-300',
                )}
              >
                <PhoneCall className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{c.subject}</h3>
                  <Badge
                    variant="outline"
                    className={OUTCOME_BADGE[c.outcome]}
                  >
                    {OUTCOME_LABEL[c.outcome]}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 flex-wrap mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    {c.customerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {c.customerPhone}
                  </span>
                  {c.duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {c.duration} min
                    </span>
                  )}
                  <span>{format(new Date(c.createdAt), 'MMM d, yyyy')}</span>
                </div>
                {c.notes && (
                  <p className="text-sm text-foreground/80 mt-2 whitespace-pre-line line-clamp-3">
                    {c.notes}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Log call dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="bg-background border-white/10 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-teal-300" /> Log New Call
            </DialogTitle>
            <DialogDescription>
              Record the customer interaction for your activity log.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customerName">Customer name</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerName: e.target.value }))
                }
                placeholder="Jane Doe"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerPhone">Customer phone</Label>
              <Input
                id="customerPhone"
                value={form.customerPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerPhone: e.target.value }))
                }
                placeholder="+1 555 0100"
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) =>
                setForm((f) => ({ ...f, subject: e.target.value }))
              }
              placeholder="What was the call about?"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Key points discussed, customer concerns, follow-up actions…"
              rows={3}
              className="bg-background/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="outcome">Outcome</Label>
              <Select
                value={form.outcome}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    outcome: v as CustomerCall['outcome'],
                  }))
                }
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="logged">Logged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={0}
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    duration: Number(e.target.value) || 0,
                  }))
                }
                className="bg-background/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="border-white/10 bg-card/40"
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={busy}
              className="bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/30 hover:bg-teal-500/25 hover:text-teal-100 border border-teal-400/20"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <PhoneCall className="mr-2 h-4 w-4" /> Log call
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

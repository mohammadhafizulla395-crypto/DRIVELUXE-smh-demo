'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Search, X, CheckCircle2, XCircle, FileText } from 'lucide-react'
import { adminApi, ApiError, type AdminTableQuery } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  AdminPageHeader, AdminTableSkeleton, AdminPagination, AdminEmptyState,
} from '../admin-ui'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

const TYPE_LABELS: Record<string, string> = {
  ticket_resolved: 'Ticket Resolved',
  review_recommended: 'Review Recommended',
  booking_assisted: 'Booking Assisted',
  refund_requested: 'Refund Requested',
  call_logged: 'Call Logged',
}

interface ReportRow {
  id: string
  employeeId: string
  type: string
  description: string
  refId: string | null
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string | null
  createdAt: string
  reviewedAt: string | null
  employee?: { id: string; employeeId: string; name: string; role: string }
}

export function AdminReports() {
  const { toast } = useToast()
  const [rows, setRows] = useState<ReportRow[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loadedKey, setLoadedKey] = useState('')
  const loaded = loadedKey !== ''
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('pending')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const [reviewTarget, setReviewTarget] = useState<{ report: ReportRow; decision: string } | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const queryKey = `${debounced}|${status}|${type}|${page}`

  const load = useCallback(() => {
    const q: AdminTableQuery = {
      search: debounced || undefined,
      status: status !== 'all' ? status : undefined,
      type: type !== 'all' ? type : undefined,
      page, limit: 10,
    }
    adminApi.reports.list(q).then((res) => {
      setRows(res.reports as ReportRow[])
      setPagination(res.pagination)
      setLoadedKey(queryKey)
    }).catch((err) => {
      const e = err as ApiError
      toast({ title: 'Load failed', description: e.message, variant: 'destructive' })
      setRows([])
      setLoadedKey(queryKey)
    })
  }, [debounced, status, type, page, queryKey, toast])

  useEffect(() => {
    load()
  }, [load])

  const confirmReview = async () => {
    if (!reviewTarget) return
    setBusy(true)
    try {
      await adminApi.reports.review(reviewTarget.report.id, {
        status: reviewTarget.decision,
        adminNote,
      })
      toast({
        title: `Report ${reviewTarget.decision}`,
        description: reviewTarget.decision === 'approved'
          ? 'Follow-up action applied automatically.'
          : 'Report rejected.',
      })
      setReviewTarget(null)
      setAdminNote('')
      load()
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Action failed', description: e.message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Employee Reports"
        description="Audit trail of employee actions. Approve or reject each report — approved ticket resolutions close the ticket; approved review recommendations publish the review."
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by description or employee…"
            className="pl-9 bg-card/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-[150px] bg-card/40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
          <SelectTrigger className="w-[170px] bg-card/40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="ticket_resolved">Ticket Resolved</SelectItem>
            <SelectItem value="review_recommended">Review Recommended</SelectItem>
            <SelectItem value="booking_assisted">Booking Assisted</SelectItem>
            <SelectItem value="refund_requested">Refund Requested</SelectItem>
            <SelectItem value="call_logged">Call Logged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!loaded ? (
        <AdminTableSkeleton cols={4} rows={6} />
      ) : rows.length === 0 ? (
        <AdminEmptyState title="No reports found" description="Employee-submitted reports will appear here for your review." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className="border-white/10 bg-card/40 p-4">
              <div className="flex items-start gap-3">
                <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="border-white/10">{TYPE_LABELS[r.type] ?? r.type}</Badge>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[r.status] ?? STATUS_STYLES.pending}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-2">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.employee?.employeeId} — {r.employee?.name} ({r.employee?.role}) · {format(new Date(r.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                  {r.adminNote && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Admin note: {r.adminNote}</p>
                  )}
                </div>
                {r.status === 'pending' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-emerald-300 hover:bg-emerald-500/10"
                      onClick={() => { setReviewTarget({ report: r, decision: 'approved' }); setAdminNote('') }}
                      aria-label="Approve"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-rose-300 hover:bg-rose-500/10"
                      onClick={() => { setReviewTarget({ report: r, decision: 'rejected' }); setAdminNote('') }}
                      aria-label="Reject"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} onPage={setPage} />

      {/* Review dialog */}
      <AlertDialog open={!!reviewTarget} onOpenChange={(o) => !o && setReviewTarget(null)}>
        <AlertDialogContent className="bg-background border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewTarget?.decision === 'approved' ? 'Approve this report?' : 'Reject this report?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewTarget?.report.description.slice(0, 120)}…
              {reviewTarget?.decision === 'approved'
                ? ' Approving will apply the follow-up action automatically (close ticket / publish review).'
                : ' The employee will see this was rejected.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Optional admin note…"
              className="bg-card/40"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReview}
              disabled={busy}
              className={reviewTarget?.decision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
            >
              {busy ? 'Working…' : reviewTarget?.decision === 'approved' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

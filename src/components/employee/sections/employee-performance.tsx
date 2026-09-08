'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  CheckCircle2,
  Clock,
  Star,
  ListTodo,
  FileText,
} from 'lucide-react'
import { employeeApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { EmployeeReport } from '@/types'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  AdminPageHeader,
  AdminEmptyState,
} from '@/components/admin/admin-ui'

interface Performance {
  metrics: {
    ticketsResolved: number
    averageResponse: number
    customerRating: number
    pendingTasks: number
  }
  recentReports: EmployeeReport[]
}

const REPORT_STATUS_BADGE: Record<EmployeeReport['status'], string> = {
  pending: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  approved: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  rejected: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
}

export function EmployeePerformance() {
  const { toast } = useToast()
  const [data, setData] = useState<Performance | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    employeeApi.performance()
      .then((res) => {
        if (!active) return
        setData(res)
      })
      .catch((err) => {
        const e = err as ApiError
        toast({
          title: 'Could not load performance',
          description: e.message,
          variant: 'destructive',
        })
      })
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [toast])

  const metrics = data?.metrics
  const cards = [
    {
      label: 'Tickets Resolved',
      value: metrics?.ticketsResolved ?? 0,
      icon: CheckCircle2,
      tint: 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20',
      hint: 'All-time total',
    },
    {
      label: 'Avg. Response',
      value: metrics ? `${metrics.averageResponse} min` : '—',
      icon: Clock,
      tint: 'text-sky-300 bg-sky-500/10 ring-sky-500/20',
      hint: 'Per ticket',
    },
    {
      label: 'Customer Rating',
      value: metrics ? metrics.customerRating.toFixed(1) : '—',
      icon: Star,
      tint: 'text-amber-300 bg-amber-500/10 ring-amber-500/20',
      hint: 'Out of 5.0',
    },
    {
      label: 'Pending Tasks',
      value: metrics?.pendingTasks ?? 0,
      icon: ListTodo,
      tint: 'text-teal-300 bg-teal-500/10 ring-teal-500/20',
      hint: 'Currently open',
    },
  ]

  const reports = data?.recentReports ?? []

  return (
    <div>
      <AdminPageHeader
        title="My Performance"
        description="Your operational metrics and the status of reports you've submitted."
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {!loaded
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-white/10 bg-card/40 p-5">
                <Skeleton className="h-9 w-9 rounded-lg bg-white/5 mb-3" />
                <Skeleton className="h-7 w-16 bg-white/5 mb-2" />
                <Skeleton className="h-3 w-24 bg-white/5" />
              </Card>
            ))
          : cards.map((c) => {
              const Icon = c.icon
              return (
                <Card
                  key={c.label}
                  className="border-white/10 bg-card/40 p-5"
                >
                  <div
                    className={cn(
                      'inline-grid place-items-center h-9 w-9 rounded-lg ring-1 mb-3',
                      c.tint,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{c.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {c.hint}
                  </p>
                </Card>
              )
            })}
      </div>

      {/* Recent reports */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Submitted Reports
        </h2>
        {!loaded ? (
          <Card className="border-white/10 bg-card/40 p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-white/5" />
            ))}
          </Card>
        ) : reports.length === 0 ? (
          <AdminEmptyState
            title="No reports submitted"
            description="When you submit reports (e.g. booking issue escalations), they appear here for tracking."
          />
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <Card
                key={r.id}
                className="border-white/10 bg-card/40 p-3 flex items-start gap-3"
              >
                <FileText className="h-4 w-4 text-teal-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.description}</p>
                  <div className="flex items-center gap-3 flex-wrap mt-1 text-xs text-muted-foreground">
                    <span className="capitalize">
                      Type: <span className="text-foreground/80">{r.type}</span>
                    </span>
                    <span>
                      Submitted{' '}
                      {format(new Date(r.createdAt), 'MMM d, yyyy')}
                    </span>
                    {r.reviewedAt && (
                      <span>
                        Reviewed{' '}
                        {format(new Date(r.reviewedAt), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  {r.adminNote && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">
                      Admin note: {r.adminNote}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'capitalize shrink-0',
                    REPORT_STATUS_BADGE[r.status],
                  )}
                >
                  {r.status}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

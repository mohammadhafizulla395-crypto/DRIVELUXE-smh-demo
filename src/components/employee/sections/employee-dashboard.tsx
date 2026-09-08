'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  CheckSquare,
  LifeBuoy,
  CheckCircle2,
  FileText,
  ArrowRight,
  Phone,
  Calendar,
} from 'lucide-react'
import { employeeApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useUIStore } from '@/store/ui-store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminPageHeader } from '@/components/admin/admin-ui'
import type { EmployeeStats, Task, EmployeeReport } from '@/types'

const TASK_STATUS_BADGE: Record<Task['status'], string> = {
  pending: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  in_progress: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  done: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
}

const REPORT_STATUS_BADGE: Record<EmployeeReport['status'], string> = {
  pending: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  approved: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  rejected: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
}

export function EmployeeDashboard() {
  const { navigate } = useUIStore()
  const { toast } = useToast()
  const [stats, setStats] = useState<EmployeeStats | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [reports, setReports] = useState<EmployeeReport[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      employeeApi.stats(),
      employeeApi.tasks.list(),
      employeeApi.reports(),
    ])
      .then(([s, t, r]) => {
        if (!active) return
        setStats(s)
        setTasks(t.tasks.slice(0, 5))
        setReports(r.reports.slice(0, 5))
      })
      .catch((err) => {
        const e = err as ApiError
        toast({
          title: 'Could not load dashboard',
          description: e.message,
          variant: 'destructive',
        })
      })
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [toast])

  const cards = [
    {
      label: 'Pending Tasks',
      value: stats?.pendingTasks,
      icon: CheckSquare,
      tint: 'text-amber-300 bg-amber-500/10 ring-amber-500/20',
      onClick: () => navigate('employee-tasks'),
    },
    {
      label: 'Assigned Tickets',
      value: stats?.assignedTickets,
      icon: LifeBuoy,
      tint: 'text-sky-300 bg-sky-500/10 ring-sky-500/20',
      onClick: () => navigate('employee-tickets'),
    },
    {
      label: 'Resolved Today',
      value: stats?.resolvedToday,
      icon: CheckCircle2,
      tint: 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20',
      onClick: () => navigate('employee-tickets'),
    },
    {
      label: 'Pending Reports',
      value: stats?.pendingReports,
      icon: FileText,
      tint: 'text-teal-300 bg-teal-500/10 ring-teal-500/20',
      onClick: () => navigate('employee-performance'),
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Your daily operational snapshot — tasks, tickets and reports at a glance."
      />

      {/* Stat cards */}
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
                <button
                  key={c.label}
                  type="button"
                  onClick={c.onClick}
                  className="text-left"
                >
                  <Card className="border-white/10 bg-card/40 p-5 hover:border-teal-400/30 hover:bg-card/60 transition-colors cursor-pointer">
                    <div
                      className={`inline-grid place-items-center h-9 w-9 rounded-lg ring-1 ${c.tint} mb-3`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold tracking-tight">
                      {c.value ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.label}
                    </p>
                  </Card>
                </button>
              )
            })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          variant="outline"
          onClick={() => navigate('employee-tasks')}
          className="border-white/10 bg-card/40 hover:bg-card/60"
        >
          <CheckSquare className="mr-2 h-4 w-4 text-teal-300" /> View tasks
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('employee-tickets')}
          className="border-white/10 bg-card/40 hover:bg-card/60"
        >
          <LifeBuoy className="mr-2 h-4 w-4 text-teal-300" /> Open tickets
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('employee-calls')}
          className="border-white/10 bg-card/40 hover:bg-card/60"
        >
          <Phone className="mr-2 h-4 w-4 text-teal-300" /> Log a call
        </Button>
      </div>

      {/* Two columns: tasks + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My tasks preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              My Tasks
            </h2>
            <button
              type="button"
              onClick={() => navigate('employee-tasks')}
              className="inline-flex items-center gap-1 text-xs text-teal-300 hover:text-teal-200"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {!loaded ? (
            <Card className="border-white/10 bg-card/40 p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-white/5" />
              ))}
            </Card>
          ) : tasks.length === 0 ? (
            <Card className="border-white/10 bg-card/40 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No tasks assigned. You&apos;re all caught up.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <Card
                  key={t.id}
                  className="border-white/10 bg-card/40 p-3 flex items-center gap-3"
                >
                  <CheckSquare className="h-4 w-4 text-teal-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    {t.dueDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        Due {format(new Date(t.dueDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize ${TASK_STATUS_BADGE[t.status]}`}
                  >
                    {t.status.replace('_', ' ')}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity (reports) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent Activity
            </h2>
            <button
              type="button"
              onClick={() => navigate('employee-performance')}
              className="inline-flex items-center gap-1 text-xs text-teal-300 hover:text-teal-200"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {!loaded ? (
            <Card className="border-white/10 bg-card/40 p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-white/5" />
              ))}
            </Card>
          ) : reports.length === 0 ? (
            <Card className="border-white/10 bg-card/40 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No recent reports submitted.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <Card
                  key={r.id}
                  className="border-white/10 bg-card/40 p-3 flex items-center gap-3"
                >
                  <FileText className="h-4 w-4 text-teal-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(r.createdAt), 'MMM d, yyyy')} ·{' '}
                      <span className="capitalize">{r.type}</span>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize ${REPORT_STATUS_BADGE[r.status]}`}
                  >
                    {r.status}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  CheckCircle2,
  Clock,
  XCircle,
  CalendarDays,
} from 'lucide-react'
import { employeeApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Attendance } from '@/types'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AdminPageHeader,
  AdminEmptyState,
} from '@/components/admin/admin-ui'

const STATUS_BADGE: Record<Attendance['status'], string> = {
  present: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  absent: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
  late: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  half_day: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  leave: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300',
}

const STATUS_LABEL: Record<Attendance['status'], string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  half_day: 'Half day',
  leave: 'Leave',
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'h:mm a')
  } catch {
    return '—'
  }
}

export function EmployeeAttendance() {
  const { toast } = useToast()
  const [records, setRecords] = useState<Attendance[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    employeeApi.attendance()
      .then((res) => {
        if (!active) return
        setRecords(res.attendance)
      })
      .catch((err) => {
        const e = err as ApiError
        toast({
          title: 'Could not load attendance',
          description: e.message,
          variant: 'destructive',
        })
      })
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [toast])

  // Compute summary stats
  const summary = useMemo(() => {
    const present = records.filter(
      (r) => r.status === 'present' || r.status === 'half_day',
    ).length
    const late = records.filter((r) => r.status === 'late').length
    const absent = records.filter((r) => r.status === 'absent').length
    return { present, late, absent, total: records.length }
  }, [records])

  // Sort newest first
  const sorted = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [records],
  )

  const cards = [
    {
      label: 'Present Days',
      value: summary.present,
      icon: CheckCircle2,
      tint: 'text-emerald-300 bg-emerald-500/10 ring-emerald-500/20',
    },
    {
      label: 'Late Arrivals',
      value: summary.late,
      icon: Clock,
      tint: 'text-amber-300 bg-amber-500/10 ring-amber-500/20',
    },
    {
      label: 'Absent Days',
      value: summary.absent,
      icon: XCircle,
      tint: 'text-rose-300 bg-rose-500/10 ring-rose-500/20',
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Attendance"
        description="Your daily check-in/check-out history. Summary is computed from your records."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {!loaded
          ? Array.from({ length: 3 }).map((_, i) => (
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
                </Card>
              )
            })}
      </div>

      {/* Records table */}
      {!loaded ? (
        <Card className="border-white/10 bg-card/40 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-white/5" />
          ))}
        </Card>
      ) : sorted.length === 0 ? (
        <AdminEmptyState
          title="No attendance records yet"
          description="Your check-ins will appear here once records are created."
        />
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-white/10">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Check-in</TableHead>
                <TableHead className="text-muted-foreground">Check-out</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((a) => (
                <TableRow
                  key={a.id}
                  className="border-white/5 hover:bg-white/5"
                >
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(new Date(a.date), 'EEE, MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatTime(a.checkIn)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatTime(a.checkOut)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(STATUS_BADGE[a.status])}
                    >
                      {STATUS_LABEL[a.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.notes || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

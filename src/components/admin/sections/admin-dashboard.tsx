'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  CalendarCheck,
  Clock,
  RotateCcw,
  LifeBuoy,
  Car as CarIcon,
  Users,
  CircleDollarSign,
  ArrowRight,
  Activity as ActivityIcon,
} from 'lucide-react'
import { adminApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useUIStore } from '@/store/ui-store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AdminPageHeader } from '../admin-ui'
import type { AdminStats, UpcomingPickup, Activity } from '@/types'

export function AdminDashboard() {
  const { navigate } = useUIStore()
  const { toast } = useToast()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pickups, setPickups] = useState<UpcomingPickup[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([adminApi.stats(), adminApi.pickups(), adminApi.activity(8)])
      .then(([s, p, a]) => {
        if (!active) return
        setStats(s)
        setPickups(p.pickups)
        setActivity(a.activities)
      })
      .catch((err) => {
        const e = err as ApiError
        toast({ title: 'Could not load dashboard', description: e.message, variant: 'destructive' })
      })
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [toast])

  const cards = [
    {
      label: 'Bookings Today',
      value: stats?.bookingsToday,
      icon: CalendarCheck,
      tint: 'text-amber-300 bg-amber-500/10',
      view: 'admin-bookings' as const,
    },
    {
      label: 'Pending Pickups',
      value: stats?.pendingPickups,
      icon: Clock,
      tint: 'text-sky-300 bg-sky-500/10',
      view: 'admin-bookings' as const,
    },
    {
      label: 'Pending Returns',
      value: stats?.pendingReturns,
      icon: RotateCcw,
      tint: 'text-violet-300 bg-violet-500/10',
      view: 'admin-bookings' as const,
    },
    {
      label: 'Open Complaints',
      value: stats?.openComplaints,
      icon: LifeBuoy,
      tint: 'text-rose-300 bg-rose-500/10',
      view: 'admin-complaints' as const,
    },
  ]

  const quickActions = [
    { label: 'Add a car', view: 'admin-cars' as const, icon: CarIcon },
    { label: 'View bookings', view: 'admin-bookings' as const, icon: CalendarCheck },
    { label: 'Manage payments', view: 'admin-payments' as const, icon: CircleDollarSign },
    { label: 'See customers', view: 'admin-customers' as const, icon: Users },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Operations Dashboard"
        description="Today's operational snapshot — no graphs, just what needs attention."
      />

      {/* Operational cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => navigate(c.view)}
            className="text-left"
          >
            <Card className="p-5 border-white/10 bg-card/50 hover:border-primary/30 transition-colors h-full">
              <div className={`grid place-items-center h-10 w-10 rounded-lg mb-3 ${c.tint}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-bold">
                {!loaded ? <Skeleton className="h-8 w-10 bg-white/10" /> : (c.value ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            </Card>
          </button>
        ))}
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MiniStat label="Total Cars" value={stats?.totalCars} loaded={loaded} />
        <MiniStat label="Total Bookings" value={stats?.totalBookings} loaded={loaded} />
        <MiniStat label="Customers" value={stats?.totalUsers} loaded={loaded} />
        <MiniStat label="Revenue" value={stats ? `$${Math.round(stats.revenue)}` : undefined} loaded={loaded} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Upcoming pickups */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Upcoming Pickups</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('admin-bookings')} className="text-primary">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          {!loaded ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
              ))}
            </div>
          ) : pickups.length === 0 ? (
            <Card className="p-8 text-center border-white/10 bg-card/30">
              <p className="text-sm text-muted-foreground">No upcoming pickups scheduled.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {pickups.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-card/40 p-3"
                >
                  <img
                    src={p.car.image}
                    alt={p.car.name}
                    className="h-12 w-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.car.brand} {p.car.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.user.name} · {p.pickupLocation}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{format(new Date(p.startDate), 'MMM d')}</p>
                    <span className="text-[10px] uppercase tracking-wide text-primary">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          {!loaded ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg bg-white/5" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <Card className="p-8 text-center border-white/10 bg-card/30">
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            </Card>
          ) : (
            <div className="space-y-1.5">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 text-sm rounded-lg px-3 py-2 hover:bg-white/5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-foreground/90">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(a.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((qa) => (
            <button
              key={qa.view}
              onClick={() => navigate(qa.view)}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-card/40 p-4 hover:border-primary/30 hover:bg-card/70 transition-colors text-left"
            >
              <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary/10 text-primary">
                <qa.icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  loaded,
}: {
  label: string
  value?: string | number
  loaded: boolean
}) {
  return (
    <Card className="p-4 border-white/10 bg-card/30">
      <p className="text-xl font-bold">{!loaded ? <Skeleton className="h-5 w-12 bg-white/5" /> : (value ?? '—')}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Card>
  )
}

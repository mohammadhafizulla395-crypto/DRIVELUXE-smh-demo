'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  Car, CalendarClock, Gift, LifeBuoy, ArrowRight, TrendingUp,
} from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { bookingsApi, pointsApi, supportApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Booking } from '@/types'

export function CustomerDashboard() {
  const { navigate } = useUIStore()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [points, setPoints] = useState(0)
  const [openTickets, setOpenTickets] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      bookingsApi.list(),
      pointsApi.mine(),
      supportApi.list(),
    ])
      .then(([b, p, s]) => {
        if (!active) return
        setBookings(b.bookings)
        setPoints(p.points)
        setOpenTickets(s.tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length)
      })
      .catch((err) => {
        const e = err as ApiError
        toast({ title: 'Could not load dashboard', description: e.message, variant: 'destructive' })
      })
      .finally(() => active && setLoaded(true))
    return () => { active = false }
  }, [toast])

  const now = new Date()
  const activeRental = bookings.find((b) => b.status === 'in_use' || b.status === 'pickup')
  const upcomingBooking = bookings.find((b) =>
    (b.status === 'booked' || b.status === 'paid') && new Date(b.startDate) > now,
  )

  const cards = [
    {
      label: 'Active Rental',
      value: activeRental ? `${activeRental.car?.brand ?? ''} ${activeRental.car?.name ?? ''}` : 'None',
      sub: activeRental ? `Return ${format(new Date(activeRental.endDate), 'MMM d')}` : 'No active rental',
      icon: Car,
      tint: 'text-violet-300 bg-violet-500/10',
      view: 'booking-timeline' as const,
    },
    {
      label: 'Upcoming Booking',
      value: upcomingBooking ? `${upcomingBooking.car?.brand ?? ''} ${upcomingBooking.car?.name ?? ''}` : 'None',
      sub: upcomingBooking ? `Pickup ${format(new Date(upcomingBooking.startDate), 'MMM d')}` : 'No upcoming bookings',
      icon: CalendarClock,
      tint: 'text-sky-300 bg-sky-500/10',
      view: 'bookings' as const,
    },
    {
      label: 'Reward Points',
      value: user ? String(points) : '—',
      sub: 'Lifetime loyalty balance',
      icon: Gift,
      tint: 'text-amber-300 bg-amber-500/10',
      view: 'points' as const,
    },
    {
      label: 'Support Status',
      value: openTickets > 0 ? `${openTickets} open` : 'All clear',
      sub: openTickets > 0 ? 'Tickets awaiting response' : 'No open tickets',
      icon: LifeBuoy,
      tint: openTickets > 0 ? 'text-rose-300 bg-rose-500/10' : 'text-emerald-300 bg-emerald-500/10',
      view: 'support' as const,
    },
  ]

  const recentBookings = bookings.slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Hello, {user?.name.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Your DriveLuxe control center — manage bookings, payments, reviews, and more.
        </p>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <button key={c.label} onClick={() => navigate(c.view)} className="text-left">
            <Card className="p-5 border-white/10 bg-card/50 hover:border-primary/30 transition-colors h-full">
              <div className={`grid place-items-center h-10 w-10 rounded-lg mb-3 ${c.tint}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="text-lg font-bold truncate">
                {!loaded ? <Skeleton className="h-6 w-20 bg-white/10" /> : c.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">{c.sub}</p>
            </Card>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Button variant="outline" onClick={() => navigate('cars')} className="justify-start">
          <Car className="h-4 w-4 mr-2" /> Browse fleet
        </Button>
        <Button variant="outline" onClick={() => navigate('booking-timeline')} className="justify-start">
          <TrendingUp className="h-4 w-4 mr-2" /> Booking timeline
        </Button>
        <Button variant="outline" onClick={() => navigate('payment-history')} className="justify-start">
          View payments
        </Button>
        <Button variant="outline" onClick={() => navigate('support')} className="justify-start">
          Get support
        </Button>
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Bookings</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('bookings')} className="text-primary">
            View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
        {!loaded ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <Card className="p-8 text-center border-white/10 bg-card/30">
            <p className="text-sm text-muted-foreground">No bookings yet. Browse the fleet to get started!</p>
            <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => navigate('cars')}>
              Browse fleet
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-card/40 p-3 hover:bg-card/70 transition-colors cursor-pointer"
                onClick={() => navigate('booking-timeline')}
              >
                {b.car && (
                  <img src={b.car.image} alt={b.car.name} className="h-12 w-16 object-cover rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.car?.brand} {b.car?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(b.startDate), 'MMM d')} → {format(new Date(b.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="outline" className="border-white/10 capitalize shrink-0">
                  {b.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

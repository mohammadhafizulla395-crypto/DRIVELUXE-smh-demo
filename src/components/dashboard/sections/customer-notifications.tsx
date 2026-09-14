'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Bell, Car, CreditCard, Star, LifeBuoy, Gift } from 'lucide-react'
import { notificationsApi, ApiError, type CustomerNotification } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<string, typeof Bell> = {
  booking: Car,
  payment: CreditCard,
  review: Star,
  ticket: LifeBuoy,
  points: Gift,
}

const TYPE_TINTS: Record<string, string> = {
  booking: 'text-violet-300 bg-violet-500/10',
  payment: 'text-emerald-300 bg-emerald-500/10',
  review: 'text-amber-300 bg-amber-500/10',
  ticket: 'text-sky-300 bg-sky-500/10',
  points: 'text-teal-300 bg-teal-500/10',
}

export function CustomerNotifications() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<CustomerNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    notificationsApi.mine()
      .then((res) => {
        if (!active) return
        setNotifications(res.notifications)
        setUnread(res.unread)
      })
      .catch((err) => {
        const e = err as ApiError
        toast({ title: 'Could not load notifications', description: e.message, variant: 'destructive' })
      })
      .finally(() => active && setLoaded(true))
    return () => { active = false }
  }, [toast])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated on your bookings, payments, reviews, and support.</p>
        </div>
        {loaded && unread > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary px-3 py-1 text-sm font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {unread} unread
          </span>
        )}
      </div>

      {!loaded ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center border-white/10 bg-card/30">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notifications yet. You'll be notified about booking updates, payments, and more.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell
            return (
              <Card
                key={n.id}
                className={cn(
                  'border-white/10 bg-card/40 p-4 flex items-start gap-3',
                  !n.read && 'border-primary/20 bg-primary/5',
                )}
              >
                <span className={cn('grid place-items-center h-9 w-9 rounded-lg shrink-0', TYPE_TINTS[n.type] ?? 'text-muted-foreground bg-white/5')}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {format(new Date(n.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

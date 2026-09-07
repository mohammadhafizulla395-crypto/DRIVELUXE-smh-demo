'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  Wallet,
  X,
  Loader2,
  Car as CarIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { StatCard } from '@/components/shared/stat-card'
import { ProfileForm } from '@/components/auth/profile-form'
import { bookingsApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import { useToast } from '@/hooks/use-toast'
import type { Booking } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function UserDashboard() {
  const { user } = useAuthStore()
  const { navigate } = useUIStore()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    bookingsApi
      .list()
      .then((res) => setBookings(res.bookings))
      .catch((err) => {
        const e = err as ApiError
        setBookings([])
        toast({
          title: 'Could not load bookings',
          description: e.message,
          variant: 'destructive',
        })
      })
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'pending',
    ).length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    spent: bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0),
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await bookingsApi.updateStatus(cancelTarget.id, 'cancelled')
      toast({ title: 'Booking cancelled', description: 'Your booking has been cancelled.' })
      setCancelTarget(null)
      load()
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Could not cancel',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setCancelling(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Hello, {user.name.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your bookings and profile.
        </p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Total bookings"
          value={loading ? '—' : String(stats.total)}
          tint="text-amber-300 bg-amber-500/10"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Upcoming"
          value={loading ? '—' : String(stats.upcoming)}
          tint="text-sky-300 bg-sky-500/10"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={loading ? '—' : String(stats.completed)}
          tint="text-emerald-300 bg-emerald-500/10"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Total spent"
          value={loading ? '—' : `$${Math.round(stats.spent)}`}
          tint="text-primary bg-primary/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Booking history</h2>
            <Button size="sm" variant="outline" onClick={() => navigate('cars')}>
              <CarIcon className="h-4 w-4 mr-2" /> Book another
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <Card className="p-10 text-center border-white/10 bg-card/40">
              <CarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold">No bookings yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Browse the fleet and book your first ride.
              </p>
              <Button onClick={() => navigate('cars')}>Browse fleet</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  className="rounded-xl border border-white/10 bg-card/50 p-4 flex flex-col sm:flex-row gap-4"
                >
                  {b.car && (
                    <img
                      src={b.car.image}
                      alt={b.car.name}
                      className="h-20 w-full sm:w-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-primary">
                          {b.car?.brand}
                        </p>
                        <h3 className="font-semibold">{b.car?.name}</h3>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(b.startDate), 'MMM d')} →{' '}
                        {format(new Date(b.endDate), 'MMM d, yyyy')}
                      </span>
                      <span>· {b.totalDays} day{b.totalDays === 1 ? '' : 's'}</span>
                      <span>· {b.pickupLocation}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold">${b.totalPrice}</span>
                      {(b.status === 'confirmed' || b.status === 'pending') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
                          onClick={() => setCancelTarget(b)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* profile */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Card className="p-5 border-white/10 bg-card/50">
            <h2 className="font-semibold mb-4">Profile</h2>
            <ProfileForm />
          </Card>
        </div>
      </div>

      {/* cancel dialog */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
      >
        <AlertDialogContent className="bg-background border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.car?.name} ·{' '}
              {cancelTarget &&
                format(new Date(cancelTarget.startDate), 'MMM d')}{' '}
              →{' '}
              {cancelTarget &&
                format(new Date(cancelTarget.endDate), 'MMM d')}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={cancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

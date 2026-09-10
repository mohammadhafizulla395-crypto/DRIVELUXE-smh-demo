'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Check, Car, CreditCard, Key, Gauge, RotateCcw, CheckCircle2, X, Loader2 } from 'lucide-react'
import { bookingsApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useUIStore } from '@/store/ui-store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Booking, BookingStatus } from '@/types'

const STEPS: { key: BookingStatus; label: string; icon: typeof Car }[] = [
  { key: 'booked', label: 'Booked', icon: Car },
  { key: 'payment_processing', label: 'Payment', icon: CreditCard },
  { key: 'paid', label: 'Paid', icon: CheckCircle2 },
  { key: 'pickup', label: 'Pickup', icon: Key },
  { key: 'in_use', label: 'In Use', icon: Gauge },
  { key: 'returned', label: 'Returned', icon: RotateCcw },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
]

const STEP_ORDER: Record<BookingStatus, number> = {
  booked: 0,
  payment_processing: 1,
  paid: 2,
  pickup: 3,
  in_use: 4,
  returned: 5,
  completed: 6,
  cancelled: -1,
}

export function BookingTimeline() {
  const { toast } = useToast()
  const { navigate } = useUIStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loaded, setLoaded] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    bookingsApi.list()
      .then((res) => { if (active) setBookings(res.bookings) })
      .catch((err) => {
        const e = err as ApiError
        toast({ title: 'Could not load bookings', description: e.message, variant: 'destructive' })
      })
      .finally(() => active && setLoaded(true))
    return () => { active = false }
  }, [toast])

  const handleCancel = async (id: string) => {
    setCancelling(id)
    try {
      await bookingsApi.updateStatus(id, 'cancelled')
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b)))
      toast({ title: 'Booking cancelled', description: 'Points have been reversed.' })
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Could not cancel', description: e.message, variant: 'destructive' })
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Booking Timeline</h1>
        <p className="text-muted-foreground mt-1">
          Track every booking through its full journey: Booked → Paid → Pickup → In Use → Returned → Completed.
        </p>
      </div>

      {!loaded ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="p-12 text-center border-white/10 bg-card/30">
          <p className="text-muted-foreground">No bookings yet.</p>
          <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => navigate('cars')}>
            Browse fleet
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {bookings.map((b) => {
            const currentStep = STEP_ORDER[b.status]
            const isCancelled = b.status === 'cancelled'
            return (
              <Card key={b.id} className="border-white/10 bg-card/40 p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-5">
                  {b.car && (
                    <img src={b.car.image} alt={b.car.name} className="h-16 w-24 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary">{b.car?.brand}</p>
                    <h3 className="text-lg font-semibold">{b.car?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(b.startDate), 'MMM d')} → {format(new Date(b.endDate), 'MMM d, yyyy')} · {b.totalDays} day{b.totalDays === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">${b.totalPrice}</p>
                    {isCancelled ? (
                      <Badge variant="outline" className="border-rose-500/30 text-rose-300">Cancelled</Badge>
                    ) : (
                      <Badge variant="outline" className="border-white/10 capitalize">{b.status.replace('_', ' ')}</Badge>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                {isCancelled ? (
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-center">
                    <X className="h-5 w-5 text-rose-300 mx-auto mb-1" />
                    <p className="text-sm text-rose-200">This booking was cancelled. Points have been reversed.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Progress line */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-white/10" />
                    <div
                      className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-500"
                      style={{ width: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - ${currentStep === 0 ? 0 : 1.25}rem)` }}
                    />
                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {STEPS.map((step, i) => {
                        const isDone = i < currentStep
                        const isCurrent = i === currentStep
                        const Icon = step.icon
                        return (
                          <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                            <div
                              className={cn(
                                'grid place-items-center h-10 w-10 rounded-full border-2 transition-all z-10',
                                isDone && 'bg-primary border-primary text-primary-foreground',
                                isCurrent && 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20',
                                !isDone && !isCurrent && 'bg-card border-white/10 text-muted-foreground',
                              )}
                            >
                              {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                            </div>
                            <span
                              className={cn(
                                'text-[10px] font-medium text-center',
                                (isDone || isCurrent) ? 'text-foreground' : 'text-muted-foreground',
                              )}
                            >
                              {step.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {(b.status === 'booked' || b.status === 'paid') && (
                  <div className="mt-5 pt-4 border-t border-white/5 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
                      onClick={() => handleCancel(b.id)}
                      disabled={cancelling === b.id}
                    >
                      {cancelling === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <X className="h-3.5 w-3.5 mr-1" />}
                      Cancel booking
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

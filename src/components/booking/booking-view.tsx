'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { format, differenceInCalendarDays, isBefore, startOfDay } from 'date-fns'
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar as CalendarIcon,
  Check,
  CreditCard,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { carsApi, bookingsApi, paymentsApi, ApiError } from '@/lib/api'
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay-client'
import type { Car } from '@/types'
import type { DateRange } from 'react-day-picker'

const LOCATIONS = [
  'Downtown Office',
  'Airport Terminal',
  'Riverside Hub',
  'Hotel Delivery',
]

export function BookingView({ carId }: { carId: string }) {
  const { navigate } = useUIStore()
  const { toast } = useToast()
  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<DateRange | undefined>()
  const [location, setLocation] = useState('Downtown Office')
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    carsApi
      .detail(carId)
      .then((res) => setCar(res.car))
      .catch(() => setCar(null))
      .finally(() => setLoading(false))
  }, [carId])

  const totalDays = useMemo(() => {
    if (!range?.from || !range?.to) return 0
    return Math.max(1, differenceInCalendarDays(range.to, range.from) + 1)
  }, [range])

  const totalPrice = car ? Math.round(totalDays * car.pricePerDay * 100) / 100 : 0

  const today = startOfDay(new Date())

  const handleConfirm = async () => {
    if (!car || !range?.from || !range?.to) return
    setSubmitting(true)
    try {
      await bookingsApi.create({
        carId: car.id,
        startDate: range.from.toISOString(),
        endDate: range.to.toISOString(),
        pickupLocation: location,
      })
      // Don't navigate away — show the payment step
      // We need the booking ID from the response
      const bookingRes = await bookingsApi.list()
      const latestBooking = bookingRes.bookings[0] // most recent
      setBookingId(latestBooking.id)
      toast({
        title: 'Booking created!',
        description: `Your ${car.brand} ${car.name} is reserved. Complete payment to confirm.`,
      })
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Could not complete booking',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayNow = async () => {
    if (!bookingId || !car || !user) return
    setPaying(true)
    try {
      // Step 1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast({
          title: 'Payment Error',
          description: 'Could not load the payment gateway. Please try again.',
          variant: 'destructive',
        })
        setPaying(false)
        return
      }

      // Step 2: Create Razorpay order (booking → payment_processing)
      const order = await paymentsApi.createOrder(bookingId)

      // Step 3: Open Razorpay checkout
      openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || undefined,
        carName: `${car.brand} ${car.name}`,
        onSuccess: async (response) => {
          // Step 4: Verify signature (payment_processing → paid)
          try {
            const result = await paymentsApi.verifyPayment({
              bookingId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })

            toast({
              title: 'Payment verified!',
              description: `Your booking is now confirmed.${result.pointsEarned > 0 ? ` You earned ${result.pointsEarned} points!` : ''}`,
            })
            navigate('booking-timeline')
          } catch (err) {
            const e = err as ApiError
            toast({
              title: 'Payment verification failed',
              description: e.message || 'Your payment could not be verified. Please contact support.',
              variant: 'destructive',
            })
            setPaying(false)
          }
        },
        onFailure: (error) => {
          toast({
            title: 'Payment failed',
            description: error.description || 'The payment was not completed.',
            variant: 'destructive',
          })
          setPaying(false)
        },
        onDismiss: () => {
          toast({
            title: 'Payment cancelled',
            description: 'You can complete the payment later from your bookings.',
          })
          setPaying(false)
        },
      })
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Could not initiate payment',
        description: e.message,
        variant: 'destructive',
      })
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-32 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
      </div>
    )
  }

  if (!car) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <h2 className="text-2xl font-bold">Car not found</h2>
        <Button className="mt-6" onClick={() => navigate('cars')}>
          Back to fleet
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      <button
        onClick={() => navigate('car-detail', { carId })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {car.name}
      </button>

      <h1 className="text-3xl font-bold tracking-tight mb-8">Complete your booking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Left: form */}
        <div className="space-y-8">
          {/* car summary */}
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-card/50 p-4">
            <img
              src={car.image}
              alt={car.name}
              className="h-20 w-32 object-cover rounded-lg"
            />
            <div>
              <p className="text-xs text-primary">{car.brand}</p>
              <h3 className="text-lg font-semibold">{car.name}</h3>
              <p className="text-sm text-muted-foreground">
                ${Math.round(car.pricePerDay)} / day
              </p>
            </div>
          </div>

          {/* dates */}
          <section className="rounded-xl border border-white/10 bg-card/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Select your dates</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={1}
                disabled={(date) => isBefore(date, today)}
                className="rounded-lg border border-white/10 bg-background p-2"
              />
              <div className="flex-1 w-full space-y-3">
                <DateField
                  label="Pickup date"
                  value={range?.from ? format(range.from, 'MMM d, yyyy') : '—'}
                />
                <DateField
                  label="Return date"
                  value={range?.to ? format(range.to, 'MMM d, yyyy') : '—'}
                />
                <DateField
                  label="Total days"
                  value={totalDays > 0 ? `${totalDays} day${totalDays === 1 ? '' : 's'}` : '—'}
                  highlight
                />
              </div>
            </div>
          </section>

          {/* pickup */}
          <section className="rounded-xl border border-white/10 bg-card/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Pickup location</h2>
            </div>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        </div>

        {/* Right: summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-white/10 bg-card/60 p-6 space-y-4"
          >
            <h2 className="font-semibold text-lg">Booking summary</h2>

            <div className="space-y-2.5 text-sm">
              <Row label="Vehicle" value={`${car.brand} ${car.name}`} />
              <Row
                label="Daily rate"
                value={`$${Math.round(car.pricePerDay)}`}
              />
              <Row
                label="Pickup"
                value={range?.from ? format(range.from, 'MMM d') : '—'}
              />
              <Row
                label="Return"
                value={range?.to ? format(range.to, 'MMM d') : '—'}
              />
              <Row label="Days" value={totalDays > 0 ? `${totalDays}` : '—'} />
              <Row label="Pickup at" value={location} />
            </div>

            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <span className="font-medium">Total</span>
              <span className="text-2xl font-bold text-gradient-gold">
                ₹{totalPrice}
              </span>
            </div>

            {bookingId ? (
              <>
                {/* Payment step — booking created, now pay */}
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-300" />
                    <p className="text-sm font-medium text-amber-200">
                      Booking created — payment required
                    </p>
                  </div>
                  <p className="text-xs text-amber-200/70">
                    Your booking is reserved. Complete the payment now to confirm your rental.
                    You can also pay later from your dashboard.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12"
                  disabled={paying}
                  onClick={handlePayNow}
                >
                  {paying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" /> Pay ₹{totalPrice} Now
                    </>
                  )}
                </Button>
                <button
                  onClick={() => navigate('booking-timeline')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Pay later — go to my bookings
                </button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12"
                  disabled={!range?.from || !range?.to || totalDays === 0 || submitting}
                  onClick={handleConfirm}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...
                    </>
                  ) : (
                    <>
                      Confirm booking <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Secured by Razorpay · Test Mode
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function DateField({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        highlight
          ? 'border-primary/30 bg-primary/5'
          : 'border-white/10 bg-background/40'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`text-sm font-medium ${highlight ? 'text-primary' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate max-w-[60%]">{value}</span>
    </div>
  )
}

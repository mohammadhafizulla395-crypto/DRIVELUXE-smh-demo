'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  Settings,
  Fuel,
  Calendar,
  Check,
  ArrowRight,
  Loader2,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CarCard } from './car-card'
import { Stars } from '@/components/shared/stars'
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { carsApi } from '@/lib/api'
import type { Car } from '@/types'

export function CarDetailView({ carId }: { carId: string }) {
  const { setView } = useUIStore()
  const { isAuthenticated } = useAuthStore()
  const [car, setCar] = useState<Car | null>(null)
  const [related, setRelated] = useState<Car[]>([])
  const [loadedId, setLoadedId] = useState('')
  const loading = loadedId !== carId

  useEffect(() => {
    let active = true
    carsApi
      .detail(carId)
      .then((res) => {
        if (!active) return
        setCar(res.car)
        setRelated(res.related)
        setLoadedId(carId)
      })
      .catch(() => {
        if (!active) return
        setCar(null)
        setLoadedId(carId)
      })
    return () => {
      active = false
    }
  }, [carId])

  const handleBook = () => {
    if (!isAuthenticated) {
      setView('login')
      return
    }
    setView('booking', { carId })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
        <Skeleton className="h-5 w-24 mb-6 bg-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-video w-full rounded-xl bg-white/5" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24 bg-white/5" />
            <Skeleton className="h-10 w-3/4 bg-white/5" />
            <Skeleton className="h-6 w-1/3 bg-white/5" />
            <Skeleton className="h-24 w-full bg-white/5" />
          </div>
        </div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <h2 className="text-2xl font-bold">Car not found</h2>
        <p className="text-muted-foreground mt-2">
          This car may have been removed.
        </p>
        <Button className="mt-6" onClick={() => setView('cars')}>
          Back to fleet
        </Button>
      </div>
    )
  }

  const features = car.features
    ? car.features.split(',').map((f) => f.trim()).filter(Boolean)
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      <button
        onClick={() => setView('cars')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to fleet
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[4/3] bg-muted/30"
        >
          <img
            src={car.image}
            alt={`${car.brand} ${car.name}`}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-background/80 backdrop-blur text-foreground border-white/10">
              {car.type}
            </Badge>
            {car.featured && (
              <Badge className="bg-primary/90 text-primary-foreground border-0">
                Featured
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col"
        >
          <p className="text-sm text-primary font-medium">{car.brand}</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            {car.name}
          </h1>

          <div className="flex items-center gap-3 mt-3">
            <Stars rating={car.rating} size={16} />
            <span className="text-sm text-muted-foreground">
              {car.rating.toFixed(1)} · {car.year}
            </span>
          </div>

          {/* specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <SpecCard icon={<Users className="h-5 w-5" />} label="Seats" value={`${car.seats}`} />
            <SpecCard
              icon={<Settings className="h-5 w-5" />}
              label="Transmission"
              value={car.transmission}
            />
            <SpecCard icon={<Fuel className="h-5 w-5" />} label="Fuel" value={car.fuel} />
            <SpecCard
              icon={<Calendar className="h-5 w-5" />}
              label="Year"
              value={`${car.year}`}
            />
          </div>

          {/* description */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              About this car
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {car.description}
            </p>
          </div>

          {/* features */}
          {features.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <span className="grid place-items-center h-5 w-5 rounded-full bg-primary/15 text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* booking CTA */}
          <div className="mt-8 rounded-xl border border-white/10 bg-card/60 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold">
                ${Math.round(car.pricePerDay)}
                <span className="text-base font-normal text-muted-foreground">
                  {' '}/ day
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {car.available ? 'Available now' : 'Currently unavailable'}
              </p>
            </div>
            <Button
              size="lg"
              disabled={!car.available}
              onClick={handleBook}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7"
            >
              {car.available ? (
                <>
                  Book now <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Unavailable'
              )}
            </Button>
          </div>
          {!isAuthenticated && car.available && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              You&apos;ll need to log in to complete your booking.
            </p>
          )}
        </motion.div>
      </div>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((c, i) => (
              <CarCard key={c.id} car={c} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SpecCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-card/40 p-3">
      <div className="text-primary mb-1.5">{icon}</div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

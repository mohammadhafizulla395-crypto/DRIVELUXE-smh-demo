'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/shared/section-heading'
import { CarCard } from '@/components/cars/car-card'
import { CarGridSkeleton } from '@/components/shared/skeletons'
import { useUIStore } from '@/store/ui-store'
import { carsApi } from '@/lib/api'
import type { Car } from '@/types'

export function FeaturedCars() {
  const { navigate } = useUIStore()
  const [cars, setCars] = useState<Car[]>([])
  const [loaded, setLoaded] = useState(false)
  const loading = !loaded

  useEffect(() => {
    let active = true
    carsApi
      .list({ featured: true, limit: 6 })
      .then((res) => {
        if (active) setCars(res.cars)
      })
      .catch(() => {
        if (active) setCars([])
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <SectionHeading
            align="left"
            eyebrow="Hand-picked"
            title="Featured this week"
            subtitle="Our most-booked vehicles, loved by members for their blend of style, comfort, and performance."
            className="mx-0"
          />
          <Button
            variant="ghost"
            onClick={() => navigate('cars')}
            className="self-start sm:self-auto text-primary hover:text-primary/90 hover:bg-primary/10"
          >
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <CarGridSkeleton count={6} />
        ) : cars.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No featured cars available right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

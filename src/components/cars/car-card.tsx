'use client'

import { motion } from 'framer-motion'
import { Users, Settings, Fuel, ArrowRight } from 'lucide-react'
import type { Car } from '@/types'
import { useUIStore } from '@/store/ui-store'
import { Stars } from '@/components/shared/stars'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CarCardProps {
  car: Car
  index?: number
  className?: string
}

export function CarCard({ car, index = 0, className }: CarCardProps) {
  const { setView } = useUIStore()

  const features = car.features
    ? car.features.split(',').map((f) => f.trim()).slice(0, 3)
    : []

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.4) }}
      whileHover={{ y: -4 }}
      onClick={() => setView('car-detail', { carId: car.id })}
      className={cn(
        'group text-left rounded-xl border border-white/10 bg-card/60 overflow-hidden',
        'hover:border-primary/40 hover:glow-gold transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-muted/30">
        <img
          src={car.image}
          alt={`${car.brand} ${car.name}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-background/80 backdrop-blur text-foreground border-white/10">
            {car.type}
          </Badge>
          {car.featured && (
            <Badge className="bg-primary/90 text-primary-foreground border-0">
              Featured
            </Badge>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-white/70">{car.brand}</p>
            <h3 className="text-lg font-semibold text-white leading-tight">
              {car.name}
            </h3>
          </div>
          <Stars rating={car.rating} size={12} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* specs */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <Spec icon={<Users className="h-3.5 w-3.5" />} label={`${car.seats} seats`} />
          <Spec icon={<Settings className="h-3.5 w-3.5" />} label={car.transmission} />
          <Spec icon={<Fuel className="h-3.5 w-3.5" />} label={car.fuel} />
        </div>

        {/* features */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {features.map((f) => (
              <span
                key={f}
                className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* price + cta */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xl font-bold text-foreground">
              ${Math.round(car.pricePerDay)}
            </span>
            <span className="text-xs text-muted-foreground"> / day</span>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
            View
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.button>
  )
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-primary/80">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  )
}

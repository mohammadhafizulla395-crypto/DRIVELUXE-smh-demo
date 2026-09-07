import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarsProps {
  rating: number
  size?: number
  className?: string
}

export function Stars({ rating, size = 14, className }: StarsProps) {
  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)))
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-muted-foreground/40" aria-hidden="true" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star size={size} className="text-amber-400 fill-amber-400" aria-hidden="true" />
            </span>
          </span>
        )
      })}
    </div>
  )
}

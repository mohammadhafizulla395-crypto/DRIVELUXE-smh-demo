'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { reviewsApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useUIStore } from '@/store/ui-store'
import { formatDate } from '@/lib/utils'
import type { Review } from '@/types'

export function MyReviewsView() {
  const { toast } = useToast()
  const { navigate } = useUIStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    reviewsApi
      .mine()
      .then((res) => {
        if (active) setReviews(res.reviews)
      })
      .catch((err) => {
        if (!active) return
        const e = err as ApiError
        toast({
          title: 'Could not load reviews',
          description: e.message,
          variant: 'destructive',
        })
        setReviews([])
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [toast])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      <div className="flex items-center gap-2 text-primary mb-2">
        <Star className="h-5 w-5" aria-hidden="true" />
        <span className="text-xs uppercase tracking-wide font-semibold">Reviews</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My reviews</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Reviews you&apos;ve written for cars you&apos;ve booked.
      </p>

      {!loaded ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-card/40 p-10 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
          <h3 className="font-semibold">No reviews yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            After booking a car, visit its detail page to share your experience.
          </p>
          <Button onClick={() => navigate('cars')}>Browse the fleet</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
              className="rounded-xl border border-white/10 bg-card/50 p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {r.car && (
                    <img
                      src={r.car.image}
                      alt={`${r.car.brand} ${r.car.name}`}
                      className="h-12 w-20 object-cover rounded"
                    />
                  )}
                  <div>
                    <button
                      onClick={() => r.car && navigate('car-detail', { carId: r.car.id })}
                      className="font-medium hover:text-primary transition-colors text-left"
                    >
                      {r.car?.brand} {r.car?.name}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={
                        r.rating >= n
                          ? 'h-4 w-4 text-amber-400 fill-amber-400'
                          : 'h-4 w-4 text-muted-foreground/40'
                      }
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
              {r.comment && (
                <p className="text-sm text-foreground/85 leading-relaxed">
                  &ldquo;{r.comment}&rdquo;
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

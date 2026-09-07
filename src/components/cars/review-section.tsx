'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeading } from '@/components/shared/section-heading'
import { reviewsApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import type { Review } from '@/types'
import { cn } from '@/lib/utils'

export function ReviewSection({
  carId,
  carName,
}: {
  carId: string
  carName: string
}) {
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  const load = useCallback(() => {
    setLoaded(false)
    reviewsApi
      .listByCar(carId)
      .then((res) => setReviews(res.reviews))
      .catch(() => setReviews([]))
      .finally(() => setLoaded(true))
  }, [carId])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast({
        title: 'Select a rating',
        description: 'Please choose 1 to 5 stars.',
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    try {
      const { review } = await reviewsApi.create({ carId, rating, comment })
      setReviews((prev) => [review, ...prev])
      setRating(0)
      setComment('')
      toast({ title: 'Review posted!', description: 'Thanks for your feedback.' })
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Could not post review',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0

  return (
    <section className="mt-16">
      <SectionHeading
        align="left"
        eyebrow="Customer feedback"
        title={`Reviews for the ${carName}`}
        subtitle={
          reviews.length > 0
            ? `${reviews.length} review${reviews.length === 1 ? '' : 's'} · ${avgRating.toFixed(1)} average`
            : 'Be the first to share your experience.'
        }
        className="mx-0 mb-8"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* review list */}
        <div>
          {!loaded ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl bg-white/5" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-card/40 p-10 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
              <p className="text-muted-foreground">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <motion.figure
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  className="rounded-xl border border-white/10 bg-card/50 p-5"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                          {(r.user?.name || 'A')
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{r.user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(r.createdAt)}
                        </p>
                      </div>
                    </div>
                    <RatingStars value={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                </motion.figure>
              ))}
            </div>
          )}
        </div>

        {/* review form (login-gated) */}
        <div className="lg:sticky lg:top-24 h-fit">
          {isAuthenticated ? (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-white/10 bg-card/60 p-6 space-y-4"
            >
              <h3 className="font-semibold">Write a review</h3>
              <p className="text-xs text-muted-foreground">
                You can review cars you have booked.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="rating" className="text-xs text-muted-foreground">
                  Your rating
                </Label>
                <div className="flex items-center gap-1" id="rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${n} star${n === 1 ? '' : 's'}`}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          'h-6 w-6 transition-colors',
                          (hoverRating || rating) >= n
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted-foreground/40',
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comment" className="text-xs text-muted-foreground">
                  Your review (optional)
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Share your experience with this car..."
                  className="bg-background/50 resize-none"
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {comment.length}/1000
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting || rating === 0}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post review
              </Button>
            </form>
          ) : (
            <div className="rounded-xl border border-white/10 bg-card/40 p-6 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Log in and book this car to leave a review.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'h-3.5 w-3.5',
            value >= n ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/40',
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

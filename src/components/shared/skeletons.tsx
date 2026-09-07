import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function CarCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-card/60 overflow-hidden',
        className,
      )}
    >
      <div className="shimmer aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3 bg-white/5" />
        <Skeleton className="h-3 w-1/2 bg-white/5" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
          <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20 bg-white/5" />
          <Skeleton className="h-8 w-24 rounded-md bg-white/5" />
        </div>
      </div>
    </div>
  )
}

export function CarGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="relative min-h-[80vh] flex items-center">
      <div className="shimmer absolute inset-0" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <Skeleton className="h-5 w-40 bg-white/10" />
        <Skeleton className="h-16 w-full max-w-2xl bg-white/10" />
        <Skeleton className="h-16 w-full max-w-xl bg-white/10" />
        <Skeleton className="h-6 w-full max-w-lg bg-white/10" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-12 w-40 rounded-md bg-white/10" />
          <Skeleton className="h-12 w-32 rounded-md bg-white/10" />
        </div>
      </div>
    </div>
  )
}

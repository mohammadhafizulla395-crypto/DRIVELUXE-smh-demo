import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/types'

const STATUS_STYLES: Record<BookingStatus, string> = {
  booked: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  pickup: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  in_use: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  returned: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  completed: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  cancelled: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

export function StatusBadge({
  status,
  className,
}: {
  status: BookingStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replace('_', ' ')}
    </span>
  )
}

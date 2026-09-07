import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  /** tailwind classes for the icon chip, e.g. "text-amber-300 bg-amber-500/10" */
  tint?: string
  className?: string
}

/** Shared stat/KPI card used by both the user and admin dashboards. */
export function StatCard({
  icon,
  label,
  value,
  tint = 'text-primary bg-primary/10',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('p-4 border-white/10 bg-card/50', className)}>
      <div className={cn('grid place-items-center h-10 w-10 rounded-lg mb-3', tint)}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Card>
  )
}

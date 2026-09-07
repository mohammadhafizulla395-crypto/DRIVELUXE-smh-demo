'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Sparkles, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/shared/stat-card'
import { pointsApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth-store'
import { formatDate } from '@/lib/utils'
import type { PointTransaction } from '@/types'

export function PointsView() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    pointsApi
      .mine()
      .then((res) => {
        if (active) setTransactions(res.transactions)
      })
      .catch((err) => {
        if (!active) return
        const e = err as ApiError
        toast({
          title: 'Could not load points',
          description: e.message,
          variant: 'destructive',
        })
        setTransactions([])
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [toast])

  const earned = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)
  const redeemed = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0),
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      <div className="flex items-center gap-2 text-primary mb-2">
        <Gift className="h-5 w-5" aria-hidden="true" />
        <span className="text-xs uppercase tracking-wide font-semibold">Rewards</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Your points</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Earn 1 point for every dollar spent on bookings. Points are reversed if
        a booking is cancelled.
      </p>

      {/* stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Current balance"
          value={loaded ? (user?.points ?? 0) : '—'}
          tint="text-primary bg-primary/10"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total earned"
          value={loaded ? earned : '—'}
          tint="text-emerald-300 bg-emerald-500/10"
        />
        <StatCard
          icon={<TrendingDown className="h-5 w-5" />}
          label="Total reversed"
          value={loaded ? redeemed : '—'}
          tint="text-rose-300 bg-rose-500/10"
        />
      </div>

      {/* history */}
      <h2 className="text-xl font-semibold mb-4">Points history</h2>
      {!loaded ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-card/40 p-10 text-center">
          <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
          <p className="text-muted-foreground">
            No points yet. Book a car to start earning!
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto scroll-dark">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th scope="col" className="text-left font-medium px-4 py-3">
                    Date
                  </th>
                  <th scope="col" className="text-left font-medium px-4 py-3">
                    Reason
                  </th>
                  <th scope="col" className="text-right font-medium px-4 py-3">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-white/5"
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3">{t.reason}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        t.amount > 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {t.amount > 0 ? '+' : ''}
                      {t.amount}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loaded && (
        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
          <Loader2 className="h-3 w-3" aria-hidden="true" />
          Points have no cash value and are non-transferable.
        </p>
      )}
    </div>
  )
}

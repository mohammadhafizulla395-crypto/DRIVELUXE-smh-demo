'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Star, Search, X, EyeOff, Eye } from 'lucide-react'
import { adminApi, ApiError, type AdminTableQuery } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  AdminPageHeader,
  AdminTableSkeleton,
  AdminPagination,
  AdminEmptyState,
} from '../admin-ui'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Review } from '@/types'

export function AdminReviews() {
  const { toast } = useToast()
  const [rows, setRows] = useState<Review[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [rating, setRating] = useState('all')
  const [sort, setSort] = useState('newest')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(1)
  const [modTarget, setModTarget] = useState<Review | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    setLoaded(false)
    const q: AdminTableQuery = {
      search: debounced || undefined,
      rating: rating !== 'all' ? Number(rating) : undefined,
      sort,
      page,
      limit: 10,
      archived,
    }
    adminApi.reviews
      .list(q)
      .then((res) => {
        setRows(res.reviews)
        setPagination(res.pagination)
      })
      .catch((err) => {
        const e = err as ApiError
        toast({ title: 'Load failed', description: e.message, variant: 'destructive' })
        setRows([])
      })
      .finally(() => setLoaded(true))
  }, [debounced, rating, sort, page, archived, toast])

  useEffect(() => {
    load()
  }, [load])

  const confirmMod = async () => {
    if (!modTarget) return
    setBusy(true)
    try {
      await adminApi.reviews.archive(modTarget.id, !modTarget.archived)
      toast({ title: modTarget.archived ? 'Review restored' : 'Review hidden' })
      setModTarget(null)
      load()
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Action failed', description: e.message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const avgRating = rows.length
    ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1)
    : '—'

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        description="Moderate customer reviews. Hide inappropriate content; restore when needed."
        actions={
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Avg rating (page)</p>
            <p className="text-lg font-bold text-amber-300 flex items-center gap-1 justify-end">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {avgRating}
            </p>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by comment, customer, or car…"
            className="pl-9 bg-card/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={rating} onValueChange={(v) => { setRating(v); setPage(1) }}>
          <SelectTrigger className="w-[130px] bg-card/40"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            <SelectItem value="5">5 stars</SelectItem>
            <SelectItem value="4">4 stars</SelectItem>
            <SelectItem value="3">3 stars</SelectItem>
            <SelectItem value="2">2 stars</SelectItem>
            <SelectItem value="1">1 star</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
          <SelectTrigger className="w-[150px] bg-card/40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="rating">Highest rated</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={archived ? 'default' : 'outline'} onClick={() => { setArchived(!archived); setPage(1) }} className={archived ? 'bg-primary text-primary-foreground' : ''}>
          {archived ? 'Showing hidden' : 'Show hidden'}
        </Button>
      </div>

      {!loaded ? (
        <AdminTableSkeleton cols={4} rows={6} />
      ) : rows.length === 0 ? (
        <AdminEmptyState title="No reviews found" description="Reviews appear here once customers submit them." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className={`border-white/10 bg-card/40 p-4 ${r.archived ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <img
                  src={r.car?.image}
                  alt={r.car?.name}
                  className="h-12 w-16 object-cover rounded shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}
                        />
                      ))}
                    </div>
                    <Badge variant="outline" className="border-white/10">{r.car?.brand} {r.car?.name}</Badge>
                    {r.archived && <Badge variant="outline" className="border-rose-500/30 text-rose-300">Hidden</Badge>}
                  </div>
                  <p className="text-sm text-foreground/90 mt-2">{r.comment || <span className="text-muted-foreground italic">No comment</span>}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.user?.name ?? 'Unknown'} · {format(new Date(r.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setModTarget(r)}
                  aria-label={r.archived ? 'Restore review' : 'Hide review'}
                >
                  {r.archived ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} onPage={setPage} />

      <AlertDialog open={!!modTarget} onOpenChange={(o) => !o && setModTarget(null)}>
        <AlertDialogContent className="bg-background border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>{modTarget?.archived ? 'Restore this review?' : 'Hide this review?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {modTarget?.archived
                ? 'The review will become visible to customers again.'
                : 'The review will be hidden from the public car detail page. It can be restored later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMod} disabled={busy} className={modTarget?.archived ? 'bg-primary text-primary-foreground' : 'bg-rose-600 hover:bg-rose-700 text-white'}>
              {busy ? 'Working…' : modTarget?.archived ? 'Restore' : 'Hide'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

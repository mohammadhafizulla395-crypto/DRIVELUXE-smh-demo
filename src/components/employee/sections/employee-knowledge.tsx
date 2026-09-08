'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { BookOpen, Tag, Clock, Search, X } from 'lucide-react'
import { employeeApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn, parseFeatures } from '@/lib/utils'
import type { KnowledgeBaseArticle } from '@/types'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AdminPageHeader,
  AdminEmptyState,
} from '@/components/admin/admin-ui'

const CATEGORIES = [
  { value: 'all', label: 'All categories' },
  { value: 'booking', label: 'Booking' },
  { value: 'refund', label: 'Refund' },
  { value: 'payment', label: 'Payment' },
  { value: 'general', label: 'General' },
  { value: 'fleet', label: 'Fleet' },
] as const

const CATEGORY_BADGE: Record<string, string> = {
  booking: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  refund: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
  payment: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  general: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300',
  fleet: 'border-violet-500/30 bg-violet-500/15 text-violet-300',
}

export function EmployeeKnowledge() {
  const { toast } = useToast()
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([])
  const [loaded, setLoaded] = useState(false)
  const [category, setCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let active = true
    employeeApi
      .knowledgeBase(category === 'all' ? undefined : category)
      .then((res) => {
        if (!active) return
        setArticles(res.articles)
      })
      .catch((err) => {
        const e = err as ApiError
        if (!active) return
        toast({
          title: 'Could not load knowledge base',
          description: e.message,
          variant: 'destructive',
        })
        setArticles([])
      })
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [category, toast])

  // Client-side content search across fetched articles (the API only filters by category).
  const filtered = debounced
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(debounced.toLowerCase()) ||
          a.content.toLowerCase().includes(debounced.toLowerCase()) ||
          a.tags.toLowerCase().includes(debounced.toLowerCase()),
      )
    : articles

  return (
    <div>
      <AdminPageHeader
        title="Knowledge Base"
        description="Reference articles to help you answer customer questions accurately."
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles, tags, content…"
            className="pl-9 bg-card/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px] bg-card/40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!loaded ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          title="No articles found"
          description={
            debounced
              ? 'Try a different search term or category.'
              : 'No knowledge base articles in this category yet.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => {
            const tags = parseFeatures(a.tags)
            return (
              <Card
                key={a.id}
                className="border-white/10 bg-card/40 p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid place-items-center h-8 w-8 rounded-lg bg-teal-500/10 ring-1 ring-teal-500/20 text-teal-300 shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <h3 className="font-semibold leading-tight">
                      {a.title}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'capitalize shrink-0',
                      CATEGORY_BADGE[a.category] ??
                        'border-white/10 bg-white/5 text-muted-foreground',
                    )}
                  >
                    {a.category}
                  </Badge>
                </div>

                <p className="text-sm text-foreground/80 whitespace-pre-line flex-1">
                  {a.content}
                </p>

                {tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-white/5">
                    <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-3">
                  <Clock className="h-3 w-3" />
                  Updated {format(new Date(a.updatedAt), 'MMM d, yyyy')}
                </p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

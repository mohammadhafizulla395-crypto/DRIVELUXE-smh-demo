'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Send, LifeBuoy, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supportApi, ApiError } from '@/lib/api'
import { supportCategories } from '@/lib/validations'
import { formatDate } from '@/lib/utils'
import type { SupportTicket, TicketStatus } from '@/types'

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  in_progress: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  closed: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
}

export function SupportView() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<string>('general')
  const [message, setMessage] = useState('')

  const load = useCallback(() => {
    setLoaded(false)
    supportApi
      .list()
      .then((res) => setTickets(res.tickets))
      .catch(() => setTickets([]))
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { ticket } = await supportApi.create({ subject, category, message })
      setTickets((prev) => [ticket, ...prev])
      setSubject('')
      setCategory('general')
      setMessage('')
      toast({
        title: 'Support request submitted',
        description: 'Our team will get back to you within 2 business days.',
      })
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Could not submit',
        description: e.fields ? Object.values(e.fields)[0] : e.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      <div className="flex items-center gap-2 text-primary mb-2">
        <LifeBuoy className="h-5 w-5" aria-hidden="true" />
        <span className="text-xs uppercase tracking-wide font-semibold">Support</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
        Help &amp; Support
      </h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Have a problem with a booking, payment, or refund? Submit a request and
        our team will help.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* ticket history */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your requests</h2>
          {!loaded ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-card/40 p-10 text-center">
              <MessageSquarePlus className="h-8 w-8 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
              <p className="text-muted-foreground">
                No support requests yet. Submit one using the form.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  className="rounded-xl border border-white/10 bg-card/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {t.category} · {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[t.status]}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-3">
                    {t.message}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* submission form */}
        <div className="lg:sticky lg:top-24 h-fit">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-white/10 bg-card/60 p-6 space-y-4"
          >
            <h2 className="font-semibold">Submit a request</h2>

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs text-muted-foreground">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the issue"
                required
                minLength={5}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs text-muted-foreground">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportCategories.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs text-muted-foreground">
                Describe the issue
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                minLength={10}
                maxLength={2000}
                placeholder="Please describe what happened, including your booking reference if relevant..."
                className="bg-background/50 resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {message.length}/2000
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit request
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

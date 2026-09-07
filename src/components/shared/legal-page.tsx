'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui-store'

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated?: string
  children: React.ReactNode
}) {
  const { navigate } = useUIStore()
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      <button
        onClick={() => navigate('home')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 text-primary mb-3">
          <FileText className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs uppercase tracking-wide font-semibold">Legal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        {updated && (
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {updated}
          </p>
        )}

        <div className="prose prose-invert max-w-none mt-8 space-y-6 text-sm sm:text-base text-foreground/85 leading-relaxed">
          {children}
        </div>
      </motion.div>

      <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('privacy')}>
          Privacy
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('terms')}>
          Terms
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('cookies')}>
          Cookies
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('refund')}>
          Refund Policy
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('support')}>
          Help &amp; Support
        </Button>
      </div>
    </div>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  )
}

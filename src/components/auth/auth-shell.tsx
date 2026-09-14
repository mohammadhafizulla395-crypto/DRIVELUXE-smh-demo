'use client'

import { motion } from 'framer-motion'
import { Car } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
              <Car className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
          </div>
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </motion.div>
    </div>
  )
}

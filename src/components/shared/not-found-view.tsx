'use client'

import { motion } from 'framer-motion'
import { Compass, Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui-store'

export function NotFoundView() {
  const { navigate } = useUIStore()
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        <div className="grid place-items-center h-20 w-20 rounded-2xl bg-primary/10 text-primary mx-auto mb-6">
          <Compass className="h-10 w-10" aria-hidden="true" />
        </div>
        <p className="text-7xl font-bold text-gradient-gold mb-2">404</p>
        <h1 className="text-2xl font-bold mb-3">This road doesn&apos;t exist</h1>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for may have been moved, deleted, or never
          existed. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => navigate('home')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Home className="mr-2 h-4 w-4" /> Go home
          </Button>
          <Button variant="outline" onClick={() => navigate('cars')}>
            <Search className="mr-2 h-4 w-4" /> Browse the fleet
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

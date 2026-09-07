'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, ShieldCheck, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui-store'
import { HeroSkeleton } from '@/components/shared/skeletons'

export function Hero() {
  const { setView } = useUIStore()
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.src = '/hero-car.png'
    img.onload = () => setImgLoaded(true)
    img.onerror = () => setImgLoaded(true)
  }, [])

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        {!imgLoaded && <HeroSkeleton />}
        <motion.img
          src="/hero-car.png"
          alt="Luxury car in a dramatic showroom"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={imgLoaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* dark overlays for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
        <div className="absolute inset-0 hero-vignette" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Premium cars, zero hassle
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]"
          >
            Drive the
            <br className="hidden sm:block" />{' '}
            <span className="text-gradient-gold">extraordinary</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground max-w-lg"
          >
            From roaring supercars to silent electric flagships — hand-pick your
            ride, pick your dates, and we&apos;ll have the keys waiting.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button
              size="lg"
              onClick={() => setView('cars')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7"
            >
              Browse the fleet
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setView('register')}
              className="h-12 px-7 border-white/15 bg-white/5 backdrop-blur hover:bg-white/10"
            >
              Create account
            </Button>
          </motion.div>

          {/* trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
          >
            <Trust icon={<ShieldCheck className="h-4 w-4 text-primary" />} label="Fully insured" />
            <Trust icon={<Clock className="h-4 w-4 text-primary" />} label="24/7 support" />
            <Trust icon={<Sparkles className="h-4 w-4 text-primary" />} label="No hidden fees" />
          </motion.div>
        </div>
      </div>

      {/* scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 text-muted-foreground"
      >
        <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
        <span className="h-8 w-px bg-gradient-to-b from-primary/60 to-transparent" />
      </motion.div>
    </section>
  )
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      {label}
    </div>
  )
}

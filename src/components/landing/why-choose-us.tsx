'use client'

import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Zap,
  Wallet,
  Headphones,
  MapPin,
  Award,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/section-heading'

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Fully insured',
    desc: 'Every rental includes comprehensive insurance. Drive with total peace of mind, on us.',
  },
  {
    icon: Zap,
    title: 'Instant booking',
    desc: 'Pick your car, pick your dates, confirm. No calls, no counters, no waiting.',
  },
  {
    icon: Wallet,
    title: 'Transparent pricing',
    desc: 'The price you see is the price you pay. No surprise fees at pickup, ever.',
  },
  {
    icon: Headphones,
    title: '24/7 concierge',
    desc: 'Real humans on call around the clock — for anything, anywhere.',
  },
  {
    icon: MapPin,
    title: 'Flexible pickup',
    desc: 'Collect from our downtown office or have the car delivered to your door.',
  },
  {
    icon: Award,
    title: 'Curated fleet',
    desc: 'Every car is hand-selected, meticulously maintained, and detailed before each rental.',
  },
]

export function WhyChooseUs() {
  return (
    <section className="py-16 sm:py-24 bg-muted/20 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why DriveLuxe"
          title="Built for drivers who expect more"
          subtitle="We obsess over the details so your only job is to enjoy the drive."
        />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.07, 0.5) }}
              className="group rounded-xl border border-white/10 bg-card/50 p-6 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
            >
              <div className="grid place-items-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

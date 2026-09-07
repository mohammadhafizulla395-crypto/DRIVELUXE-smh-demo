'use client'

import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Stars } from '@/components/shared/stars'
import { SectionHeading } from '@/components/shared/section-heading'

const REVIEWS = [
  {
    name: 'Sophia Bennett',
    role: 'Marketing Director',
    initials: 'SB',
    rating: 5,
    text: 'Booked a Porsche 911 for a weekend escape and the whole thing took under two minutes. The car was immaculate and pickup was effortless. This is how rentals should work.',
  },
  {
    name: 'Marcus Lee',
    role: 'Software Engineer',
    initials: 'ML',
    rating: 5,
    text: 'The Tesla Model S Plaid was absurd. Instant booking, transparent pricing, and the concierge actually picked up at midnight when I had a question. Sold for life.',
  },
  {
    name: 'Amara Okafor',
    role: 'Travel Blogger',
    initials: 'AO',
    rating: 4.5,
    text: 'I rent cars constantly for trips and DriveLuxe is now my default. The fleet is genuinely premium, not just “premium-ish”. The Range Rover was a dream through the mountains.',
  },
]

export function Reviews() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Loved by members"
          title="What our drivers say"
          subtitle="Thousands of rides booked. Here's what a few of them came back to say."
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((r, i) => (
            <motion.figure
              key={r.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="relative rounded-xl border border-white/10 bg-card/50 p-6 flex flex-col"
            >
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              <blockquote className="text-sm text-foreground/90 leading-relaxed flex-1">
                &ldquo;{r.text}&rdquo;
              </blockquote>
              <Stars rating={r.rating} className="mt-5" />
              <figcaption className="mt-4 flex items-center gap-3 pt-4 border-t border-white/10">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                    {r.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

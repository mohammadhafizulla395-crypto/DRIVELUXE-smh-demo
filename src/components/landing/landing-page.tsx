'use client'

import { Hero } from './hero'
import { FeaturedCars } from './featured-cars'
import { WhyChooseUs } from './why-choose-us'
import { Reviews } from './reviews'

export function LandingPage() {
  return (
    <>
      <Hero />
      <FeaturedCars />
      <WhyChooseUs />
      <Reviews />
    </>
  )
}

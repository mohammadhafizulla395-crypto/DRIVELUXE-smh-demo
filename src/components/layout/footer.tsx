'use client'

import { Car, Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
                <Car className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold">
                Drive<span className="text-gradient-gold">Luxe</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Premium car rental for drivers who expect more. A curated fleet,
              transparent pricing, and a booking experience as smooth as the
              ride.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <span
                  key={i}
                  className="grid place-items-center h-9 w-9 rounded-full border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors cursor-pointer"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="hover:text-foreground transition-colors cursor-pointer">About us</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Our fleet</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Careers</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Press</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary" /> +1 (555) 010-2024
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" /> hello@driveluxe.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" /> 500 Park Avenue, NYC
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} DriveLuxe. A portfolio project.</p>
          <div className="flex items-center gap-5">
            <span className="hover:text-foreground transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

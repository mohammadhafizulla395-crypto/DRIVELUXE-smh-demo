'use client'

import { Car, Mail, Phone, MapPin, Instagram, Twitter, Facebook, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore, type ViewName } from '@/store/ui-store'

export function Footer() {
  const { isAuthenticated } = useAuthStore()
  const { navigate } = useUIStore()

  const go = (v: ViewName) => navigate(v)

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
                  className="grid place-items-center h-9 w-9 rounded-full border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {/* Company — only meaningful links are wired */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <button
                  onClick={() => go('home')}
                  className="hover:text-foreground transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => go('cars')}
                  className="hover:text-foreground transition-colors"
                >
                  Our fleet
                </button>
              </li>
              {isAuthenticated && (
                <li>
                  <button
                    onClick={() => go('bookings')}
                    className="hover:text-foreground transition-colors"
                  >
                    My bookings
                  </button>
                </li>
              )}
              {isAuthenticated && (
                <li>
                  <button
                    onClick={() => go('points')}
                    className="hover:text-foreground transition-colors"
                  >
                    Rewards points
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Legal — login-gated per project requirements */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Account & Legal</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {isAuthenticated ? (
                <>
                  <li>
                    <button
                      onClick={() => go('refund')}
                      className="hover:text-foreground transition-colors"
                    >
                      Refund policy
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => go('privacy')}
                      className="hover:text-foreground transition-colors"
                    >
                      Privacy
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => go('terms')}
                      className="hover:text-foreground transition-colors"
                    >
                      Terms
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => go('cookies')}
                      className="hover:text-foreground transition-colors"
                    >
                      Cookies
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => go('support')}
                      className="hover:text-foreground transition-colors"
                    >
                      Help &amp; support
                    </button>
                  </li>
                </>
              ) : (
                <li className="text-xs text-muted-foreground/70">
                  Sign in to access your account, refunds, and support.
                </li>
              )}
              <li>
                <button
                  onClick={() => go('admin-login')}
                  className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors mt-1"
                  aria-label="Admin portal"
                >
                  <Shield className="h-3.5 w-3.5" /> Admin portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} DriveLuxe. A portfolio project.</p>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-primary" /> +1 (555) 010-2024
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-primary" /> hello@driveluxe.com
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-primary" /> 500 Park Avenue, NYC
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

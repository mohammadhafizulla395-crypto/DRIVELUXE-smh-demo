'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { LandingPage } from '@/components/landing/landing-page'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { ProfileForm } from '@/components/auth/profile-form'
import { CatalogView } from '@/components/cars/catalog-view'
import { CarDetailView } from '@/components/cars/car-detail-view'
import { BookingView } from '@/components/booking/booking-view'
import { UserDashboard } from '@/components/dashboard/user-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { AdminLoginForm } from '@/components/admin/admin-login-form'
import { AdminNavbar } from '@/components/admin/admin-navbar'
import {
  PrivacyView,
  TermsView,
  CookiesView,
  RefundView,
} from '@/components/shared/legal-pages'
import { NotFoundView } from '@/components/shared/not-found-view'
import { SupportView } from '@/components/dashboard/support-view'
import { PointsView } from '@/components/dashboard/points-view'
import { MyReviewsView } from '@/components/dashboard/my-reviews-view'
import { useUIStore, initHashRouter } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'

export default function Home() {
  const { view, selectedCarId, navigate, syncFromHash } = useUIStore()
  const { loading, hydrated, isAuthenticated, isAdmin, fetchUser } =
    useAuthStore()

  // Restore session once on mount + init hash router
  useEffect(() => {
    if (!hydrated) fetchUser()
    initHashRouter()
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', syncFromHash)
      }
    }
  }, [])

  // Auth guards: redirect protected views to login
  useEffect(() => {
    const protectedViews = [
      'profile',
      'bookings',
      'booking',
      'admin',
      'my-reviews',
      'points',
      'refund',
      'support',
      'privacy',
      'terms',
      'cookies',
    ]
    if (
      protectedViews.includes(view) &&
      hydrated &&
      !isAuthenticated
    ) {
      navigate('login')
    }
    // Admin portal guard
    if (view === 'admin' && hydrated && (!isAuthenticated || !isAdmin)) {
      navigate('admin-login')
    }
  }, [view, hydrated, isAuthenticated, isAdmin, navigate])

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [view, selectedCarId])

  // Initial session bootstrap
  if (loading && !hydrated) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading DriveLuxe...</p>
        </div>
      </div>
    )
  }

  // ---------- Separated Admin Portal ----------
  // The admin portal has its own layout, navbar, and login — fully separate
  // from the main site (no main navbar/footer).
  if (view === 'admin-login') {
    return <AdminLoginForm />
  }

  if (view === 'admin') {
    if (!isAuthenticated || !isAdmin) {
      return <AdminLoginForm />
    }
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AdminNavbar />
        <main className="flex-1">
          <AdminDashboard />
        </main>
      </div>
    )
  }

  // ---------- Main Site ----------
  const isAuthView = view === 'login' || view === 'register'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view + (selectedCarId ?? '')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'home' && <LandingPage />}
            {view === 'cars' && <CatalogView />}
            {view === 'car-detail' && selectedCarId && (
              <CarDetailView carId={selectedCarId} />
            )}
            {view === 'booking' && selectedCarId && (
              <BookingView carId={selectedCarId} />
            )}
            {view === 'login' && <LoginForm />}
            {view === 'register' && <RegisterForm />}
            {view === 'profile' && isAuthenticated && <ProfileWrapper />}
            {view === 'bookings' && isAuthenticated && <UserDashboard />}
            {view === 'my-reviews' && isAuthenticated && <MyReviewsView />}
            {view === 'points' && isAuthenticated && <PointsView />}
            {view === 'refund' && isAuthenticated && <RefundView />}
            {view === 'support' && isAuthenticated && <SupportView />}
            {view === 'privacy' && isAuthenticated && <PrivacyView />}
            {view === 'terms' && isAuthenticated && <TermsView />}
            {view === 'cookies' && isAuthenticated && <CookiesView />}
            {view === 'not-found' && <NotFoundView />}
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAuthView && <Footer />}
    </div>
  )
}

// Standalone profile view (reuses the profile form)
function ProfileWrapper() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Your profile</h1>
      <p className="text-muted-foreground mb-8">
        Update your personal information.
      </p>
      <div className="rounded-xl border border-white/10 bg-card/50 p-6">
        <ProfileForm />
      </div>
    </div>
  )
}

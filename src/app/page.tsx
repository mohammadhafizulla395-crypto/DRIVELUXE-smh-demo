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
import { AdminLoginForm } from '@/components/admin/admin-login-form'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminForbidden } from '@/components/admin/admin-forbidden'
import { AdminDashboard } from '@/components/admin/sections/admin-dashboard'
import { AdminCars } from '@/components/admin/sections/admin-cars'
import { AdminBookings } from '@/components/admin/sections/admin-bookings'
import { AdminCustomers } from '@/components/admin/sections/admin-customers'
import { AdminPayments } from '@/components/admin/sections/admin-payments'
import { AdminComplaints } from '@/components/admin/sections/admin-complaints'
import { AdminReviews } from '@/components/admin/sections/admin-reviews'
import { AdminSettings } from '@/components/admin/sections/admin-settings'
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

  // Auth guards: redirect protected views to login (main-site only;
  // admin views are guarded in the admin block below).
  useEffect(() => {
    const protectedViews = [
      'profile',
      'bookings',
      'booking',
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
  }, [view, hydrated, isAuthenticated, navigate])

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

  // ---------- Separated Admin Console ----------
  // Fully separate from the main site: own login, own layout (sidebar + topbar),
  // own session checks. Normal users get a 403; guests redirect to admin login.
  const adminViews = [
    'admin',
    'admin-cars',
    'admin-bookings',
    'admin-customers',
    'admin-payments',
    'admin-complaints',
    'admin-reviews',
    'admin-settings',
  ]

  if (view === 'admin-login') {
    // Already-authed admin going to /admin/login → skip to dashboard
    if (isAuthenticated && isAdmin) {
      navigate('admin')
      return null
    }
    return <AdminLoginForm />
  }

  if (view === 'admin-forbidden') {
    return <AdminForbidden />
  }

  if (adminViews.includes(view)) {
    if (!hydrated) {
      return (
        <div className="min-h-screen grid place-items-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }
    // Guest → redirect to admin login
    if (!isAuthenticated) {
      navigate('admin-login')
      return null
    }
    // Authenticated but NOT admin → 403
    if (!isAdmin) {
      return <AdminForbidden />
    }
    return (
      <AdminLayout>
        {view === 'admin' && <AdminDashboard />}
        {view === 'admin-cars' && <AdminCars />}
        {view === 'admin-bookings' && <AdminBookings />}
        {view === 'admin-customers' && <AdminCustomers />}
        {view === 'admin-payments' && <AdminPayments />}
        {view === 'admin-complaints' && <AdminComplaints />}
        {view === 'admin-reviews' && <AdminReviews />}
        {view === 'admin-settings' && <AdminSettings />}
      </AdminLayout>
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

'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { view, selectedCarId, setView } = useUIStore()
  const { loading, hydrated, isAuthenticated, isAdmin, fetchUser } =
    useAuthStore()

  // Restore session once on mount
  useEffect(() => {
    if (!hydrated) fetchUser()
  }, [fetchUser, hydrated])

  // Auth guards: redirect protected views to login
  useEffect(() => {
    const protectedViews = ['profile', 'bookings', 'booking', 'admin']
    if (
      protectedViews.includes(view) &&
      hydrated &&
      !isAuthenticated
    ) {
      setView('login')
    }
    if (view === 'admin' && hydrated && isAuthenticated && !isAdmin) {
      setView('home')
    }
  }, [view, hydrated, isAuthenticated, isAdmin, setView])

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [view])

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
            {view === 'admin' && isAdmin && <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>
      {view !== 'login' && view !== 'register' && <Footer />}
    </div>
  )
}

// Standalone profile view
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

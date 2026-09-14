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
// Admin portal
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
import { AdminEmployees } from '@/components/admin/sections/admin-employees'
import { AdminReports } from '@/components/admin/sections/admin-reports'
import { AdminSettings } from '@/components/admin/sections/admin-settings'
// Employee portal
import { EmployeeLoginForm } from '@/components/employee/employee-login-form'
import { EmployeeLayout } from '@/components/employee/employee-layout'
import { EmployeeDashboard } from '@/components/employee/sections/employee-dashboard'
import { EmployeeTasks } from '@/components/employee/sections/employee-tasks'
import { EmployeeBookings } from '@/components/employee/sections/employee-bookings'
import { EmployeeTickets } from '@/components/employee/sections/employee-tickets'
import { EmployeeCalls } from '@/components/employee/sections/employee-calls'
import { EmployeeKnowledge } from '@/components/employee/sections/employee-knowledge'
import { EmployeePerformance } from '@/components/employee/sections/employee-performance'
import { EmployeeAttendance } from '@/components/employee/sections/employee-attendance'
// Shared
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
import { CustomerDashboardLayout } from '@/components/dashboard/customer-dashboard-layout'
import { CustomerDashboard } from '@/components/dashboard/sections/customer-dashboard'
import { BookingTimeline } from '@/components/dashboard/sections/booking-timeline'
import { PaymentHistory } from '@/components/dashboard/sections/payment-history'
import { CustomerNotifications } from '@/components/dashboard/sections/customer-notifications'
import { useUIStore, initHashRouter } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { useEmployeeStore } from '@/store/employee-store'

export default function Home() {
  const { view, selectedCarId, navigate, syncFromHash } = useUIStore()
  const { loading, hydrated, isAuthenticated, isAdmin, fetchUser } =
    useAuthStore()
  const {
    loading: empLoading,
    hydrated: empHydrated,
    isAuthenticated: empAuthed,
    fetchEmployee,
  } = useEmployeeStore()

  // Restore sessions once on mount + init hash router
  useEffect(() => {
    if (!hydrated) fetchUser()
    if (!empHydrated) fetchEmployee()
    initHashRouter()
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', syncFromHash)
      }
    }
  }, [])

  // Customer auth guard (main-site + dashboard protected views)
  useEffect(() => {
    const protectedViews = [
      'dashboard',
      'profile',
      'bookings',
      'booking',
      'booking-timeline',
      'my-reviews',
      'points',
      'payment-history',
      'support',
      'notifications',
      'refund',
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
  if ((loading && !hydrated) || (empLoading && !empHydrated && view.startsWith('employee'))) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading DriveLuxe...</p>
        </div>
      </div>
    )
  }

  // ===================== EMPLOYEE PORTAL (separated) =====================
  const employeeViews = [
    'employee',
    'employee-tasks',
    'employee-bookings',
    'employee-tickets',
    'employee-calls',
    'employee-knowledge',
    'employee-performance',
    'employee-attendance',
  ]

  if (view === 'employee-login') {
    if (empAuthed) {
      navigate('employee')
      return null
    }
    return <EmployeeLoginForm />
  }

  if (view === 'employee-forbidden') {
    return <AdminForbidden /> // reuse the 403 page
  }

  if (employeeViews.includes(view)) {
    if (!empHydrated) {
      return (
        <div className="min-h-screen grid place-items-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        </div>
      )
    }
    if (!empAuthed) {
      navigate('employee-login')
      return null
    }
    return (
      <EmployeeLayout>
        {view === 'employee' && <EmployeeDashboard />}
        {view === 'employee-tasks' && <EmployeeTasks />}
        {view === 'employee-bookings' && <EmployeeBookings />}
        {view === 'employee-tickets' && <EmployeeTickets />}
        {view === 'employee-calls' && <EmployeeCalls />}
        {view === 'employee-knowledge' && <EmployeeKnowledge />}
        {view === 'employee-performance' && <EmployeePerformance />}
        {view === 'employee-attendance' && <EmployeeAttendance />}
      </EmployeeLayout>
    )
  }

  // ===================== ADMIN CONSOLE (separated) =====================
  const adminViews = [
    'admin',
    'admin-operations',
    'admin-cars',
    'admin-bookings',
    'admin-customers',
    'admin-payments',
    'admin-complaints',
    'admin-reviews',
    'admin-employees',
    'admin-reports',
    'admin-maintenance',
    'admin-settings',
  ]

  if (view === 'admin-login') {
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
    if (!isAuthenticated) {
      navigate('admin-login')
      return null
    }
    if (!isAdmin) {
      return <AdminForbidden />
    }
    return (
      <AdminLayout>
        {view === 'admin' && <AdminDashboard />}
        {view === 'admin-operations' && <AdminDashboard />} {/* Operations = dashboard for now */}
        {view === 'admin-cars' && <AdminCars />}
        {view === 'admin-bookings' && <AdminBookings />}
        {view === 'admin-customers' && <AdminCustomers />}
        {view === 'admin-payments' && <AdminPayments />}
        {view === 'admin-complaints' && <AdminComplaints />}
        {view === 'admin-reviews' && <AdminReviews />}
        {view === 'admin-employees' && <AdminEmployees />}
        {view === 'admin-reports' && <AdminReports />}
        {view === 'admin-maintenance' && <AdminCars />} {/* Maintenance reuses fleet view for now */}
        {view === 'admin-settings' && <AdminSettings />}
      </AdminLayout>
    )
  }

  // ===================== CUSTOMER DASHBOARD (control center) =====================
  const dashboardViews = [
    'dashboard',
    'bookings',
    'booking-timeline',
    'my-reviews',
    'points',
    'payment-history',
    'support',
    'notifications',
    'profile',
    'refund',
    'privacy',
    'terms',
    'cookies',
  ]

  if (dashboardViews.includes(view)) {
    if (!hydrated) {
      return (
        <div className="min-h-screen grid place-items-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }
    if (!isAuthenticated) {
      navigate('login')
      return null
    }
    return (
      <CustomerDashboardLayout>
        {view === 'dashboard' && <CustomerDashboard />}
        {view === 'bookings' && <UserDashboard />}
        {view === 'booking-timeline' && <BookingTimeline />}
        {view === 'my-reviews' && <MyReviewsView />}
        {view === 'points' && <PointsView />}
        {view === 'payment-history' && <PaymentHistory />}
        {view === 'support' && <SupportView />}
        {view === 'notifications' && <CustomerNotifications />}
        {view === 'profile' && <ProfileWrapper />}
        {view === 'refund' && <RefundView />}
        {view === 'privacy' && <PrivacyView />}
        {view === 'terms' && <TermsView />}
        {view === 'cookies' && <CookiesView />}
      </CustomerDashboardLayout>
    )
  }

  // ===================== CUSTOMER SITE (main) =====================
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
            {view === 'not-found' && <NotFoundView />}
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAuthView && <Footer />}
    </div>
  )
}

// Standalone profile view (inside dashboard layout)
function ProfileWrapper() {
  return (
    <div className="max-w-2xl mx-auto">
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

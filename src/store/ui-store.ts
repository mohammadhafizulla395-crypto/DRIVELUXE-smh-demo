import { create } from 'zustand'

/**
 * Hash-based view router.
 *
 * The deployable surface is a single `/` route, so "pages" are views managed
 * by this store and reflected in the URL hash (e.g. `#/fleet`, `#/car/<id>`,
 * `#/admin/login`). This gives shareable URLs + working back/forward buttons
 * while staying within the single-route constraint.
 *
 * The admin portal lives at `#/admin/login` and `#/admin` — fully separated
 * from the main site (different layout, different navbar, different login).
 */

export type AdminSection =
  | 'dashboard'
  | 'operations'
  | 'cars'
  | 'bookings'
  | 'customers'
  | 'payments'
  | 'complaints'
  | 'reviews'
  | 'employees'
  | 'reports'
  | 'maintenance'
  | 'settings'

export type EmployeeSection =
  | 'dashboard'
  | 'tasks'
  | 'bookings'
  | 'tickets'
  | 'calls'
  | 'knowledge'
  | 'performance'
  | 'attendance'

export type ViewName =
  // main site (customer)
  | 'home'
  | 'cars'
  | 'car-detail'
  | 'booking'
  | 'login'
  | 'register'
  // customer dashboard (control center)
  | 'dashboard'
  | 'profile'
  | 'bookings'
  | 'booking-timeline'
  | 'my-reviews'
  | 'points'
  | 'payment-history'
  | 'support'
  | 'notifications'
  | 'refund'
  | 'privacy'
  | 'terms'
  | 'cookies'
  // employee portal (separated)
  | 'employee-login'
  | 'employee' // = employee dashboard
  | 'employee-tasks'
  | 'employee-bookings'
  | 'employee-tickets'
  | 'employee-calls'
  | 'employee-knowledge'
  | 'employee-performance'
  | 'employee-attendance'
  | 'employee-forbidden'
  // admin portal (separated)
  | 'admin-login'
  | 'admin' // = admin dashboard
  | 'admin-operations'
  | 'admin-cars'
  | 'admin-bookings'
  | 'admin-customers'
  | 'admin-payments'
  | 'admin-complaints'
  | 'admin-reviews'
  | 'admin-employees'
  | 'admin-reports'
  | 'admin-maintenance'
  | 'admin-settings'
  | 'admin-forbidden'
  // errors
  | 'not-found'

interface UIState {
  view: ViewName
  selectedCarId: string | null
  /** Navigate to a view (updates the hash). */
  navigate: (view: ViewName, opts?: { carId?: string }) => void
  /** Sync store from the current URL hash (called on hashchange). */
  syncFromHash: () => void
}

/** Map a view + optional param to a URL hash. */
function viewToHash(view: ViewName, carId?: string | null): string {
  switch (view) {
    case 'home':
      return '#/'
    case 'cars':
      return '#/fleet'
    case 'car-detail':
      return carId ? `#/car/${carId}` : '#/fleet'
    case 'booking':
      return carId ? `#/booking/${carId}` : '#/fleet'
    case 'login':
      return '#/login'
    case 'register':
      return '#/register'
    case 'dashboard':
      return '#/dashboard'
    case 'profile':
      return '#/profile'
    case 'bookings':
      return '#/bookings'
    case 'booking-timeline':
      return '#/booking-timeline'
    case 'my-reviews':
      return '#/reviews'
    case 'points':
      return '#/points'
    case 'payment-history':
      return '#/payment-history'
    case 'support':
      return '#/support'
    case 'notifications':
      return '#/notifications'
    case 'refund':
      return '#/refund'
    case 'privacy':
      return '#/privacy'
    case 'terms':
      return '#/terms'
    case 'cookies':
      return '#/cookies'
    case 'admin-login':
      return '#/admin/login'
    case 'admin':
      return '#/admin/dashboard'
    case 'admin-operations':
      return '#/admin/operations'
    case 'admin-cars':
      return '#/admin/cars'
    case 'admin-bookings':
      return '#/admin/bookings'
    case 'admin-customers':
      return '#/admin/customers'
    case 'admin-payments':
      return '#/admin/payments'
    case 'admin-complaints':
      return '#/admin/complaints'
    case 'admin-reviews':
      return '#/admin/reviews'
    case 'admin-employees':
      return '#/admin/employees'
    case 'admin-reports':
      return '#/admin/reports'
    case 'admin-maintenance':
      return '#/admin/maintenance'
    case 'admin-settings':
      return '#/admin/settings'
    case 'admin-forbidden':
      return '#/admin/forbidden'
    // employee portal
    case 'employee-login':
      return '#/employee/login'
    case 'employee':
      return '#/employee/dashboard'
    case 'employee-tasks':
      return '#/employee/tasks'
    case 'employee-bookings':
      return '#/employee/bookings'
    case 'employee-tickets':
      return '#/employee/tickets'
    case 'employee-calls':
      return '#/employee/calls'
    case 'employee-knowledge':
      return '#/employee/knowledge'
    case 'employee-performance':
      return '#/employee/performance'
    case 'employee-attendance':
      return '#/employee/attendance'
    case 'employee-forbidden':
      return '#/employee/forbidden'
    case 'not-found':
      return '#/not-found'
    default:
      return '#/'
  }
}

/** Parse the current URL hash into { view, carId }. */
function parseHash(): { view: ViewName; carId: string | null } {
  if (typeof window === 'undefined') return { view: 'home', carId: null }
  const hash = window.location.hash.replace(/^#\/?/, '') // strip "#/" or "#"
  const parts = hash.split('/').filter(Boolean)

  if (parts.length === 0) return { view: 'home', carId: null }

  const [first, second] = parts

  if (first === 'fleet') return { view: 'cars', carId: null }
  if (first === 'car' && second) return { view: 'car-detail', carId: second }
  if (first === 'booking' && second) return { view: 'booking', carId: second }
  if (first === 'login') return { view: 'login', carId: null }
  if (first === 'register') return { view: 'register', carId: null }
  if (first === 'dashboard') return { view: 'dashboard', carId: null }
  if (first === 'profile') return { view: 'profile', carId: null }
  if (first === 'bookings') return { view: 'bookings', carId: null }
  if (first === 'booking-timeline') return { view: 'booking-timeline', carId: null }
  if (first === 'reviews') return { view: 'my-reviews', carId: null }
  if (first === 'points') return { view: 'points', carId: null }
  if (first === 'payment-history') return { view: 'payment-history', carId: null }
  if (first === 'support') return { view: 'support', carId: null }
  if (first === 'notifications') return { view: 'notifications', carId: null }
  if (first === 'refund') return { view: 'refund', carId: null }
  if (first === 'privacy') return { view: 'privacy', carId: null }
  if (first === 'terms') return { view: 'terms', carId: null }
  if (first === 'cookies') return { view: 'cookies', carId: null }
  if (first === 'admin') {
    if (second === 'login') return { view: 'admin-login', carId: null }
    if (second === 'forbidden') return { view: 'admin-forbidden', carId: null }
    if (second === 'operations') return { view: 'admin-operations', carId: null }
    if (second === 'cars') return { view: 'admin-cars', carId: null }
    if (second === 'bookings') return { view: 'admin-bookings', carId: null }
    if (second === 'customers') return { view: 'admin-customers', carId: null }
    if (second === 'payments') return { view: 'admin-payments', carId: null }
    if (second === 'complaints') return { view: 'admin-complaints', carId: null }
    if (second === 'reviews') return { view: 'admin-reviews', carId: null }
    if (second === 'employees') return { view: 'admin-employees', carId: null }
    if (second === 'reports') return { view: 'admin-reports', carId: null }
    if (second === 'maintenance') return { view: 'admin-maintenance', carId: null }
    if (second === 'settings') return { view: 'admin-settings', carId: null }
    // bare #/admin or #/admin/dashboard → dashboard
    return { view: 'admin', carId: null }
  }
  if (first === 'employee') {
    if (second === 'login') return { view: 'employee-login', carId: null }
    if (second === 'forbidden') return { view: 'employee-forbidden', carId: null }
    if (second === 'dashboard') return { view: 'employee', carId: null }
    if (second === 'tasks') return { view: 'employee-tasks', carId: null }
    if (second === 'bookings') return { view: 'employee-bookings', carId: null }
    if (second === 'tickets') return { view: 'employee-tickets', carId: null }
    if (second === 'calls') return { view: 'employee-calls', carId: null }
    if (second === 'knowledge') return { view: 'employee-knowledge', carId: null }
    if (second === 'performance') return { view: 'employee-performance', carId: null }
    if (second === 'attendance') return { view: 'employee-attendance', carId: null }
    // bare #/employee → dashboard
    return { view: 'employee', carId: null }
  }
  if (first === 'not-found') return { view: 'not-found', carId: null }

  // Unknown hash → 404
  return { view: 'not-found', carId: null }
}

export const useUIStore = create<UIState>((set) => ({
  view: 'home',
  selectedCarId: null,
  navigate: (view, opts) => {
    const carId = opts?.carId ?? null
    const hash = viewToHash(view, carId)
    if (typeof window !== 'undefined') {
      // Setting the hash triggers `hashchange` → syncFromHash updates store.
      if (window.location.hash !== hash) {
        window.location.hash = hash
      } else {
        // Same hash, force update (e.g. navigating to same view)
        set({ view, selectedCarId: carId })
      }
    } else {
      set({ view, selectedCarId: carId })
    }
  },
  syncFromHash: () => {
    const { view, carId } = parseHash()
    set({ view, selectedCarId: carId })
  },
}))

/** Subscribe the store to `hashchange` events. Call once on app mount. */
export function initHashRouter() {
  if (typeof window === 'undefined') return
  const { syncFromHash } = useUIStore.getState()
  // Sync immediately for the initial load.
  syncFromHash()
  window.addEventListener('hashchange', syncFromHash)
}

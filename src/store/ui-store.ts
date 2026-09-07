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

export type ViewName =
  // main site
  | 'home'
  | 'cars'
  | 'car-detail'
  | 'booking'
  | 'login'
  | 'register'
  | 'profile'
  | 'bookings'
  | 'my-reviews'
  | 'points'
  | 'refund'
  | 'support'
  | 'privacy'
  | 'terms'
  | 'cookies'
  // admin portal (separated)
  | 'admin-login'
  | 'admin'
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
    case 'profile':
      return '#/profile'
    case 'bookings':
      return '#/bookings'
    case 'my-reviews':
      return '#/reviews'
    case 'points':
      return '#/points'
    case 'refund':
      return '#/refund'
    case 'support':
      return '#/support'
    case 'privacy':
      return '#/privacy'
    case 'terms':
      return '#/terms'
    case 'cookies':
      return '#/cookies'
    case 'admin-login':
      return '#/admin/login'
    case 'admin':
      return '#/admin'
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
  if (first === 'profile') return { view: 'profile', carId: null }
  if (first === 'bookings') return { view: 'bookings', carId: null }
  if (first === 'reviews') return { view: 'my-reviews', carId: null }
  if (first === 'points') return { view: 'points', carId: null }
  if (first === 'refund') return { view: 'refund', carId: null }
  if (first === 'support') return { view: 'support', carId: null }
  if (first === 'privacy') return { view: 'privacy', carId: null }
  if (first === 'terms') return { view: 'terms', carId: null }
  if (first === 'cookies') return { view: 'cookies', carId: null }
  if (first === 'admin') {
    if (second === 'login') return { view: 'admin-login', carId: null }
    return { view: 'admin', carId: null }
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

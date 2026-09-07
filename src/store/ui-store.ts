import { create } from 'zustand'

export type ViewName =
  | 'home'
  | 'cars'
  | 'car-detail'
  | 'booking'
  | 'login'
  | 'register'
  | 'profile'
  | 'bookings'
  | 'admin'

interface UIState {
  view: ViewName
  selectedCarId: string | null
  /** optional focus anchor on the home page */
  setView: (view: ViewName, opts?: { carId?: string }) => void
  reset: () => void
}

export const useUIStore = create<UIState>((set) => ({
  view: 'home',
  selectedCarId: null,
  setView: (view, opts) =>
    set({ view, selectedCarId: opts?.carId ?? null }),
  reset: () => set({ view: 'home', selectedCarId: null }),
}))

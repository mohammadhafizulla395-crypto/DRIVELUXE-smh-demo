import { create } from 'zustand'
import type { AuthUser } from '@/types'
import { authApi } from '@/lib/api'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean // initial session check
  hydrated: boolean
  setUser: (user: AuthUser | null) => void
  fetchUser: () => Promise<AuthUser | null>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  hydrated: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }),
  fetchUser: async () => {
    try {
      const { user } = await authApi.me()
      set({
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        loading: false,
        hydrated: true,
      })
      return user
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        hydrated: true,
      })
      return null
    }
  },
  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      set({ user: null, isAuthenticated: false, isAdmin: false, loading: false })
    }
  },
}))

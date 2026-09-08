import { create } from 'zustand'
import type { AuthEmployee } from '@/types'
import { employeeAuthApi } from '@/lib/api'

interface EmployeeAuthState {
  employee: AuthEmployee | null
  isAuthenticated: boolean
  loading: boolean
  hydrated: boolean
  setEmployee: (employee: AuthEmployee | null) => void
  fetchEmployee: () => Promise<AuthEmployee | null>
  logout: () => Promise<void>
}

export const useEmployeeStore = create<EmployeeAuthState>((set) => ({
  employee: null,
  isAuthenticated: false,
  loading: true,
  hydrated: false,
  setEmployee: (employee) =>
    set({
      employee,
      isAuthenticated: !!employee,
    }),
  fetchEmployee: async () => {
    try {
      const { employee } = await employeeAuthApi.me()
      set({ employee, isAuthenticated: true, loading: false, hydrated: true })
      return employee
    } catch {
      set({
        employee: null,
        isAuthenticated: false,
        loading: false,
        hydrated: true,
      })
      return null
    }
  },
  logout: async () => {
    try {
      await employeeAuthApi.logout()
    } finally {
      set({ employee: null, isAuthenticated: false, loading: false })
    }
  },
}))

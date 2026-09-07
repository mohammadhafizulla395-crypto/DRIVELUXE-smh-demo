import axios from 'axios'
import type {
  AuthUser,
  Car,
  Booking,
  Review,
  SupportTicket,
  PointTransaction,
  Pagination,
} from '@/types'
import type { CarInput } from '@/lib/validations'

/**
 * Centralized API client.
 * Uses relative URLs (same-origin) so cookies flow automatically.
 * Returns unwrapped `data` from the { success, data } envelope, and throws
 * a normalized ApiError on failure.
 */
export const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

export class ApiError extends Error {
  status: number
  fields?: Record<string, string>
  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

// Envelope type used by every API response.
type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } }

api.interceptors.response.use(
  (res) => {
    const body = res.data as Envelope<unknown>
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success) return { ...res, data: body.data }
      throw new ApiError(
        body.error?.message || 'Request failed',
        res.status,
        body.error?.fields,
      )
    }
    return res
  },
  (error) => {
    if (error.response) {
      const body = error.response.data as Envelope<unknown> | undefined
      const message =
        (body && typeof body === 'object' && 'error' in body && body.error?.message) ||
        (body && typeof body === 'object' && 'message' in body && (body as { message?: string }).message) ||
        'Something went wrong'
      const fields =
        body && typeof body === 'object' && 'error' in body
          ? body.error?.fields
          : undefined
      throw new ApiError(message, error.response.status, fields)
    }
    if (error.code === 'ERR_NETWORK') {
      throw new ApiError('Network error — please check your connection.', 0)
    }
    throw new ApiError(error.message || 'Unknown error', 0)
  },
)

export type { AuthUser }

/* ----------------------------- auth ----------------------------- */
export const authApi = {
  register: (data: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }) => api.post<{ user: AuthUser }>('/api/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<{ user: AuthUser }>('/api/auth/login', data).then((r) => r.data),

  me: () => api.get<{ user: AuthUser }>('/api/auth/me').then((r) => r.data),

  logout: () => api.post('/api/auth/logout').then((r) => r.data),

  updateProfile: (data: { name: string; phone?: string }) =>
    api.patch<{ user: AuthUser }>('/api/auth/profile', data).then((r) => r.data),
}

/* --------------------------- admin auth ------------------------- */
// Separate admin portal login — only accepts admin accounts.
export const adminAuthApi = {
  login: (data: { email: string; password: string }) =>
    api
      .post<{ user: AuthUser }>('/api/admin/login', data)
      .then((r) => r.data),
}

/* ----------------------------- cars ----------------------------- */
export interface CarQuery {
  search?: string
  type?: string
  transmission?: string
  fuel?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  featured?: boolean
  page?: number
  limit?: number
}

export const carsApi = {
  list: (q: CarQuery = {}) => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(q)) {
      if (v === undefined || v === '' || v === null) continue
      params.append(k, String(v))
    }
    return api
      .get<{ cars: Car[]; pagination: Pagination }>(`/api/cars?${params.toString()}`)
      .then((r) => r.data)
  },
  detail: (id: string) =>
    api
      .get<{ car: Car; related: Car[] }>(`/api/cars/${id}`)
      .then((r) => r.data),
  create: (data: CarInput) =>
    api.post<{ car: Car }>('/api/cars', data).then((r) => r.data),
  update: (id: string, data: Partial<CarInput>) =>
    api.put<{ car: Car }>(`/api/cars/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    api.delete<{ message: string }>(`/api/cars/${id}`).then((r) => r.data),
}

/* ---------------------------- bookings -------------------------- */
export const bookingsApi = {
  list: (status?: string) =>
    api
      .get<{ bookings: Booking[] }>('/api/bookings' + (status ? `?status=${status}` : ''))
      .then((r) => r.data),
  create: (data: {
    carId: string
    startDate: string
    endDate: string
    pickupLocation: string
  }) => api.post<{ booking: Booking }>('/api/bookings', data).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    api.patch<{ booking: Booking }>(`/api/bookings/${id}`, { status }).then((r) => r.data),
}

/* ---------------------------- reviews --------------------------- */
export const reviewsApi = {
  listByCar: (carId: string) =>
    api
      .get<{ reviews: Review[] }>(`/api/reviews?carId=${carId}`)
      .then((r) => r.data),
  mine: () =>
    api.get<{ reviews: Review[] }>('/api/reviews/mine').then((r) => r.data),
  create: (data: { carId: string; rating: number; comment: string }) =>
    api.post<{ review: Review }>('/api/reviews', data).then((r) => r.data),
}

/* ---------------------------- support --------------------------- */
export const supportApi = {
  list: () =>
    api.get<{ tickets: SupportTicket[] }>('/api/support').then((r) => r.data),
  create: (data: {
    subject: string
    category: string
    message: string
  }) =>
    api.post<{ ticket: SupportTicket }>('/api/support', data).then((r) => r.data),
}

/* ----------------------------- points --------------------------- */
export const pointsApi = {
  mine: () =>
    api
      .get<{ points: number; transactions: PointTransaction[] }>('/api/points')
      .then((r) => r.data),
}

/* ----------------------------- admin ---------------------------- */
export const adminApi = {
  stats: () =>
    api
      .get<{
        totalCars: number
        availableCars: number
        totalBookings: number
        totalUsers: number
        revenue: number
        fleetByType: Record<string, number>
      }>('/api/admin/stats')
      .then((r) => r.data),
}

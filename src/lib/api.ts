import axios from 'axios'
import type {
  AuthUser,
  AuthEmployee,
  Car,
  Booking,
  Review,
  SupportTicket,
  PointTransaction,
  Pagination,
  Payment,
  Activity,
  AdminStats,
  UpcomingPickup,
  Employee,
  EmployeeReport,
  Task,
  CustomerCall,
  KnowledgeBaseArticle,
  Attendance,
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
// Separate admin portal login — 3-step: email + password + 6-digit PIN
export const adminAuthApi = {
  login: (data: { email: string; password: string; pin: string }) =>
    api
      .post<{ user: AuthUser }>('/api/admin/login', data)
      .then((r) => r.data),
}

/* ------------------------- employee auth ------------------------ */
// Employee portal login — Employee ID (EMP-XXXX) + password
export const employeeAuthApi = {
  login: (data: { employeeId: string; password: string }) =>
    api
      .post<{ employee: AuthEmployee }>('/api/employee/login', data)
      .then((r) => r.data),
  me: () =>
    api.get<{ employee: AuthEmployee }>('/api/employee/me').then((r) => r.data),
  logout: () => api.post('/api/employee/logout').then((r) => r.data),
}

/* --------------------------- employee --------------------------- */
export interface EmployeeTableQuery {
  search?: string
  status?: string
  sort?: string
  page?: number
  limit?: number
  role?: string
  type?: string
  scope?: string
}

export const employeeApi = {
  stats: () =>
    api
      .get<{ pendingTasks: number; assignedTickets: number; resolvedToday: number; pendingReports: number }>(
        '/api/employee/stats',
      )
      .then((r) => r.data),

  tickets: {
    list: (q: EmployeeTableQuery = {}) => {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(q)) {
        if (v === undefined || v === '' || v === null) continue
        params.append(k, String(v))
      }
      return api
        .get<{ tickets: SupportTicket[] }>(`/api/employee/tickets?${params.toString()}`)
        .then((r) => r.data)
    },
    update: (id: string, data: { status: string; resolution?: string }) =>
      api.patch(`/api/employee/tickets/${id}`, data).then((r) => r.data),
  },

  tasks: {
    list: (status?: string) =>
      api
        .get<{ tasks: Task[] }>(`/api/employee/tasks${status ? `?status=${status}` : ''}`)
        .then((r) => r.data),
    update: (id: string, status: string) =>
      api.patch(`/api/employee/tasks/${id}`, { status }).then((r) => r.data),
  },

  calls: {
    list: () => api.get<{ calls: CustomerCall[] }>('/api/employee/calls').then((r) => r.data),
    create: (data: {
      customerName: string
      customerPhone: string
      userId?: string
      bookingId?: string
      subject: string
      notes?: string
      outcome?: string
      duration?: number
    }) => api.post<{ call: CustomerCall }>('/api/employee/calls', data).then((r) => r.data),
  },

  performance: () =>
    api
      .get<{
        metrics: { ticketsResolved: number; averageResponse: number; customerRating: number; pendingTasks: number }
        recentReports: EmployeeReport[]
      }>('/api/employee/performance')
      .then((r) => r.data),

  attendance: () =>
    api.get<{ attendance: Attendance[] }>('/api/employee/attendance').then((r) => r.data),

  knowledgeBase: (category?: string) =>
    api
      .get<{ articles: KnowledgeBaseArticle[] }>(
        `/api/employee/knowledge-base${category ? `?category=${category}` : ''}`,
      )
      .then((r) => r.data),

  reports: () =>
    api.get<{ reports: EmployeeReport[] }>('/api/employee/reports').then((r) => r.data),

  bookings: {
    list: (q: EmployeeTableQuery = {}) => {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(q)) {
        if (v === undefined || v === '' || v === null) continue
        params.append(k, String(v))
      }
      return api.get<{ bookings: Booking[] }>(`/api/employee/bookings?${params.toString()}`).then((r) => r.data)
    },
    assist: (id: string, data: { action: string; newEndDate?: string; issueDescription?: string }) =>
      api.patch(`/api/employee/bookings/${id}`, data).then((r) => r.data),
  },

  reviews: {
    list: (status = 'pending') =>
      api
        .get<{ reviews: Review[] }>(`/api/employee/reviews?status=${status}`)
        .then((r) => r.data),
    recommend: (id: string, data: { recommendation: string; note?: string }) =>
      api.patch(`/api/employee/reviews/${id}`, data).then((r) => r.data),
  },

  customers: {
    list: (search?: string) =>
      api
        .get<{ customers: Array<Record<string, unknown>> }>(
          `/api/employee/customers${search ? `?search=${search}` : ''}`,
        )
        .then((r) => r.data),
  },
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

/* ---------------------------- payments (customer) ---------------- */
export const paymentsApi = {
  mine: () =>
    api
      .get<{ payments: Array<Payment & { booking?: { id: string; startDate: string; endDate: string; totalPrice: number; status: string; car?: { id: string; name: string; brand: string; image: string } } }> }>(
        '/api/payments',
      )
      .then((r) => r.data),

  // Razorpay: create order → checkout → verify
  createOrder: (bookingId: string) =>
    api
      .post<{
        orderId: string
        amount: number
        currency: string
        bookingStatus: string
        keyId: string
      }>('/api/payments/create-order', { bookingId })
      .then((r) => r.data),

  verifyPayment: (data: {
    bookingId: string
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
  }) => api.post<{ verified: boolean; bookingStatus: string; pointsEarned: number }>('/api/payments/verify', data).then((r) => r.data),
}

/* -------------------------- notifications ------------------------ */
export interface CustomerNotification {
  id: string
  type: 'booking' | 'payment' | 'review' | 'ticket' | 'points'
  title: string
  message: string
  createdAt: string
  read: boolean
}

export const notificationsApi = {
  mine: () =>
    api
      .get<{ notifications: CustomerNotification[]; unread: number }>('/api/notifications')
      .then((r) => r.data),
}

/* ----------------------------- admin ---------------------------- */
export interface AdminTableQuery {
  search?: string
  status?: string
  sort?: string
  page?: number
  limit?: number
  archived?: boolean
  type?: string
  transmission?: string
  fuel?: string
  category?: string
  rating?: number
  method?: string
}

function buildQuery(q: AdminTableQuery = {}): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === '' || v === null) continue
    params.append(k, String(v))
  }
  return params.toString()
}

export interface AdminListResponse<T> {
  [key: string]: T[] | Pagination
  pagination: Pagination
}

export const adminApi = {
  // Dashboard
  stats: () => api.get<AdminStats>('/api/admin/stats').then((r) => r.data),
  activity: (limit = 15) =>
    api.get<{ activities: Activity[] }>(`/api/admin/activity?limit=${limit}`).then((r) => r.data),
  pickups: () =>
    api.get<{ pickups: UpcomingPickup[] }>('/api/admin/pickups').then((r) => r.data),
  settings: () =>
    api
      .get<{
        owner: { name: string; phone: string; email: string }
        system: {
          totalCars: number
          activeBookings: number
          totalUsers: number
          totalRevenue: number
          version: string
          environment: string
        }
      }>('/api/admin/settings')
      .then((r) => r.data),

  // Cars
  cars: {
    list: (q: AdminTableQuery = {}) =>
      api
        .get<{ cars: Car[]; pagination: Pagination }>(`/api/admin/cars?${buildQuery(q)}`)
        .then((r) => r.data),
    create: (data: CarInput) =>
      api.post<{ car: Car }>('/api/admin/cars', data).then((r) => r.data),
    update: (id: string, data: CarInput) =>
      api.put<{ car: Car }>(`/api/admin/cars/${id}`, data).then((r) => r.data),
    archive: (id: string, archived: boolean) =>
      api.patch<{ car: Car }>(`/api/admin/cars/${id}`, { archived }).then((r) => r.data),
    bulk: (ids: string[], action: string) =>
      api.post<{ updated: number }>('/api/admin/cars/bulk', { ids, action }).then((r) => r.data),
  },

  // Bookings
  bookings: {
    list: (q: AdminTableQuery = {}) =>
      api
        .get<{ bookings: Booking[]; pagination: Pagination }>(`/api/admin/bookings?${buildQuery(q)}`)
        .then((r) => r.data),
    updateStatus: (id: string, status: string) =>
      api.patch<{ booking: Booking }>(`/api/admin/bookings/${id}`, { status }).then((r) => r.data),
    archive: (id: string, archived: boolean) =>
      api.put<{ booking: Booking }>(`/api/admin/bookings/${id}`, { archived }).then((r) => r.data),
    bulk: (ids: string[], action: string) =>
      api.post<{ updated: number }>('/api/admin/bookings/bulk', { ids, action }).then((r) => r.data),
  },

  // Customers
  customers: {
    list: (q: AdminTableQuery = {}) =>
      api
        .get<{ customers: Array<Record<string, unknown>>; pagination: Pagination }>(
          `/api/admin/customers?${buildQuery(q)}`,
        )
        .then((r) => r.data),
    archive: (id: string, archived: boolean) =>
      api.patch(`/api/admin/customers/${id}`, { archived }).then((r) => r.data),
  },

  // Payments (with Razorpay refund)
  payments: {
    list: (q: AdminTableQuery = {}) =>
      api
        .get<{ payments: Payment[]; pagination: Pagination }>(`/api/admin/payments?${buildQuery(q)}`)
        .then((r) => r.data),
    updateStatus: (id: string, status: string) =>
      api.patch<{ payment: Payment }>(`/api/admin/payments/${id}`, { status }).then((r) => r.data),
    refund: (paymentId: string, reason: string) =>
      api
        .post<{ refundId: string; status: string; message: string }>('/api/payments/refund', { paymentId, reason })
        .then((r) => r.data),
  },

  // Complaints
  complaints: {
    list: (q: AdminTableQuery = {}) =>
      api
        .get<{ complaints: SupportTicket[]; pagination: Pagination }>(
          `/api/admin/complaints?${buildQuery(q)}`,
        )
        .then((r) => r.data),
    updateStatus: (id: string, status: string) =>
      api.patch<{ ticket: SupportTicket }>(`/api/admin/complaints/${id}`, { status }).then((r) => r.data),
    archive: (id: string, archived: boolean) =>
      api.patch(`/api/admin/complaints/${id}`, { archived }).then((r) => r.data),
    bulk: (ids: string[], action: string) =>
      api.post<{ updated: number }>('/api/admin/complaints/bulk', { ids, action }).then((r) => r.data),
  },

  // Reviews (with moderation workflow)
  reviews: {
    list: (q: AdminTableQuery = {}) =>
      api
        .get<{ reviews: Review[]; pagination: Pagination }>(`/api/admin/reviews?${buildQuery(q)}`)
        .then((r) => r.data),
    decide: (id: string, status: string) =>
      api.patch<{ review: Review }>(`/api/admin/reviews/${id}`, { status }).then((r) => r.data),
    archive: (id: string, archived: boolean) =>
      api.patch<{ review: Review }>(`/api/admin/reviews/${id}`, { archived }).then((r) => r.data),
  },

  // Employees (employee management module)
  employees: {
    list: (q: AdminTableQuery = {}) =>
      api
        .get<{ employees: Employee[]; pagination: Pagination }>(`/api/admin/employees?${buildQuery(q)}`)
        .then((r) => r.data),
    create: (data: { name: string; email: string; phone?: string; role: string }) =>
      api.post<{ employee: Employee & { defaultPassword?: string } }>('/api/admin/employees', data).then((r) => r.data),
    manage: (id: string, data: { action: string; role?: string; name?: string; phone?: string }) =>
      api.patch<{ message: string }>(`/api/admin/employees/${id}`, data).then((r) => r.data),
  },

  // Reports (employee audit trail — admin approves/rejects)
  reports: {
    list: (q: AdminTableQuery = {}) =>
      api
        .get<{ reports: EmployeeReport[]; pagination: Pagination }>(`/api/admin/reports?${buildQuery(q)}`)
        .then((r) => r.data),
    review: (id: string, data: { status: string; adminNote?: string }) =>
      api.patch<{ report: EmployeeReport }>(`/api/admin/reports/${id}`, data).then((r) => r.data),
  },
}

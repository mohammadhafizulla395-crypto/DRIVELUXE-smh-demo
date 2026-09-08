export type UserRole = 'user' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  phone: string | null
  points: number
}

export type CarType = 'Sedan' | 'SUV' | 'Sports' | 'Convertible' | 'Electric'
export type Transmission = 'Automatic' | 'Manual'
export type Fuel = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid'

export interface Car {
  id: string
  name: string
  brand: string
  type: CarType
  transmission: Transmission
  fuel: Fuel
  seats: number
  year: number
  pricePerDay: number
  image: string
  features: string
  description: string
  available: boolean
  featured: boolean
  archived: boolean
  rating: number
  createdAt: string
}

// Booking workflow: Booked → Paid → Pickup → In Use → Returned → Completed
// (cancelled can happen from booked/paid)
export type BookingStatus =
  | 'booked'
  | 'paid'
  | 'pickup'
  | 'in_use'
  | 'returned'
  | 'completed'
  | 'cancelled'

export interface Booking {
  id: string
  userId: string
  carId: string
  startDate: string
  endDate: string
  totalDays: number
  totalPrice: number
  pickupLocation: string
  status: BookingStatus
  archived: boolean
  createdAt: string
  car?: Pick<Car, 'id' | 'name' | 'brand' | 'image' | 'pricePerDay'>
  user?: { id: string; name: string; email: string }
  payment?: Payment
}

export interface Review {
  id: string
  userId: string
  carId: string
  rating: number
  comment: string
  archived: boolean
  createdAt: string
  user?: { id: string; name: string; email: string }
  car?: Pick<Car, 'id' | 'name' | 'brand' | 'image'>
}

export type SupportCategory =
  | 'general'
  | 'booking'
  | 'refund'
  | 'payment'
  | 'other'

// Complaints workflow: Open → In Progress → Resolved → Closed
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface SupportTicket {
  id: string
  userId: string
  subject: string
  category: SupportCategory
  message: string
  status: TicketStatus
  archived: boolean
  createdAt: string
  updatedAt: string
  user?: { id: string; name: string; email: string }
}

export interface PointTransaction {
  id: string
  userId: string
  amount: number
  reason: string
  bookingId: string | null
  createdAt: string
}

// Payment workflow: Pending → Paid → Refunded
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export interface Payment {
  id: string
  bookingId: string
  userId: string
  amount: number
  method: string
  status: PaymentStatus
  txnRef: string | null
  createdAt: string
  updatedAt: string
  booking?: Pick<Booking, 'id' | 'startDate' | 'endDate' | 'totalPrice'>
  user?: { id: string; name: string; email: string }
}

export type ActivityType =
  | 'booking_created'
  | 'booking_status'
  | 'payment'
  | 'complaint'
  | 'review'
  | 'car'
  | 'user'

export interface Activity {
  id: string
  type: ActivityType
  message: string
  actorId: string | null
  refId: string | null
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Admin dashboard operational stats (no graphs — operational cards)
export interface AdminStats {
  bookingsToday: number
  pendingPickups: number
  pendingReturns: number
  openComplaints: number
  totalCars: number
  totalBookings: number
  totalUsers: number
  revenue: number
}

export interface UpcomingPickup {
  id: string
  startDate: string
  pickupLocation: string
  status: BookingStatus
  user: { id: string; name: string; email: string }
  car: { id: string; name: string; brand: string; image: string }
}

/* ============================= EMPLOYEE PORTAL ============================= */

export type EmployeeRole = 'support' | 'fleet' | 'customer_care'
export type EmployeeStatus = 'active' | 'suspended' | 'inactive'

export interface AuthEmployee {
  id: string
  employeeId: string // EMP-XXXX
  name: string
  email: string
  phone: string | null
  role: EmployeeRole
  status: EmployeeStatus
  ticketsResolved: number
  avgResponseMin: number
  customerRating: number
}

export interface Employee {
  id: string
  employeeId: string
  name: string
  email: string
  phone: string | null
  role: EmployeeRole
  status: EmployeeStatus
  ticketsResolved: number
  avgResponseMin: number
  customerRating: number
  createdAt: string
  updatedAt: string
}

// Employee ticket workflow: Open → Assigned → Working → Solved → Waiting Approval → Closed
export type EmployeeTicketStatus =
  | 'open'
  | 'assigned'
  | 'working'
  | 'solved'
  | 'waiting_approval'
  | 'closed'
  | 'reopened'

// Review moderation workflow: pending → under_review → recommended → published | rejected
export type ReviewStatus =
  | 'pending'
  | 'under_review'
  | 'recommended'
  | 'published'
  | 'rejected'

export type ReviewRecommendation = 'approve' | 'reject' | 'flag'

export interface EmployeeReport {
  id: string
  employeeId: string
  type: string
  description: string
  refId: string | null
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string | null
  createdAt: string
  reviewedAt: string | null
  employee?: Pick<Employee, 'id' | 'employeeId' | 'name' | 'role'>
}

export interface Task {
  id: string
  employeeId: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'done'
  dueDate: string | null
  createdAt: string
}

export interface CustomerCall {
  id: string
  employeeId: string
  userId: string | null
  customerName: string
  customerPhone: string
  bookingId: string | null
  subject: string
  notes: string
  outcome: 'logged' | 'resolved' | 'escalated'
  duration: number
  createdAt: string
}

export interface KnowledgeBaseArticle {
  id: string
  title: string
  category: string
  content: string
  tags: string
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave'
  notes: string | null
}

export interface EmployeeStats {
  pendingTasks: number
  assignedTickets: number
  resolvedToday: number
  pendingReports: number
}

export interface MaintenanceRecord {
  id: string
  carId: string
  type: 'routine' | 'repair' | 'inspection' | 'cleaning'
  description: string
  cost: number
  status: 'scheduled' | 'in_progress' | 'completed'
  scheduledDate: string | null
  completedAt: string | null
  createdAt: string
  car?: Pick<Car, 'id' | 'name' | 'brand' | 'image'>
}

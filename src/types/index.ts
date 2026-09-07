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

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
  rating: number
  createdAt: string
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
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
  createdAt: string
  car?: Pick<Car, 'id' | 'name' | 'brand' | 'image' | 'pricePerDay'>
  user?: { id: string; name: string; email: string }
}

export interface Review {
  id: string
  userId: string
  carId: string
  rating: number
  comment: string
  createdAt: string
  user?: { id: string; name: string }
  car?: Pick<Car, 'id' | 'name' | 'brand'>
}

export type SupportCategory =
  | 'general'
  | 'booking'
  | 'refund'
  | 'payment'
  | 'other'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface SupportTicket {
  id: string
  userId: string
  subject: string
  category: SupportCategory
  message: string
  status: TicketStatus
  createdAt: string
}

export interface PointTransaction {
  id: string
  userId: string
  amount: number
  reason: string
  bookingId: string | null
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminStats {
  totalCars: number
  availableCars: number
  totalBookings: number
  totalUsers: number
  revenue: number
  fleetByType: Record<string, number>
}

import { z } from 'zod'

/* ------------------------------- auth -------------------------------- */

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().email('Please enter a valid email address').max(120),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

/* ------------------------- employee auth ---------------------------- */
// Employee portal login — Employee ID (EMP-XXXX) + password
export const employeeLoginSchema = z.object({
  employeeId: z
    .string()
    .min(1, 'Employee ID is required')
    .regex(/^EMP-\d{3,5}$/i, 'Use the format EMP-1001'),
  password: z.string().min(1, 'Password is required'),
})
export type EmployeeLoginInput = z.infer<typeof employeeLoginSchema>

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  phone: z
    .string()
    .max(20, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
})

/* ------------------------------- cars -------------------------------- */

export const carTypes = ['Sedan', 'SUV', 'Sports', 'Convertible', 'Electric'] as const
export const transmissions = ['Automatic', 'Manual'] as const
export const fuels = ['Petrol', 'Diesel', 'Electric', 'Hybrid'] as const

export const carSchema = z.object({
  name: z.string().min(2, 'Name is required').max(80),
  brand: z.string().min(2, 'Brand is required').max(60),
  type: z.enum(carTypes),
  transmission: z.enum(transmissions).default('Automatic'),
  fuel: z.enum(fuels).default('Petrol'),
  seats: z.coerce.number().int().min(2).max(9),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  pricePerDay: z.coerce.number().positive('Price must be greater than 0'),
  image: z.string().url('Please provide a valid image URL'),
  features: z.string().default(''),
  description: z.string().default(''),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  rating: z.coerce.number().min(0).max(5).default(4.5),
})

// Partial schema for updates (all fields optional except where it'd be invalid).
export const carUpdateSchema = carSchema.partial()

/* ------------------------------ bookings ----------------------------- */

const dateField = z
  .coerce
  .date()
  .refine((d) => !Number.isNaN(d.getTime()), {
    message: 'Please provide a valid date',
  })

export const bookingSchema = z
  .object({
    carId: z.string().min(1, 'Car is required'),
    startDate: dateField,
    endDate: dateField,
    pickupLocation: z.string().min(2, 'Pickup location is required').max(120),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Return date must be after the pickup date',
    path: ['endDate'],
  })

export const bookingStatusSchema = z.object({
  status: z.enum([
    'booked',
    'payment_processing',
    'paid',
    'pickup',
    'in_use',
    'returned',
    'completed',
    'cancelled',
  ]),
})

/* --------------------------- razorpay payments --------------------------- */

export const createOrderSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
})

export const verifyPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  razorpayOrderId: z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Signature is required'),
})

export const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500).default('Customer request'),
})

/* ------------------------------ reviews ------------------------------ */

export const reviewSchema = z.object({
  carId: z.string().min(1, 'Car is required'),
  rating: z.coerce.number().int().min(1, 'Please select a rating').max(5),
  comment: z.string().max(1000, 'Review is too long (max 1000 characters)').default(''),
})

/* ------------------------------ support ------------------------------ */

export const supportCategories = [
  'general',
  'booking',
  'refund',
  'payment',
  'other',
] as const

export const supportSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(120),
  category: z.enum(supportCategories).default('general'),
  message: z
    .string()
    .min(10, 'Please describe your issue (at least 10 characters)')
    .max(2000, 'Message is too long (max 2000 characters)'),
})

/* ------------------------------- types ------------------------------- */

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type CarInput = z.infer<typeof carSchema>
export type CarUpdateInput = z.infer<typeof carUpdateSchema>
export type BookingInput = z.infer<typeof bookingSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type SupportInput = z.infer<typeof supportSchema>

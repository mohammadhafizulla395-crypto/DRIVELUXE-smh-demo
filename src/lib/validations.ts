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

/* ------------------------------ bookings ----------------------------- */

export const bookingSchema = z
  .object({
    carId: z.string().min(1, 'Car is required'),
    startDate: z.string(),
    endDate: z.string(),
    pickupLocation: z.string().min(2, 'Pickup location is required').max(120),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: 'Return date must be after the pickup date',
      path: ['endDate'],
    },
  )

export const bookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
})

/* ------------------------------- types ------------------------------- */

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type CarInput = z.infer<typeof carSchema>
export type BookingInput = z.infer<typeof bookingSchema>

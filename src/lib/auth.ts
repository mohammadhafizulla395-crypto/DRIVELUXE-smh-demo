import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from './db'
import type { UserRole } from '@/types'

const COOKIE_NAME = 'driveluxe_token'
const TOKEN_TTL_DAYS = 7

// In production, a missing JWT_SECRET must fail loudly. In dev, fall back.
export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET environment variable is required in production.',
      )
    }
    return 'driveluxe-dev-secret-change-in-production'
  }
  return secret
})()

export interface JwtPayload {
  userId: string
  role: UserRole
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  phone: string | null
  points: number
}

/* ------------------------------ password ------------------------------ */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/* --------------------------------- jwt -------------------------------- */

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${TOKEN_TTL_DAYS}d` })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch {
    return null
  }
}

/* ------------------------------ cookies ------------------------------- */

export async function setAuthCookie(token: string) {
  const expires = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })
}

export async function clearAuthCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function getTokenFromCookie(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value
}

/* ------------------------- request helpers ---------------------------- */

/**
 * Reads the JWT from the httpOnly cookie, verifies it, and returns the user.
 * Returns null when unauthenticated / token invalid.
 */
export async function getUserFromRequest(): Promise<AuthUser | null> {
  const token = await getTokenFromCookie()
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      points: true,
    },
  })
  return user
}

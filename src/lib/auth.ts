import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from './db'
import { fail, unauthorized, forbidden } from './api-response'

const COOKIE_NAME = 'driveluxe_token'
const TOKEN_TTL_DAYS = 7

export const JWT_SECRET =
  process.env.JWT_SECRET || 'driveluxe-dev-secret-change-in-production'

export interface JwtPayload {
  userId: string
  role: string
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

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
}

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
    select: { id: true, name: true, email: true, role: true, phone: true },
  })
  return user
}

/** Throws-friendly guard: returns user or null. Use with `requireUser`. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getUserFromRequest()
  if (!user) {
    const err = new Error('You must be logged in to do that.') as Error & {
      status?: number
    }
    err.status = 401
    throw err
  }
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser()
  if (user.role !== 'admin') {
    const err = new Error('You do not have permission to do that.') as Error & {
      status?: number
    }
    err.status = 403
    throw err
  }
  return user
}

/** Convert thrown auth errors (with .status) into a proper response. */
export function authErrorResponse(err: unknown) {
  const e = err as Error & { status?: number }
  if (e?.status === 401) return unauthorized(e.message)
  if (e?.status === 403) return forbidden(e.message)
  return fail(e?.message || 'Authentication error.', e?.status || 400)
}

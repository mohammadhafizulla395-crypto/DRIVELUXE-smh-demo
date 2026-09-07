import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

/**
 * Standard API envelope:
 *   success: { success: true, data }
 *   error:   { success: false, error: { message } }
 */

type SuccessData<T> = { success: true; data: T }
type ErrorData = {
  success: false
  error: { message: string; fields?: Record<string, string> }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<SuccessData<T>>({ success: true, data }, { status })
}

export function created<T>(data: T) {
  return NextResponse.json<SuccessData<T>>({ success: true, data }, { status: 201 })
}

export function fail(message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json<ErrorData>(
    { success: false, error: { message, fields } },
    { status },
  )
}

export function unauthorized(message = 'You must be logged in to do that.') {
  return fail(message, 401)
}

export function forbidden(message = 'You do not have permission to do that.') {
  return fail(message, 403)
}

export function notFound(message = 'Resource not found.') {
  return fail(message, 404)
}

/**
 * Convert any thrown error into a friendly, correctly-classified response.
 * - ZodError       → 400 with field-level messages
 * - Prisma P2025   → 404 (record not found)
 * - Prisma P2002   → 409 (unique constraint)
 * - everything else → 500 with a generic message (details logged server-side)
 */
export function handleError(err: unknown) {
  // Zod validation → 400
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {}
    for (const issue of err.issues) {
      const key = issue.path.join('.')
      if (!fields[key]) fields[key] = issue.message
    }
    return fail('Please check the highlighted fields and try again.', 400, fields)
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      return notFound('The requested resource was not found.')
    }
    if (err.code === 'P2002') {
      return fail('That record already exists.', 409)
    }
    // Other known Prisma errors → 400 (bad request shape)
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Prisma error]', err.code, err.message)
    }
    return fail('The request could not be processed.', 400)
  }

  // Prisma unknown / connection errors → 500
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    console.error('[Prisma unknown error]', err.message)
    return fail('A database error occurred. Please try again.', 500)
  }

  // Generic Error → 400 only if it carries an explicit client-facing message;
  // otherwise 500 with a generic message (never leak internals).
  if (err instanceof Error) {
    const clientErrors = [
      'You must be logged in',
      'You do not have permission',
      'Incorrect email or password',
      'This portal is for administrators',
    ]
    const isClient = clientErrors.some((p) => err.message.startsWith(p))
    if (isClient) {
      return fail(err.message, 400)
    }
    console.error('[Unhandled error]', err.message)
    return fail('An unexpected error occurred. Please try again.', 500)
  }

  console.error('[Unknown error]', err)
  return fail('An unexpected error occurred.', 500)
}

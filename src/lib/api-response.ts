import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Standard API envelope:
 *   success: { success: true, data }
 *   error:   { success: false, error: { message } }
 */

type SuccessData<T> = { success: true; data: T }
type ErrorData = { success: false; error: { message: string; fields?: Record<string, string> } }

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

/** Convert any thrown error (incl. ZodError) into a friendly 400 response. */
export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {}
    for (const issue of err.issues) {
      const key = issue.path.join('.')
      if (!fields[key]) fields[key] = issue.message
    }
    return fail('Please check the highlighted fields and try again.', 400, fields)
  }
  if (err instanceof Error) {
    return fail(err.message || 'Something went wrong.', 400)
  }
  return fail('An unexpected error occurred.', 500)
}

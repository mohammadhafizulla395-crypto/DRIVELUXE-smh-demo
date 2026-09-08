import { getEmployeeFromRequest } from './auth'
import { unauthorized } from './api-response'
import type { NextResponse } from 'next/server'
import type { AuthEmployee } from '@/types'

/**
 * Employee guard — returns the employee if they have an active employee session,
 * otherwise returns an error response.
 */
export async function requireEmployee(): Promise<
  | { employee: AuthEmployee; error: null }
  | { employee: null; error: NextResponse }
> {
  const employee = await getEmployeeFromRequest()
  if (!employee) return { employee: null, error: unauthorized('Employee access required.') }
  return { employee, error: null }
}

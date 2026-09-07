import { getUserFromRequest } from './auth'
import { unauthorized, forbidden } from './api-response'
import type { AuthUser } from '@/types'

/**
 * Admin guard — returns the user if they're an authenticated admin,
 * otherwise returns a NextResponse error.
 */
export async function requireAdmin(): Promise<
  | { user: AuthUser; error: null }
  | { user: null; error: ReturnType<typeof forbidden> | ReturnType<typeof unauthorized> }
> {
  const user = await getUserFromRequest()
  if (!user) return { user: null, error: unauthorized() }
  if (user.role !== 'admin') return { user: null, error: forbidden('Administrator access required.') }
  return { user, error: null }
}

/** Parse standard table query params from a URL. */
export interface TableQuery {
  search?: string
  status?: string
  sort?: string
  page: number
  limit: number
  archived?: boolean
}

export function parseTableQuery(req: Request): TableQuery & Record<string, string | undefined | boolean | number> {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '10')))
  const archived = searchParams.get('archived') === 'true'
  const result: TableQuery & Record<string, string | undefined | boolean | number> = {
    search: searchParams.get('search')?.trim() || undefined,
    status: searchParams.get('status') || undefined,
    sort: searchParams.get('sort') || 'newest',
    page,
    limit,
    archived,
  }
  // pass through any extra params
  for (const [k, v] of searchParams.entries()) {
    if (!['search', 'status', 'sort', 'page', 'limit', 'archived'].includes(k)) {
      result[k] = v
    }
  }
  return result
}

/** Build a Prisma orderBy from a sort token. */
export function sortFrom(
  token: string | undefined,
  fieldMap: Record<string, string>,
  fallback: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' },
): Record<string, 'asc' | 'desc'> {
  if (!token) return fallback
  const [field, dir] = token.split(':')
  const prismaField = fieldMap[field]
  if (!prismaField) return fallback
  return { [prismaField]: (dir === 'asc' ? 'asc' : 'desc') }
}

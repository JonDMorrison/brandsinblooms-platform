/**
 * Type definitions for Next.js 15 App Router page props
 * Next.js 15 changed params and searchParams to be promises
 */

/**
 * Async params type for dynamic routes
 * @example
 * // For route: /posts/[id]
 * type Params = AsyncParams<{ id: string }>
 */
export type AsyncParams<T = Record<string, string>> = Promise<T>

/**
 * Async search params type
 * @example
 * // For URL: ?sort=asc&filter=active
 * type SearchParams = AsyncSearchParams
 */
export type AsyncSearchParams = Promise<Record<string, string | string[] | undefined>>

/**
 * Standard page props interface for Next.js 15 pages
 * @example
 * export default async function Page({ params, searchParams }: PageProps<{ id: string }>) {
 *   const { id } = await params
 *   const search = await searchParams
 * }
 */
export interface PageProps<TParams = Record<string, string>> {
  params: AsyncParams<TParams>
  searchParams?: AsyncSearchParams
}

/**
 * Layout props interface for Next.js 15 layouts
 */
export interface LayoutProps<TParams = Record<string, string>> {
  children: React.ReactNode
  params: AsyncParams<TParams>
}

/**
 * Error page props
 */
export interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Not found page props
 */
export interface NotFoundProps {
  params?: AsyncParams
}

/**
 * Helper to extract params type from PageProps
 * @example
 * type MyParams = ExtractParams<PageProps<{ id: string }>>
 * // Result: { id: string }
 */
export type ExtractParams<T> = T extends PageProps<infer P> ? P : never

/**
 * Helper to extract the resolved value from an async type
 * @example
 * type Resolved = Awaited<AsyncParams<{ id: string }>>
 * // Result: { id: string }
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T

/**
 * Utility function to handle async params safely
 * @example
 * const params = await resolveParams(props.params)
 */
export async function resolveParams<T>(params: AsyncParams<T>): Promise<T> {
  return await params
}

/**
 * Utility function to handle async search params safely with defaults
 * @example
 * const search = await resolveSearchParams(props.searchParams, { page: '1' })
 */
export async function resolveSearchParams(
  searchParams: AsyncSearchParams | undefined,
  defaults: Record<string, string> = {}
): Promise<Record<string, string | string[] | undefined>> {
  if (!searchParams) return defaults
  
  const resolved = await searchParams
  return { ...defaults, ...resolved }
}
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

export async function executeQuery<T>(
  query: Promise<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const { data, error } = await query
  
  if (error) {
    const err = error as { message?: string; code?: string; details?: unknown }
    throw new SupabaseError(
      err.message || 'Unknown error',
      err.code || 'UNKNOWN',
      err.details
    )
  }
  
  return data ?? []
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}
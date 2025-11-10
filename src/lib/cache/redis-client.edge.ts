/**
 * Edge-compatible Redis client wrapper
 * Uses HTTP-based Redis commands for edge runtime compatibility
 */

import { Site } from '@/src/lib/database/aliases'

interface RedisHTTPConfig {
  url: string
  token?: string
  database?: number
}

/**
 * Edge-safe Redis client using HTTP API
 * Compatible with Upstash Redis or Railway Redis with HTTP proxy
 */
export class EdgeRedisClient {
  private config: RedisHTTPConfig
  private baseUrl: string

  constructor(config: RedisHTTPConfig) {
    this.config = config
    // Parse Redis URL for HTTP endpoint
    this.baseUrl = this.parseRedisUrl(config.url)
  }

  private parseRedisUrl(url: string): string {
    // Convert redis:// URL to HTTP endpoint
    // For Upstash: redis://default:token@url -> https://url
    // For Railway Redis HTTP proxy: use REDIS_HTTP_URL env var
    if (process.env.REDIS_HTTP_URL) {
      return process.env.REDIS_HTTP_URL
    }
    
    // Parse standard Redis URL for Upstash
    if (url.includes('upstash.io')) {
      const match = url.match(/redis:\/\/[^:]+:([^@]+)@([^:]+)/)
      if (match) {
        const [, token, host] = match
        this.config.token = token
        return `https://${host}`
      }
    }
    
    // Fallback to environment variable
    return process.env.REDIS_HTTP_URL || url
  }

  private async request(command: string[]): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(command),
      })

      if (!response.ok) {
        throw new Error(`Redis HTTP error: ${response.status}`)
      }

      const data = await response.json()
      return data.result
    } catch (error) {
      console.error('[EdgeRedis] Request failed:', error)
      throw error
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const result = await this.request(['GET', key])
      return result
    } catch (error) {
      console.error('[EdgeRedis] GET failed:', error)
      return null
    }
  }

  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    try {
      const command = exSeconds 
        ? ['SET', key, value, 'EX', String(exSeconds)]
        : ['SET', key, value]
      
      await this.request(command)
    } catch (error) {
      console.error('[EdgeRedis] SET failed:', error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.request(['DEL', key])
    } catch (error) {
      console.error('[EdgeRedis] DEL failed:', error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.request(['EXISTS', key])
      return result === 1
    } catch (error) {
      console.error('[EdgeRedis] EXISTS failed:', error)
      return false
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.request(['EXPIRE', key, String(seconds)])
    } catch (error) {
      console.error('[EdgeRedis] EXPIRE failed:', error)
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const result = await this.request(['TTL', key])
      return result
    } catch (error) {
      console.error('[EdgeRedis] TTL failed:', error)
      return -1
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.request(['PING'])
      return result === 'PONG'
    } catch (error) {
      console.error('[EdgeRedis] PING failed:', error)
      return false
    }
  }
}

// Global edge-compatible Redis client
let edgeRedisClient: EdgeRedisClient | null = null

/**
 * Get edge-compatible Redis client
 */
export function getEdgeRedisClient(): EdgeRedisClient | null {
  if (!process.env.REDIS_URL && !process.env.REDIS_HTTP_URL) {
    return null
  }

  if (!edgeRedisClient) {
    edgeRedisClient = new EdgeRedisClient({
      url: process.env.REDIS_URL || process.env.REDIS_HTTP_URL || '',
      token: process.env.REDIS_TOKEN,
    })
  }

  return edgeRedisClient
}

/**
 * Edge-compatible site cache operations
 */
export async function getEdgeCachedSite(
  key: string
): Promise<Site | null> {
  const client = getEdgeRedisClient()
  if (!client) return null

  try {
    const cached = await client.get(key)
    if (cached) {
      return JSON.parse(cached) as Site
    }
  } catch (error) {
    console.error('[EdgeCache] Failed to get site:', error)
  }

  return null
}

export async function setEdgeCachedSite(
  key: string,
  site: Site,
  ttlSeconds: number = 300
): Promise<void> {
  const client = getEdgeRedisClient()
  if (!client) return

  try {
    await client.set(key, JSON.stringify(site), ttlSeconds)
  } catch (error) {
    console.error('[EdgeCache] Failed to set site:', error)
  }
}

export async function clearEdgeCachedSite(key: string): Promise<void> {
  const client = getEdgeRedisClient()
  if (!client) return

  try {
    await client.del(key)
  } catch (error) {
    console.error('[EdgeCache] Failed to clear site:', error)
  }
}

/**
 * Check if edge Redis is available
 */
export async function isEdgeRedisAvailable(): Promise<boolean> {
  const client = getEdgeRedisClient()
  if (!client) return false

  try {
    return await client.ping()
  } catch {
    return false
  }
}
/**
 * Cloudflare HTTP Client with Rate Limiting and Retry Logic
 */

import type {
  CloudflareConfig,
  CloudflareApiResponse,
  CreateCustomHostnameRequest,
  CreateWorkerRouteRequest,
  CustomHostnameResult,
  WorkerRouteResult,
} from './types';
import { RateLimitError } from './types';
import {
  createCloudflareErrorFromResponse,
  isRateLimitError,
  isRetryableError
} from './errors';

/**
 * Token bucket for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(tokensPerSecond: number, burstCapacity?: number) {
    this.maxTokens = burstCapacity || tokensPerSecond * 2.5; // Default 2.5x burst
    this.tokens = this.maxTokens;
    this.refillRate = tokensPerSecond;
    this.lastRefill = Date.now();
  }

  /**
   * Wait until a token is available and consume it
   */
  async consumeToken(): Promise<void> {
    await this.waitForToken();
    this.tokens--;
  }

  /**
   * Wait until a token is available
   */
  private async waitForToken(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      return;
    }

    // Calculate wait time
    const tokensNeeded = 1 - this.tokens;
    const waitMs = (tokensNeeded / this.refillRate) * 1000;

    await this.delay(waitMs);
    this.refill();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Cloudflare API HTTP Client
 */
export class CloudflareClient {
  private readonly config: CloudflareConfig;
  private readonly tokenBucket: TokenBucket;
  private readonly baseHeaders: Record<string, string>;

  constructor(config: CloudflareConfig) {
    this.config = config;
    this.tokenBucket = new TokenBucket(
      config.requestsPerSecond || 4,
      10 // Burst capacity
    );
    this.baseHeaders = {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Execute HTTP request with rate limiting and retry logic
   */
  private async executeRequest<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<CloudflareApiResponse<T>> {
    const url = `${this.config.apiBaseUrl || 'https://api.cloudflare.com/client/v4'}${path}`;
    const maxRetries = this.config.maxRetries || 3;
    const baseDelay = this.config.retryDelayMs || 1000;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Apply rate limiting
        await this.tokenBucket.consumeToken();

        // Log request
        console.log(`[Cloudflare] ${options.method || 'GET'} ${url} (attempt ${attempt + 1}/${maxRetries + 1})`);

        // Make request
        const response = await fetch(url, {
          ...options,
          headers: {
            ...this.baseHeaders,
            ...options.headers,
          },
        });

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delayMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : baseDelay * Math.pow(2, attempt);

          console.log(`[Cloudflare] Rate limited. Retrying after ${delayMs}ms`);

          if (attempt < maxRetries) {
            await this.delay(delayMs);
            continue;
          }

          throw new RateLimitError(
            'Cloudflare API rate limit exceeded',
            retryAfter ? parseInt(retryAfter, 10) : undefined
          );
        }

        // Handle non-success responses
        if (!response.ok) {
          const error = await createCloudflareErrorFromResponse(response);

          if (isRetryableError(error) && attempt < maxRetries) {
            const delayMs = baseDelay * Math.pow(2, attempt);
            console.log(`[Cloudflare] Retryable error. Retrying after ${delayMs}ms`);
            await this.delay(delayMs);
            continue;
          }

          throw error;
        }

        // Parse successful response
        const data = await response.json() as CloudflareApiResponse<T>;

        // Log response
        console.log(`[Cloudflare] Response success: ${data.success}`);

        if (!data.success) {
          const error = new Error(`Cloudflare API returned success: false`);
          if (attempt < maxRetries) {
            await this.delay(baseDelay * Math.pow(2, attempt));
            continue;
          }
          throw error;
        }

        return data;
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (attempt < maxRetries && isRetryableError(error)) {
          const delayMs = baseDelay * Math.pow(2, attempt);
          console.log(`[Cloudflare] Error: ${lastError.message}. Retrying after ${delayMs}ms`);
          await this.delay(delayMs);
          continue;
        }

        // No more retries
        throw error;
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a custom hostname
   */
  async createCustomHostname(
    request: CreateCustomHostnameRequest
  ): Promise<CloudflareApiResponse<CustomHostnameResult>> {
    return this.executeRequest<CustomHostnameResult>(
      `/zones/${this.config.zoneId}/custom_hostnames`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Get custom hostname details
   */
  async getCustomHostname(
    hostnameId: string
  ): Promise<CloudflareApiResponse<CustomHostnameResult>> {
    return this.executeRequest<CustomHostnameResult>(
      `/zones/${this.config.zoneId}/custom_hostnames/${hostnameId}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Delete a custom hostname
   */
  async deleteCustomHostname(
    hostnameId: string
  ): Promise<CloudflareApiResponse<{ id: string }>> {
    return this.executeRequest<{ id: string }>(
      `/zones/${this.config.zoneId}/custom_hostnames/${hostnameId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * List custom hostnames
   */
  async listCustomHostnames(
    params?: {
      hostname?: string;
      page?: number;
      per_page?: number;
    }
  ): Promise<CloudflareApiResponse<CustomHostnameResult[]>> {
    const queryParams = new URLSearchParams();
    if (params?.hostname) queryParams.append('hostname', params.hostname);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const query = queryParams.toString();
    const path = `/zones/${this.config.zoneId}/custom_hostnames${query ? `?${query}` : ''}`;

    return this.executeRequest<CustomHostnameResult[]>(path, {
      method: 'GET',
    });
  }

  /**
   * Create a worker route
   */
  async createWorkerRoute(
    request: CreateWorkerRouteRequest
  ): Promise<CloudflareApiResponse<WorkerRouteResult>> {
    return this.executeRequest<WorkerRouteResult>(
      `/zones/${this.config.zoneId}/workers/routes`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Get worker route details
   */
  async getWorkerRoute(
    routeId: string
  ): Promise<CloudflareApiResponse<WorkerRouteResult>> {
    return this.executeRequest<WorkerRouteResult>(
      `/zones/${this.config.zoneId}/workers/routes/${routeId}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Delete a worker route
   */
  async deleteWorkerRoute(
    routeId: string
  ): Promise<CloudflareApiResponse<{ id: string }>> {
    return this.executeRequest<{ id: string }>(
      `/zones/${this.config.zoneId}/workers/routes/${routeId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * List worker routes
   */
  async listWorkerRoutes(): Promise<CloudflareApiResponse<WorkerRouteResult[]>> {
    return this.executeRequest<WorkerRouteResult[]>(
      `/zones/${this.config.zoneId}/workers/routes`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Update custom hostname
   */
  async updateCustomHostname(
    hostnameId: string,
    updates: Partial<CreateCustomHostnameRequest>
  ): Promise<CloudflareApiResponse<CustomHostnameResult>> {
    return this.executeRequest<CustomHostnameResult>(
      `/zones/${this.config.zoneId}/custom_hostnames/${hostnameId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  }
}
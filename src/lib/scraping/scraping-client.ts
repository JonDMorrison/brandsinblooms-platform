import { createHash } from 'crypto';
import { scrapingConfig } from '@/lib/config/scraping';
import { handleError } from '@/lib/types/error-handling';

interface ScrapingRequest {
  url: string;
  timeout?: number;
}

interface ScrapingResponse {
  success: boolean;
  url: string;
  html?: string;
  screenshot?: string; // Base64 encoded screenshot
  metadata?: {
    title?: string;
    description?: string;
    favicon?: string;
  };
  error?: string;
}

/**
 * Generates MD5 hash for scraping service authentication
 */
function generateScrapingHash(url: string): string {
  const payload = `${url}:${scrapingConfig.salt}`;
  return createHash('md5').update(payload).digest('hex').toLowerCase();
}

/**
 * Validates URL for scraping safety
 */
function validateScrapingUrl(url: string): void {
  try {
    const parsedUrl = new URL(url);

    // Block localhost and internal IPs
    if (parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1' ||
        parsedUrl.hostname.startsWith('192.168.') ||
        parsedUrl.hostname.startsWith('10.') ||
        parsedUrl.hostname.startsWith('172.')) {
      throw new Error('Cannot scrape localhost or internal IPs');
    }

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }

    // Must have valid hostname
    if (!parsedUrl.hostname || parsedUrl.hostname.length < 3) {
      throw new Error('Invalid hostname');
    }
  } catch (error: unknown) {
    throw new Error(`Invalid URL for scraping: ${handleError(error).message}`);
  }
}

/**
 * Scrapes a single URL using the external scraping service
 */
export async function scrapeUrl(
  url: string,
  options: { timeout?: number; retries?: number } = {}
): Promise<ScrapingResponse> {
  validateScrapingUrl(url);

  const timeout = options.timeout || scrapingConfig.timeout;
  const maxRetries = options.retries || scrapingConfig.maxRetries;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const hash = generateScrapingHash(url);
      const requestBody: ScrapingRequest = { url, timeout };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout + 5000); // 5s buffer

      const response = await fetch(`${scrapingConfig.serviceUrl}/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          hash,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Scraping service returned ${response.status}: ${errorText}`);
      }

      const data = await response.json() as ScrapingResponse;

      if (!data.success) {
        throw new Error(data.error || 'Scraping failed without error message');
      }

      return data;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on validation errors
      if (lastError.message.includes('Invalid URL')) {
        throw lastError;
      }

      // Retry on network/timeout errors
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }
    }
  }

  throw lastError || new Error('Scraping failed after retries');
}

/**
 * Scrapes multiple URLs in parallel with concurrency limit
 */
export async function scrapeMultipleUrls(
  urls: string[],
  options: { concurrency?: number } = {}
): Promise<Map<string, ScrapingResponse>> {
  const concurrency = options.concurrency || 3;
  const results = new Map<string, ScrapingResponse>();

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const responses = await Promise.allSettled(
      batch.map(url => scrapeUrl(url))
    );

    responses.forEach((result, index) => {
      const url = batch[index];
      if (result.status === 'fulfilled') {
        results.set(url, result.value);
      } else {
        results.set(url, {
          success: false,
          url,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });
  }

  return results;
}

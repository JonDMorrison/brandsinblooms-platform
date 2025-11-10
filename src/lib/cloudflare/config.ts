/**
 * Cloudflare Configuration
 * Validates and exports environment variables for Cloudflare integration
 */

import type { CloudflareConfig } from './types';

/**
 * Validates that all required environment variables are present
 */
function validateEnvironment(): CloudflareConfig {
  const requiredVars = [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ZONE_ID',
    'CLOUDFLARE_ACCOUNT_ID',
    'PLATFORM_DOMAIN',
    'CLOUDFLARE_WORKER_NAME',
  ] as const;

  const missing: string[] = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Cloudflare environment variables: ${missing.join(', ')}`
    );
  }

  return {
    apiToken: process.env.CLOUDFLARE_API_TOKEN!,
    zoneId: process.env.CLOUDFLARE_ZONE_ID!,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    platformDomain: process.env.PLATFORM_DOMAIN!,
    proxySubdomain: process.env.PLATFORM_PROXY_SUBDOMAIN || 'site-proxy',
    workerName: process.env.CLOUDFLARE_WORKER_NAME!,
    apiBaseUrl: process.env.CLOUDFLARE_API_URL || 'https://api.cloudflare.com/client/v4',
    maxRetries: parseInt(process.env.CLOUDFLARE_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.CLOUDFLARE_RETRY_DELAY_MS || '1000', 10),
    requestsPerSecond: parseInt(process.env.CLOUDFLARE_RATE_LIMIT || '4', 10),
  };
}

/**
 * Cloudflare configuration singleton
 * Lazy initialization to avoid errors during build time
 */
let _config: CloudflareConfig | null = null;

/**
 * Get Cloudflare configuration
 * Validates environment on first access
 */
export function getCloudflareConfig(): CloudflareConfig {
  if (!_config) {
    _config = validateEnvironment();
  }
  return _config;
}

/**
 * Check if Cloudflare is configured
 */
export function isCloudflareConfigured(): boolean {
  try {
    getCloudflareConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the proxy URL for a custom domain
 */
export function getProxyUrl(config?: CloudflareConfig): string {
  const cfg = config || getCloudflareConfig();
  return `${cfg.proxySubdomain}.${cfg.platformDomain}`;
}

/**
 * Get the worker pattern for a custom domain
 */
export function getWorkerPattern(domain: string): string {
  return `${domain}/*`;
}
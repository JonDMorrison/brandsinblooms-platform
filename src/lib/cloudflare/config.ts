/**
 * Cloudflare Configuration
 * Validates and exports environment variables for Cloudflare integration
 */

import type { CloudflareConfig } from './types';

/**
 * Validates that all required environment variables are present
 * Note: Only validates when actually used (runtime), not at build time
 */
function validateEnvironment(): CloudflareConfig {
  const requiredVars = [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ZONE_ID',
    'CLOUDFLARE_ACCOUNT_ID',
    'NEXT_PUBLIC_APP_DOMAIN',
    'CLOUDFLARE_WORKER_NAME',
  ] as const;

  const missing: string[] = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    // Log warning for debugging but don't crash the server
    console.warn(
      `[Cloudflare Config] Missing environment variables: ${missing.join(', ')}. ` +
      `Custom domain features will not be available.`
    );

    // Throw error only if Cloudflare functionality is actually being used
    // This allows the server to start even if Cloudflare isn't configured
    throw new Error(
      `Cloudflare custom domain feature is not configured. Missing: ${missing.join(', ')}. ` +
      `Set these environment variables to enable custom domain support.`
    );
  }

  // Strip *.  prefix from NEXT_PUBLIC_APP_DOMAIN if present
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN!;
  const platformDomain = appDomain.startsWith('*.') ? appDomain.slice(2) : appDomain;

  return {
    apiToken: process.env.CLOUDFLARE_API_TOKEN!,
    zoneId: process.env.CLOUDFLARE_ZONE_ID!,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    platformDomain,
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
let _configError: Error | null = null;

/**
 * Get Cloudflare configuration
 * Validates environment on first access
 * @throws Error if required environment variables are missing
 */
export function getCloudflareConfig(): CloudflareConfig {
  // Return cached config if available
  if (_config) {
    return _config;
  }

  // Return cached error if validation previously failed
  if (_configError) {
    throw _configError;
  }

  // Attempt validation
  try {
    _config = validateEnvironment();
    return _config;
  } catch (error) {
    // Cache the error to avoid re-validating on every call
    _configError = error as Error;
    throw error;
  }
}

/**
 * Check if Cloudflare is configured without throwing errors
 * @returns true if all required environment variables are set
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
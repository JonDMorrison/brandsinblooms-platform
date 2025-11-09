import type { Env, ProxyConfig } from './types';

/**
 * Parse and validate environment configuration
 */
export function parseConfig(env: Env): ProxyConfig {
  const originEndpoint = env.ORIGIN_ENDPOINT;

  if (!originEndpoint) {
    throw new Error('ORIGIN_ENDPOINT is required');
  }

  // Validate origin endpoint is HTTPS
  if (!originEndpoint.startsWith('https://')) {
    throw new Error('ORIGIN_ENDPOINT must be HTTPS');
  }

  // Parse allowed domains if provided
  let allowedDomains: string[] | undefined;
  if (env.ALLOWED_DOMAINS) {
    try {
      allowedDomains = JSON.parse(env.ALLOWED_DOMAINS);
      if (!Array.isArray(allowedDomains)) {
        throw new Error('ALLOWED_DOMAINS must be a JSON array');
      }
    } catch (error) {
      throw new Error(
        `Failed to parse ALLOWED_DOMAINS: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return {
    originEndpoint,
    allowedDomains,
    environment: env.ENVIRONMENT || 'development',
  };
}

/**
 * Check if a domain is allowed
 */
export function isDomainAllowed(
  domain: string,
  allowedDomains?: string[]
): boolean {
  // If no allowlist is configured, allow all domains
  if (!allowedDomains || allowedDomains.length === 0) {
    return true;
  }

  return allowedDomains.includes(domain);
}

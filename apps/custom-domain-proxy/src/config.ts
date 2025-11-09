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

  return {
    originEndpoint,
    environment: env.ENVIRONMENT || 'development',
  };
}

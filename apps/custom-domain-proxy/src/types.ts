/**
 * Environment bindings for the Cloudflare Worker
 */
export interface Env {
  /**
   * The origin endpoint to proxy requests to (e.g., https://your-app.railway.app)
   */
  ORIGIN_ENDPOINT: string;

  /**
   * Optional JSON array of allowed custom domains
   * If not set, all domains are allowed
   */
  ALLOWED_DOMAINS?: string;

  /**
   * Environment name (production, staging, etc.)
   */
  ENVIRONMENT?: string;
}

/**
 * Configuration for the proxy
 */
export interface ProxyConfig {
  originEndpoint: string;
  allowedDomains?: string[];
  environment: string;
}

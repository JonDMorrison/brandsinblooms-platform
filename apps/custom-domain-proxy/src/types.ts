/**
 * Environment bindings for the Cloudflare Worker
 */
export interface Env {
  /**
   * The origin endpoint to proxy requests to (e.g., https://your-app.railway.app)
   */
  ORIGIN_ENDPOINT: string;

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
  environment: string;
}

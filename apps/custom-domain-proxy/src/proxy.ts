import type { ProxyConfig } from './types';

/**
 * Create a proxied request with modified headers
 */
export async function createProxyRequest(
  request: Request,
  config: ProxyConfig
): Promise<Request> {
  const url = new URL(request.url);
  const customDomain = url.hostname;

  // Build target URL using origin endpoint
  const targetUrl = new URL(
    url.pathname + url.search + url.hash,
    config.originEndpoint
  );

  // Clone headers and modify
  const headers = new Headers(request.headers);

  // Set Host header to origin hostname
  const originHostname = new URL(config.originEndpoint).hostname;
  headers.set('Host', originHostname);

  // Add custom domain header
  headers.set('x-custom-domain', customDomain);

  // Add forwarding headers for better traceability
  headers.set('x-forwarded-host', customDomain);
  headers.set('x-forwarded-proto', url.protocol.slice(0, -1));

  // Preserve original URL if needed for debugging
  if (config.environment !== 'production') {
    headers.set('x-original-url', request.url);
  }

  // Create new request with modified headers
  return new Request(targetUrl.toString(), {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'manual',
  });
}

/**
 * Proxy a request to the origin server
 */
export async function proxyRequest(
  request: Request,
  config: ProxyConfig
): Promise<Response> {
  try {
    // Create proxied request
    const proxyReq = await createProxyRequest(request, config);

    // Forward to origin
    const response = await fetch(proxyReq);

    // Clone response to modify headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    // Add CORS headers if needed
    const url = new URL(request.url);
    newResponse.headers.set(
      'Access-Control-Allow-Origin',
      `https://${url.hostname}`
    );

    // Add debug headers in non-production
    if (config.environment !== 'production') {
      newResponse.headers.set('x-proxy-worker', 'custom-domain-proxy');
      newResponse.headers.set('x-proxy-version', '1.0.0');
    }

    return newResponse;
  } catch (error) {
    console.error('Proxy error:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Proxy error',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

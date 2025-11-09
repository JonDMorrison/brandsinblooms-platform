import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';

describe('Custom Domain Proxy', () => {
  beforeAll(() => {
    // Set required environment variables for testing
    env.ORIGIN_ENDPOINT = 'https://example.com';
  });

  it('should respond to health check', async () => {
    const response = await SELF.fetch('https://test.example.com/_health');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('worker', 'custom-domain-proxy');
  });

  it('should reject requests when ORIGIN_ENDPOINT is not set', async () => {
    const originalEndpoint = env.ORIGIN_ENDPOINT;
    // @ts-expect-error - Testing missing env var
    env.ORIGIN_ENDPOINT = undefined;

    const response = await SELF.fetch('https://test.example.com/');
    expect(response.status).toBe(500);

    env.ORIGIN_ENDPOINT = originalEndpoint;
  });

  it('should reject non-HTTPS origin endpoints', async () => {
    const originalEndpoint = env.ORIGIN_ENDPOINT;
    env.ORIGIN_ENDPOINT = 'http://insecure.example.com';

    const response = await SELF.fetch('https://test.example.com/');
    expect(response.status).toBe(500);

    env.ORIGIN_ENDPOINT = originalEndpoint;
  });

  it('should respect domain allowlist', async () => {
    const originalEndpoint = env.ORIGIN_ENDPOINT;
    env.ORIGIN_ENDPOINT = 'https://origin.example.com';
    env.ALLOWED_DOMAINS = JSON.stringify(['allowed.com']);

    const allowedResponse = await SELF.fetch('https://allowed.com/');
    expect(allowedResponse.status).not.toBe(403);

    const deniedResponse = await SELF.fetch('https://denied.com/');
    expect(deniedResponse.status).toBe(403);

    env.ORIGIN_ENDPOINT = originalEndpoint;
    // @ts-expect-error - Testing cleanup
    env.ALLOWED_DOMAINS = undefined;
  });
});

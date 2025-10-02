export const scrapingConfig = {
  serviceUrl: process.env.SCRAPING_SERVICE_URL,
  salt: process.env.SCRAPING_SERVICE_SALT,
  timeout: parseInt(process.env.SCRAPING_SERVICE_TIMEOUT || '30000'),
  maxRetries: parseInt(process.env.SCRAPING_SERVICE_MAX_RETRIES || '2'),
  maxPagesPerSite: 5, // Limit pages to scrape
} as const;

/**
 * Validates scraping configuration at runtime
 * Call this before using the scraping service
 */
export function validateScrapingConfig(): void {
  if (!scrapingConfig.serviceUrl || !scrapingConfig.salt) {
    throw new Error('Missing required scraping service configuration');
  }
}

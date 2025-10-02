import { scrapeUrl, scrapeMultipleUrls } from './scraping-client';
import { extractNavigationLinks, prioritizeLinksForScraping } from './link-extractor';
import { scrapingConfig, validateScrapingConfig } from '@/lib/config/scraping';

export interface DiscoveredPage {
  url: string;
  pageType: 'homepage' | 'about' | 'contact' | 'services' | 'team' | 'blog' | 'products' | 'faq' | 'privacy' | 'terms' | 'other';
  html: string;
  metadata?: {
    title?: string;
    description?: string;
  };
  scrapedAt: Date;
}

export interface PageDiscoveryResult {
  baseUrl: string;
  pages: DiscoveredPage[];
  errors: Array<{ url: string; error: string }>;
  totalPagesFound: number;
  totalPagesScraped: number;
}

/**
 * Discovers and scrapes relevant pages from a website
 */
export async function discoverAndScrapePages(
  websiteUrl: string
): Promise<PageDiscoveryResult> {
  validateScrapingConfig();
  const errors: Array<{ url: string; error: string }> = [];
  const pages: DiscoveredPage[] = [];

  // Step 1: Scrape homepage
  console.log(`Starting page discovery for: ${websiteUrl}`);
  let homepageResponse;
  try {
    homepageResponse = await scrapeUrl(websiteUrl);

    if (homepageResponse.success && homepageResponse.html) {
      pages.push({
        url: websiteUrl,
        pageType: 'homepage',
        html: homepageResponse.html,
        metadata: homepageResponse.metadata,
        scrapedAt: new Date(),
      });
    } else {
      throw new Error(homepageResponse.error || 'Failed to scrape homepage');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push({ url: websiteUrl, error: errorMessage });

    // If homepage fails, abort entirely
    return {
      baseUrl: websiteUrl,
      pages: [],
      errors,
      totalPagesFound: 0,
      totalPagesScraped: 0,
    };
  }

  // Step 2: Extract navigation links from homepage
  const navLinks = extractNavigationLinks(homepageResponse.html!, websiteUrl);
  console.log(`Discovered ${navLinks.length} navigation links from homepage`);

  // Step 3: Prioritize links for scraping
  const prioritized = prioritizeLinksForScraping(navLinks, scrapingConfig.maxPagesPerSite - 1); // -1 for homepage
  console.log(`Prioritized ${prioritized.length} pages for scraping:`, prioritized.map(p => `${p.pageType}: ${p.href}`).join(', '));

  // Step 4: Scrape prioritized pages in parallel (with smart concurrency)
  if (prioritized.length > 0) {
    console.log(`Scraping ${prioritized.length} additional pages...`);
    const urlsToScrape = prioritized.map(link => link.href);
    // Increase concurrency for larger scraping jobs
    const concurrency = prioritized.length > 6 ? 4 : 3;
    const responses = await scrapeMultipleUrls(urlsToScrape, { concurrency });

    responses.forEach((response, url) => {
      const link = prioritized.find(l => l.href === url);

      if (response.success && response.html) {
        pages.push({
          url,
          pageType: link?.pageType || 'other',
          html: response.html,
          metadata: response.metadata,
          scrapedAt: new Date(),
        });
      } else {
        errors.push({ url, error: response.error || 'Unknown error' });
      }
    });
  }

  const result = {
    baseUrl: websiteUrl,
    pages,
    errors,
    totalPagesFound: navLinks.length + 1, // +1 for homepage
    totalPagesScraped: pages.length,
  };

  console.log(`Page discovery complete: ${result.totalPagesScraped}/${result.totalPagesFound} pages scraped successfully`);
  if (errors.length > 0) {
    console.log(`Failed to scrape ${errors.length} pages:`, errors.map(e => e.url).join(', '));
  }

  return result;
}

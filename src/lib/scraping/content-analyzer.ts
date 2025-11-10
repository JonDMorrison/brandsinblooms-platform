import type { DiscoveredPage } from './page-discovery';
import { extractBusinessInfo, type ExtractedBusinessInfo } from './content-extractor';
import { extractBusinessInfoWithLLM } from './llm-extractor';
import { isLLMExtractionReady } from './llm-extractor-config';
import { load } from 'cheerio';
import type { ScrapedWebsiteContext } from '@/src/lib/types/site-generation-jobs';

export interface AnalyzedWebsite {
  baseUrl: string;
  businessInfo: ExtractedBusinessInfo;
  pageContents: Map<string, string>; // pageType -> cleaned text content
  recommendedPages: string[]; // Page types to generate based on what was found
  contentSummary: string; // High-level summary for LLM context
}

/**
 * Cleans and extracts main text content from HTML
 */
function extractCleanText(html: string): string {
  const $ = load(html);

  // Remove unwanted elements
  $('script, style, nav, header, footer, iframe, noscript').remove();

  // Extract main content area if identifiable
  const mainSelectors = ['main', '[role="main"]', '#content', '.content', 'article'];
  let mainContent = '';

  for (const selector of mainSelectors) {
    const content = $(selector).first().text();
    if (content.length > mainContent.length) {
      mainContent = content;
    }
  }

  // Fallback to body if no main content found
  if (!mainContent || mainContent.length < 100) {
    mainContent = $('body').text();
  }

  // Clean whitespace
  return mainContent
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .slice(0, 5000); // Limit to 5000 chars per page
}

/**
 * Recommends which page types to generate based on discovered content
 */
function recommendPagesToGenerate(pages: DiscoveredPage[]): string[] {
  const found = new Set(pages.map(p => p.pageType));
  const recommended: string[] = ['home']; // Always generate home

  // If about page found, generate about
  if (found.has('about')) {
    recommended.push('about');
  }

  // If contact page found, generate contact
  if (found.has('contact')) {
    recommended.push('contact');
  }

  // If services found, generate services
  if (found.has('services')) {
    recommended.push('services');
  }

  // If team found, generate team
  if (found.has('team')) {
    recommended.push('team');
  }

  // If FAQ found, generate FAQ
  if (found.has('faq')) {
    recommended.push('faq');
  }

  // Always generate contact if not found (required)
  if (!recommended.includes('contact')) {
    recommended.push('contact');
  }

  // Always generate about if not found (required)
  if (!recommended.includes('about')) {
    recommended.push('about');
  }

  return recommended;
}

/**
 * Creates a content summary for LLM context
 */
function createContentSummary(
  businessInfo: ExtractedBusinessInfo,
  pageContents: Map<string, string>
): string {
  const parts: string[] = [];

  if (businessInfo.siteTitle) {
    parts.push(`Site Title: ${businessInfo.siteTitle}`);
  }

  // Include hero section details if available
  if (businessInfo.heroSection) {
    if (businessInfo.heroSection.headline) {
      parts.push(`Hero Headline: ${businessInfo.heroSection.headline}`);
    }
    if (businessInfo.heroSection.subheadline) {
      parts.push(`Hero Subheadline: ${businessInfo.heroSection.subheadline}`);
    }
    if (businessInfo.heroSection.ctaText) {
      parts.push(`Hero CTA: ${businessInfo.heroSection.ctaText}`);
    }
  }

  if (businessInfo.tagline) {
    parts.push(`Tagline: ${businessInfo.tagline}`);
  }

  if (businessInfo.businessDescription) {
    parts.push(`Description: ${businessInfo.businessDescription}`);
  }

  if (businessInfo.keyFeatures.length > 0) {
    parts.push(`Key Features: ${businessInfo.keyFeatures.slice(0, 5).join(', ')}`);
  }

  pageContents.forEach((content, pageType) => {
    const preview = content.slice(0, 500);
    parts.push(`\n${pageType.toUpperCase()} Page Preview:\n${preview}...`);
  });

  return parts.join('\n\n');
}

/**
 * Analyzes scraped pages and synthesizes content
 */
export async function analyzeScrapedWebsite(pages: DiscoveredPage[]): Promise<AnalyzedWebsite> {
  if (pages.length === 0) {
    throw new Error('No pages to analyze');
  }

  const homepage = pages.find(p => p.pageType === 'homepage');
  if (!homepage) {
    throw new Error('Homepage not found in scraped pages');
  }

  // Extract business info from homepage
  console.log('[CONTENT EXTRACTION] Starting business info extraction from homepage...');

  // Check if LLM extraction is enabled and ready
  let businessInfo: ExtractedBusinessInfo;
  if (isLLMExtractionReady()) {
    console.log('[CONTENT EXTRACTION] Using LLM-based extraction');
    try {
      businessInfo = await extractBusinessInfoWithLLM(homepage.html, homepage.url);
    } catch (error: unknown) {
      console.error('[CONTENT EXTRACTION] LLM extraction failed, falling back to algorithmic extraction');
      businessInfo = extractBusinessInfo(homepage.html, homepage.url);
    }
  } else {
    console.log('[CONTENT EXTRACTION] Using algorithmic extraction (LLM not enabled)');
    businessInfo = extractBusinessInfo(homepage.html, homepage.url);
  }

  // Log logo extraction result
  if (businessInfo.logoUrl) {
    console.log(`[LOGO EXTRACTION] ✅ Logo found in extracted business info: ${businessInfo.logoUrl}`);
  } else {
    console.log('[LOGO EXTRACTION] ❌ No logo found in extracted business info');
    console.log('[LOGO EXTRACTION] Checking for fallback methods...');

    // Log other extracted info for context
    console.log(`[LOGO EXTRACTION] Other extracted data:`);
    console.log(`[LOGO EXTRACTION]   - Site title: ${businessInfo.siteTitle || '(none)'}`);
    console.log(`[LOGO EXTRACTION]   - Brand colors: ${businessInfo.brandColors?.length || 0} found`);
    console.log(`[LOGO EXTRACTION]   - Favicon: ${businessInfo.favicon || '(none)'}`);
  }

  // Log hero image extraction result
  if (businessInfo.heroSection?.backgroundImage) {
    console.log(`[HERO IMAGE EXTRACTION] ✅ Hero image found in extracted business info:`);
    console.log(`[HERO IMAGE EXTRACTION]    URL: ${businessInfo.heroSection.backgroundImage}`);
    if (businessInfo.heroSection.headline) {
      console.log(`[HERO IMAGE EXTRACTION]    Hero headline: ${businessInfo.heroSection.headline.substring(0, 60)}${businessInfo.heroSection.headline.length > 60 ? '...' : ''}`);
    }
  } else {
    console.log('[HERO IMAGE EXTRACTION] ⚠️  No hero image found in extracted business info');
    if (businessInfo.heroSection?.headline) {
      console.log(`[HERO IMAGE EXTRACTION]    Hero section found but no background image`);
      console.log(`[HERO IMAGE EXTRACTION]    Hero headline: ${businessInfo.heroSection.headline.substring(0, 60)}${businessInfo.heroSection.headline.length > 60 ? '...' : ''}`);
    } else {
      console.log('[HERO IMAGE EXTRACTION]    No hero section found at all');
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[HERO IMAGE EXTRACTION] 💡 TIP: Check saved HTML in .tmp/scrapes/ for manual inspection');
    }
  }

  // Extract clean text from each page
  const pageContents = new Map<string, string>();
  pages.forEach(page => {
    const cleanText = extractCleanText(page.html);
    if (cleanText.length > 50) { // Only include if substantial content
      pageContents.set(page.pageType, cleanText);
    }
  });

  // Recommend pages to generate
  const recommendedPages = recommendPagesToGenerate(pages);

  // Create summary
  const contentSummary = createContentSummary(businessInfo, pageContents);

  return {
    baseUrl: homepage.url,
    businessInfo,
    pageContents,
    recommendedPages,
    contentSummary,
  };
}

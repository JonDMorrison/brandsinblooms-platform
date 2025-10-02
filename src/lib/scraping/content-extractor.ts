import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';

export interface ExtractedBusinessInfo {
  // Contact Information
  emails: string[];
  phones: string[];
  addresses: string[];

  // Business Hours
  hours?: Record<string, { open: string | null; close: string | null; closed: boolean }>;

  // Social Media
  socialLinks: Array<{ platform: string; url: string }>;

  // Location
  coordinates?: { lat: number; lng: number };

  // Branding
  logoUrl?: string;
  brandColors: string[];

  // Content
  businessDescription?: string;
  tagline?: string;
  keyFeatures: string[];

  // Hero Section
  heroSection?: {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImage?: string;
  };

  // Metadata
  siteTitle?: string;
  siteDescription?: string;
  favicon?: string;

  // Structured Content (preserved from scraped site)
  structuredContent?: {
    businessHours?: Array<{
      day: string;
      hours: string;
      closed: boolean;
    }>;
    services?: Array<{
      name: string;
      description?: string;
      price?: string;
      duration?: string;
    }>;
    testimonials?: Array<{
      name?: string;
      role?: string;
      content: string;
      rating?: number;
    }>;
  };
}

/**
 * Extracts email addresses from HTML
 */
function extractEmails($: CheerioAPI): string[] {
  const emails = new Set<string>();
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

  // Check mailto links
  $('a[href^="mailto:"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const email = href.replace('mailto:', '').split('?')[0];
      if (email && emailRegex.test(email)) {
        emails.add(email.toLowerCase());
      }
    }
  });

  // Check text content
  const bodyText = $('body').text();
  const matches = bodyText.match(emailRegex);
  if (matches) {
    matches.forEach(email => {
      // Filter out common false positives
      if (!email.endsWith('.png') && !email.endsWith('.jpg') && !email.includes('example')) {
        emails.add(email.toLowerCase());
      }
    });
  }

  return Array.from(emails).slice(0, 5); // Limit to 5
}

/**
 * Extracts phone numbers from HTML
 */
function extractPhones($: CheerioAPI): string[] {
  const phones = new Set<string>();

  // Check tel links
  $('a[href^="tel:"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const phone = href.replace('tel:', '').trim();
      phones.add(phone);
    }
  });

  // Check text content with common phone patterns
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const bodyText = $('body').text();
  const matches = bodyText.match(phoneRegex);
  if (matches) {
    matches.forEach(phone => phones.add(phone.trim()));
  }

  return Array.from(phones).slice(0, 3); // Limit to 3
}

/**
 * Extracts physical addresses using common patterns
 */
function extractAddresses($: CheerioAPI): string[] {
  const addresses = new Set<string>();

  // Look for structured data (schema.org)
  $('[itemtype*="schema.org/PostalAddress"]').each((_, element) => {
    const street = $(element).find('[itemprop="streetAddress"]').text().trim();
    const city = $(element).find('[itemprop="addressLocality"]').text().trim();
    const state = $(element).find('[itemprop="addressRegion"]').text().trim();
    const zip = $(element).find('[itemprop="postalCode"]').text().trim();

    if (street || city) {
      addresses.add([street, city, state, zip].filter(Boolean).join(', '));
    }
  });

  // Look for address-related elements
  const addressSelectors = [
    '[class*="address"]',
    '[id*="address"]',
    'address',
  ];

  addressSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      // Simple heuristic: contains digits and common address words
      if (text.length > 10 && text.length < 200 && /\d/.test(text) &&
          (/street|st\b|avenue|ave\b|road|rd\b|boulevard|blvd|drive|dr\b/i.test(text))) {
        addresses.add(text);
      }
    });
  });

  return Array.from(addresses).slice(0, 2); // Limit to 2
}

/**
 * Extracts social media links
 */
function extractSocialLinks($: CheerioAPI): Array<{ platform: string; url: string }> {
  const socialLinks: Array<{ platform: string; url: string }> = [];
  const platforms = [
    { name: 'facebook', pattern: /facebook\.com/ },
    { name: 'twitter', pattern: /twitter\.com|x\.com/ },
    { name: 'instagram', pattern: /instagram\.com/ },
    { name: 'linkedin', pattern: /linkedin\.com/ },
    { name: 'youtube', pattern: /youtube\.com/ },
    { name: 'pinterest', pattern: /pinterest\.com/ },
    { name: 'tiktok', pattern: /tiktok\.com/ },
  ];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    for (const { name, pattern } of platforms) {
      if (pattern.test(href)) {
        socialLinks.push({ platform: name, url: href });
        break;
      }
    }
  });

  // Deduplicate by platform (keep first occurrence)
  const seen = new Set<string>();
  return socialLinks.filter(link => {
    if (seen.has(link.platform)) return false;
    seen.add(link.platform);
    return true;
  });
}

/**
 * Extracts logo URL from page
 */
function extractLogo($: CheerioAPI, baseUrl: string): string | undefined {
  // Try common logo selectors
  const logoSelectors = [
    'img[class*="logo"]',
    'img[id*="logo"]',
    '.logo img',
    '#logo img',
    'header img:first',
    '.site-logo img',
    '[class*="brand"] img',
  ];

  for (const selector of logoSelectors) {
    const img = $(selector).first();
    if (img.length) {
      const src = img.attr('src');
      if (src) {
        try {
          return new URL(src, baseUrl).href;
        } catch {
          return undefined;
        }
      }
    }
  }

  return undefined;
}

/**
 * Extracts brand colors from CSS
 */
function extractBrandColors(html: string): string[] {
  const colors = new Set<string>();
  const hexColorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;

  // Extract from style tags
  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatches) {
    styleMatches.forEach(styleTag => {
      const matches = styleTag.match(hexColorRegex);
      if (matches) {
        matches.forEach(color => colors.add(color.toLowerCase()));
      }
    });
  }

  // Extract from inline styles
  const inlineMatches = html.match(/style="[^"]*"/gi);
  if (inlineMatches) {
    inlineMatches.forEach(inlineStyle => {
      const matches = inlineStyle.match(hexColorRegex);
      if (matches) {
        matches.forEach(color => colors.add(color.toLowerCase()));
      }
    });
  }

  // Filter out common colors (white, black, gray)
  const commonColors = ['#ffffff', '#fff', '#000000', '#000', '#cccccc', '#ccc'];
  const filtered = Array.from(colors).filter(color => !commonColors.includes(color));

  return filtered.slice(0, 5); // Top 5 unique colors
}

/**
 * Extracts key features or selling points
 */
function extractKeyFeatures($: CheerioAPI): string[] {
  const features: string[] = [];

  // Look for feature lists
  const featureSelectors = [
    '[class*="feature"] li',
    '[class*="benefit"] li',
    '[class*="service"] li',
    '[class*="highlight"] li',
  ];

  featureSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 5 && text.length < 200) {
        features.push(text);
      }
    });
  });

  return features.slice(0, 10); // Top 10 features
}

/**
 * Extracts business description from common locations
 */
function extractBusinessDescription($: CheerioAPI): string | undefined {
  // Try meta description first
  const metaDescription = $('meta[name="description"]').attr('content');
  if (metaDescription && metaDescription.length > 20) {
    return metaDescription.trim();
  }

  // Try structured data
  const schemaDescription = $('[itemtype*="schema.org/Organization"] [itemprop="description"]').text().trim();
  if (schemaDescription && schemaDescription.length > 20) {
    return schemaDescription;
  }

  // Try common description elements
  const descriptionSelectors = [
    '[class*="description"]:first',
    '[class*="about"]:first p:first',
    '[class*="intro"]:first p:first',
  ];

  for (const selector of descriptionSelectors) {
    const text = $(selector).text().trim();
    if (text.length > 20 && text.length < 500) {
      return text;
    }
  }

  return undefined;
}

/**
 * Extracts hero section content from common locations
 * This captures the main headline, subheadline, CTA, and background image
 */
function extractHeroSection($: CheerioAPI, baseUrl: string): ExtractedBusinessInfo['heroSection'] {
  const heroSection: ExtractedBusinessInfo['heroSection'] = {};

  // Common hero section selectors
  const heroSelectors = [
    '.hero',
    '#hero',
    '[class*="hero"]',
    '.banner',
    '.jumbotron',
    '.header-content',
    '.masthead',
    '[class*="landing"]',
    '[class*="showcase"]',
    'header section:first',
    'main > section:first',
    'section:first-of-type',
  ];

  // Find the hero section
  let $hero: ReturnType<typeof $> | null = null;
  for (const selector of heroSelectors) {
    const element = $(selector).first();
    if (element.length && element.find('h1, h2').length) {
      $hero = element;
      break;
    }
  }

  // If no hero section found, try to get h1 from the top of the page
  if (!$hero) {
    const firstH1 = $('body h1').first();
    if (firstH1.length) {
      $hero = firstH1.parent();
    }
  }

  if ($hero) {
    // Extract headline (h1 or first h2)
    const h1 = $hero.find('h1').first().text().trim();
    const h2AsHeadline = !h1 && $hero.find('h2').first().text().trim();
    heroSection.headline = h1 || h2AsHeadline || undefined;

    // Extract subheadline (h2 following h1, or p following h1, or elements with subtitle/tagline classes)
    if (heroSection.headline) {
      // Look for h2 if we used h1 as headline
      if (h1) {
        const h2 = $hero.find('h2').first().text().trim();
        if (h2) {
          heroSection.subheadline = h2;
        }
      }

      // If no h2, look for subtitle/tagline classes
      if (!heroSection.subheadline) {
        const subtitleSelectors = [
          '[class*="subtitle"]',
          '[class*="tagline"]',
          '[class*="subhead"]',
          '[class*="lead"]',
          '.hero p:first',
          'h1 + p',
          'h2 + p',
        ];

        for (const selector of subtitleSelectors) {
          const text = $hero.find(selector).first().text().trim();
          if (text && text.length > 10 && text.length < 200) {
            heroSection.subheadline = text;
            break;
          }
        }
      }
    }

    // Extract CTA button
    const ctaSelectors = [
      'a.btn-primary',
      'button.btn-primary',
      'a.button',
      'button.button',
      'a[class*="cta"]',
      'button[class*="cta"]',
      'a.btn:first',
      'button:first',
    ];

    for (const selector of ctaSelectors) {
      const $cta = $hero.find(selector).first();
      if ($cta.length) {
        const ctaText = $cta.text().trim();
        if (ctaText && ctaText.length > 2 && ctaText.length < 50) {
          heroSection.ctaText = ctaText;

          // Get CTA link if it's an anchor tag
          if ($cta.is('a')) {
            const href = $cta.attr('href');
            if (href) {
              try {
                heroSection.ctaLink = new URL(href, baseUrl).href;
              } catch {
                heroSection.ctaLink = href;
              }
            }
          }
          break;
        }
      }
    }

    // Extract background image
    // First check inline styles
    const styleAttr = $hero.attr('style');
    if (styleAttr) {
      const bgImageMatch = styleAttr.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
      if (bgImageMatch && bgImageMatch[1]) {
        try {
          heroSection.backgroundImage = new URL(bgImageMatch[1], baseUrl).href;
        } catch {
          heroSection.backgroundImage = bgImageMatch[1];
        }
      }
    }

    // Check for img tags in hero if no background image found
    if (!heroSection.backgroundImage) {
      const $heroImg = $hero.find('img').first();
      if ($heroImg.length) {
        const src = $heroImg.attr('src');
        if (src) {
          try {
            heroSection.backgroundImage = new URL(src, baseUrl).href;
          } catch {
            heroSection.backgroundImage = src;
          }
        }
      }
    }
  }

  // Only return the section if we found at least a headline
  return heroSection.headline ? heroSection : undefined;
}

/**
 * Extracts business hours from HTML
 */
function extractBusinessHours($: CheerioAPI): ExtractedBusinessInfo['structuredContent']['businessHours'] {
  const businessHours: Array<{ day: string; hours: string; closed: boolean }> = [];
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const shortDayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // Try to find schema.org OpeningHoursSpecification
  const schemaHours = $('[itemtype*="schema.org/OpeningHoursSpecification"]');
  if (schemaHours.length) {
    schemaHours.each((_, element) => {
      const $el = $(element);
      const dayOfWeek = $el.find('[itemprop="dayOfWeek"]').text().trim();
      const opens = $el.find('[itemprop="opens"]').attr('content') || $el.find('[itemprop="opens"]').text().trim();
      const closes = $el.find('[itemprop="closes"]').attr('content') || $el.find('[itemprop="closes"]').text().trim();

      if (dayOfWeek) {
        businessHours.push({
          day: dayOfWeek,
          hours: opens && closes ? `${opens} - ${closes}` : 'Closed',
          closed: !opens || !closes
        });
      }
    });
  }

  // If no schema.org data, look for common hour patterns
  if (businessHours.length === 0) {
    const hoursSelectors = [
      '.hours',
      '.business-hours',
      '[class*="hours"]',
      '[id*="hours"]',
      '.opening-hours',
      '.store-hours',
      'footer [class*="hour"]',
      'aside [class*="hour"]'
    ];

    for (const selector of hoursSelectors) {
      const $hoursContainer = $(selector).first();
      if ($hoursContainer.length) {
        const hoursText = $hoursContainer.text();

        // Look for day-time patterns
        dayNames.forEach((day, index) => {
          const dayRegex = new RegExp(`(${day}|${shortDayNames[index]})\\s*:?\\s*([\\d:\\s-]+(?:am|pm)?|closed)`, 'gi');
          const match = dayRegex.exec(hoursText);
          if (match) {
            const hours = match[2].trim();
            businessHours.push({
              day: day.charAt(0).toUpperCase() + day.slice(1),
              hours: hours.toLowerCase() === 'closed' ? 'Closed' : hours,
              closed: hours.toLowerCase() === 'closed'
            });
          }
        });

        // Also try to find table structures
        const $rows = $hoursContainer.find('tr, li');
        if ($rows.length) {
          $rows.each((_, row) => {
            const text = $(row).text().trim();
            dayNames.forEach((day, index) => {
              if (text.toLowerCase().includes(day) || text.toLowerCase().includes(shortDayNames[index])) {
                const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
                if (timeMatch) {
                  businessHours.push({
                    day: day.charAt(0).toUpperCase() + day.slice(1),
                    hours: `${timeMatch[1]} - ${timeMatch[2]}`,
                    closed: false
                  });
                } else if (text.toLowerCase().includes('closed')) {
                  businessHours.push({
                    day: day.charAt(0).toUpperCase() + day.slice(1),
                    hours: 'Closed',
                    closed: true
                  });
                }
              }
            });
          });
        }

        if (businessHours.length > 0) break;
      }
    }

    // Look for a general hours pattern (e.g., "Mon-Fri: 9am-5pm")
    if (businessHours.length === 0) {
      const generalHoursRegex = /(mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday)[\s-]*(mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday)?:?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi;
      const bodyText = $('body').text();
      let match;

      while ((match = generalHoursRegex.exec(bodyText)) !== null) {
        const startDay = match[1];
        const endDay = match[2] || startDay;
        const openTime = match[3];
        const closeTime = match[4];

        // For simplicity, just record the range as a single entry
        businessHours.push({
          day: `${startDay}${endDay ? `-${endDay}` : ''}`,
          hours: `${openTime} - ${closeTime}`,
          closed: false
        });
      }
    }
  }

  // Remove duplicates and limit to reasonable number
  const uniqueHours = Array.from(new Map(
    businessHours.map(h => [`${h.day}-${h.hours}`, h])
  ).values()).slice(0, 7);

  return uniqueHours.length > 0 ? uniqueHours : undefined;
}

/**
 * Extracts services with pricing from HTML
 */
function extractServices($: CheerioAPI): ExtractedBusinessInfo['structuredContent']['services'] {
  const services: Array<{ name: string; description?: string; price?: string; duration?: string }> = [];

  // Look for schema.org Service or Product markup
  const schemaServices = $('[itemtype*="schema.org/Service"], [itemtype*="schema.org/Product"]');
  schemaServices.each((_, element) => {
    const $el = $(element);
    const name = $el.find('[itemprop="name"]').text().trim();
    const description = $el.find('[itemprop="description"]').text().trim();
    const price = $el.find('[itemprop="price"]').text().trim() ||
                  $el.find('[itemprop="offers"] [itemprop="price"]').text().trim();

    if (name) {
      services.push({
        name,
        description: description || undefined,
        price: price || undefined
      });
    }
  });

  // Look for common service/pricing patterns
  if (services.length === 0) {
    const serviceSelectors = [
      '.service-item',
      '.price-card',
      '.pricing-item',
      '[class*="service"]',
      '[class*="pricing"]',
      '.menu-item',
      '.package',
      '.treatment'
    ];

    for (const selector of serviceSelectors) {
      $(selector).each((_, element) => {
        const $item = $(element);

        // Look for title/name
        const nameSelectors = ['h3', 'h4', 'h5', '.title', '.name', '.service-name', '.item-title'];
        let name = '';
        for (const nameSelector of nameSelectors) {
          const found = $item.find(nameSelector).first().text().trim();
          if (found) {
            name = found;
            break;
          }
        }

        // Look for price
        const priceSelectors = ['.price', '.cost', '[class*="price"]', '.rate', '.fee'];
        let price = '';
        for (const priceSelector of priceSelectors) {
          const found = $item.find(priceSelector).first().text().trim();
          if (found && (found.includes('$') || found.match(/\d/))) {
            price = found;
            break;
          }
        }

        // Look for description
        const descSelectors = ['p', '.description', '.desc', '.details', '.info'];
        let description = '';
        for (const descSelector of descSelectors) {
          const found = $item.find(descSelector).first().text().trim();
          if (found && found.length > 10 && found.length < 300) {
            description = found;
            break;
          }
        }

        // Look for duration
        const durationRegex = /(\d+\s*(?:hour|hr|minute|min|day|week|month)s?)/i;
        const itemText = $item.text();
        const durationMatch = itemText.match(durationRegex);
        const duration = durationMatch ? durationMatch[1] : undefined;

        if (name && (price || description)) {
          services.push({
            name,
            description: description || undefined,
            price: price || undefined,
            duration
          });
        }
      });

      if (services.length > 0) break;
    }
  }

  // Look for pricing tables
  if (services.length === 0) {
    $('table').each((_, table) => {
      const $table = $(table);
      const text = $table.text().toLowerCase();

      // Check if this looks like a pricing table
      if (text.includes('price') || text.includes('cost') || text.includes('service') || text.includes('$')) {
        $table.find('tr').each((index, row) => {
          if (index === 0) return; // Skip header row

          const $cells = $(row).find('td, th');
          if ($cells.length >= 2) {
            const name = $cells.eq(0).text().trim();
            const priceCell = $cells.eq($cells.length - 1).text().trim();
            const descCell = $cells.length > 2 ? $cells.eq(1).text().trim() : '';

            if (name && priceCell && (priceCell.includes('$') || priceCell.match(/\d/))) {
              services.push({
                name,
                description: descCell || undefined,
                price: priceCell
              });
            }
          }
        });
      }
    });
  }

  // Remove duplicates and limit
  const uniqueServices = Array.from(new Map(
    services.map(s => [s.name, s])
  ).values()).slice(0, 20); // Limit to 20 services

  return uniqueServices.length > 0 ? uniqueServices : undefined;
}

/**
 * Extracts testimonials from HTML
 */
function extractTestimonials($: CheerioAPI): ExtractedBusinessInfo['structuredContent']['testimonials'] {
  const testimonials: Array<{ name?: string; role?: string; content: string; rating?: number }> = [];

  // Look for schema.org Review markup
  const schemaReviews = $('[itemtype*="schema.org/Review"]');
  schemaReviews.each((_, element) => {
    const $el = $(element);
    const content = $el.find('[itemprop="reviewBody"], [itemprop="description"]').text().trim();
    const author = $el.find('[itemprop="author"]').text().trim();
    const ratingValue = $el.find('[itemprop="ratingValue"]').attr('content') ||
                       $el.find('[itemprop="ratingValue"]').text().trim();

    if (content) {
      testimonials.push({
        name: author || undefined,
        content,
        rating: ratingValue ? parseFloat(ratingValue) : undefined
      });
    }
  });

  // Look for common testimonial patterns
  if (testimonials.length === 0) {
    const testimonialSelectors = [
      '.testimonial',
      '.review',
      '.feedback',
      '[class*="testimonial"]',
      '[class*="review"]',
      'blockquote',
      '.quote',
      '.customer-review'
    ];

    for (const selector of testimonialSelectors) {
      $(selector).each((_, element) => {
        const $item = $(element);

        // Look for content
        const contentSelectors = ['p', '.content', '.text', '.quote-text', '.review-text'];
        let content = '';
        for (const contentSelector of contentSelectors) {
          const found = $item.find(contentSelector).first().text().trim();
          if (found && found.length > 20) {
            content = found;
            break;
          }
        }

        // If no nested content found, try the element itself
        if (!content) {
          content = $item.clone().children('.author, .name, .customer').remove().end().text().trim();
        }

        // Look for author name
        const nameSelectors = ['.author', '.name', '.customer', '.reviewer', 'cite', 'footer'];
        let name = '';
        for (const nameSelector of nameSelectors) {
          const found = $item.find(nameSelector).first().text().trim();
          if (found && found.length < 100) {
            name = found;
            break;
          }
        }

        // Look for role/company
        const roleSelectors = ['.role', '.title', '.company', '.position'];
        let role = '';
        for (const roleSelector of roleSelectors) {
          const found = $item.find(roleSelector).first().text().trim();
          if (found && found.length < 100) {
            role = found;
            break;
          }
        }

        // Look for rating (stars)
        let rating: number | undefined;
        const starElements = $item.find('[class*="star"]');
        if (starElements.length) {
          // Count filled stars
          const filledStars = starElements.filter((_, el) => {
            const className = $(el).attr('class') || '';
            return className.includes('filled') || className.includes('active') || className.includes('full');
          }).length;
          if (filledStars > 0) {
            rating = filledStars;
          }
        }

        // Alternative: look for rating text
        if (!rating) {
          const ratingMatch = $item.text().match(/(\d(?:\.\d)?)\s*(?:star|★|⭐)/i);
          if (ratingMatch) {
            rating = parseFloat(ratingMatch[1]);
          }
        }

        if (content && content.length > 20 && content.length < 1000) {
          testimonials.push({
            name: name || undefined,
            role: role || undefined,
            content,
            rating
          });
        }
      });

      if (testimonials.length > 0) break;
    }
  }

  // Remove duplicates and limit
  const uniqueTestimonials = Array.from(new Map(
    testimonials.map(t => [t.content.substring(0, 50), t]) // Use first 50 chars as key
  ).values()).slice(0, 20); // Limit to 20 testimonials

  return uniqueTestimonials.length > 0 ? uniqueTestimonials : undefined;
}

/**
 * Main extraction function
 */
export function extractBusinessInfo(html: string, baseUrl: string): ExtractedBusinessInfo {
  const $ = load(html);

  // Extract structured content for preservation
  const structuredContent: ExtractedBusinessInfo['structuredContent'] = {};

  const businessHours = extractBusinessHours($);
  if (businessHours) {
    structuredContent.businessHours = businessHours;
  }

  const services = extractServices($);
  if (services) {
    structuredContent.services = services;
  }

  const testimonials = extractTestimonials($);
  if (testimonials) {
    structuredContent.testimonials = testimonials;
  }

  return {
    emails: extractEmails($),
    phones: extractPhones($),
    addresses: extractAddresses($),
    socialLinks: extractSocialLinks($),
    logoUrl: extractLogo($, baseUrl),
    brandColors: extractBrandColors(html),
    keyFeatures: extractKeyFeatures($),
    businessDescription: extractBusinessDescription($),
    heroSection: extractHeroSection($, baseUrl),
    siteTitle: $('title').text().trim() || undefined,
    siteDescription: $('meta[name="description"]').attr('content')?.trim() || undefined,
    favicon: $('link[rel*="icon"]').attr('href') || undefined,
    structuredContent: Object.keys(structuredContent).length > 0 ? structuredContent : undefined,
  };
}

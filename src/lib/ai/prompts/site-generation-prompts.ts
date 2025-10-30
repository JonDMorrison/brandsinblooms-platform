/**
 * System and user prompts for LLM-powered site generation
 *
 * This module contains the prompt engineering infrastructure for generating
 * complete websites using LLMs. It provides detailed, structured prompts that
 * guide the LLM to generate high-quality, industry-appropriate content.
 *
 * Prompt Strategy:
 * - Phase 1: Generate site foundation (metadata, branding, theme, hero)
 * - Phase 2: Generate individual page sections in parallel
 * - All prompts emphasize structured JSON output with specific schemas
 * - Content is tailored for garden centers, plant shops, and floral businesses
 */

import { type BusinessInfo, type SiteBranding, type ScrapedWebsiteContext } from '@/lib/types/site-generation-jobs';

/**
 * System prompt for generating site foundation (metadata + theme + hero)
 *
 * This prompt instructs the LLM to generate the core site metadata,
 * branding/theme, and hero section based on business information.
 */
export const SITE_FOUNDATION_SYSTEM_PROMPT = `You are an expert web designer and copywriter specializing in garden centers, plant shops, nurseries, and floral businesses.

Your task is to generate the foundational elements for a website including:
1. Site metadata (name, tagline, description)
2. Branding and theme (colors, fonts, logo description)
3. SEO metadata (title, description, keywords)
4. Hero section (headline, subheadline, CTA)

**IMPORTANT: If the user provided an existing website URL, you will receive analysis of that site. Use this information to:**
1. PRESERVE the core messaging - if hero headline and subheadline are provided, use them as the foundation
2. Only make minor improvements to existing headlines for clarity or impact (do NOT rewrite from scratch)
3. Maintain the authentic voice and tone of the business - this is their established brand
4. Keep all accurate business information exactly as provided (contact details, hours, location)
5. Use the existing brand colors and visual identity as provided
6. Use the existing logo URL if provided
7. For hero CTA text, preserve the original if provided, only improving for clarity if needed

**CRITICAL FONT PRESERVATION RULES:**
When scraped fonts are provided from the existing website, YOU MUST USE THEM EXACTLY:
- If 'fonts' array is provided with font names, use these EXACT fonts - DO NOT generate random fonts
- Use the first font in the list as the heading font
- Use the second font in the list as the body font (or the first if only one is provided)
- Format as: "HeadingFont, BodyFont" (e.g., "Montserrat, Open Sans")
- Only generate default fonts if NO fonts were extracted from the existing site

**FAVICON PRESERVATION:**
- If a favicon URL is provided from the existing site, include it in your logo_description
- Reference it as: "Use existing favicon from: [favicon_url]" at the start of logo_description

**SEO METADATA RULES:**
- If siteTitle is provided, use it as the foundation for your SEO title (you may enhance for SEO)
- If siteDescription is provided, use it as the foundation for your SEO description
- Maintain the brand voice while optimizing for search engines
- If coordinates are provided, consider them for local SEO optimization

**DESIGN SYSTEM PRESERVATION:**
When design tokens are provided from the existing website:
- spacing: Use the EXACT spacing values provided for ALL margins, padding, and gaps
- borderRadius: Use the EXACT radius values for ALL rounded corners (buttons, cards, etc.)
- shadows: Maintain similar elevation hierarchy - don't introduce new shadow styles
- This ensures visual consistency with the existing brand

**IMAGE GALLERIES CONSIDERATION:**
When galleries are detected in the existing site:
- Plan for gallery-heavy layouts in your content generation
- Consider the gallery types (grid, carousel, masonry) when structuring pages
- Ensure sufficient visual space for image content
- The presence of galleries indicates a visual-first business approach

**Dynamic Page Generation:**
- Based on the user's request and any existing website analysis, you may generate between 3 and 8 pages
- Required pages: Home, About, Contact (always generate these)
- Optional pages: Services, Team, FAQ, Testimonials, Blog, Products (generate if relevant)
- If an existing website had specific pages (e.g., "Plant Care Guide", "Our Process"), consider generating equivalent pages

IMPORTANT GUIDELINES:

**JSON Structure:**
You MUST respond with valid JSON matching this exact structure:
{
  "site_name": "Business Name",
  "tagline": "Short memorable slogan (5-8 words)",
  "description": "One sentence describing the business",
  "hero": {
    "headline": "Compelling main headline (5-10 words)",
    "subheadline": "Supporting tagline that expands on headline (10-15 words)",
    "cta_text": "Call to action button text (2-4 words)",
    "background_image": "URL to hero background image (USE EXACT URL if provided from existing site, otherwise describe ideal image)"
  },
  "branding": {
    "primary_color": "#RRGGBB hex color code",
    "secondary_color": "#RRGGBB hex color code",
    "accent_color": "#RRGGBB hex color code",
    "logo_description": "Description of logo concept and style (include favicon URL if provided)",
    "font_family": "HeadingFont, BodyFont (USE EXACT FONTS if provided from existing site)"
  },
  "seo": {
    "title": "SEO-optimized page title (50-60 characters)",
    "description": "SEO meta description (150-160 characters)",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "og_image": "Description of social media preview image"
  }
}

**Content Guidelines:**
- Headlines should be action-oriented and emotionally resonant
- Use natural, conversational language that connects with plant lovers
- Emphasize benefits like beauty, sustainability, expertise, quality
- CTAs should be clear and inviting (e.g., "Explore Our Collection", "Visit Our Nursery")
- Avoid generic corporate language - be warm and authentic

**Color Palette Guidelines:**
- Primary: Main brand color (greens, earthy tones work well for plant businesses)
- Secondary: Complementary color for variety (florals, blues, warm earth tones)
- Accent: High-contrast color for CTAs and highlights (vibrant florals, deep greens)
- Ensure WCAG AA accessibility contrast ratios
- Colors should evoke nature, growth, vitality

**SEO Best Practices:**
- Title should include business name and primary offering
- Description should be compelling and include location if provided
- Keywords should be relevant to the garden/plant industry
- Focus on local SEO if location is provided

**Examples of Good Headlines:**
- "Where Every Garden Tells a Story"
- "Cultivating Beauty, One Plant at a Time"
- "Your Local Experts in Living Color"
- "Bringing Nature Home Since [Year]"

**Examples of Good Taglines:**
- "Grow with us, thrive together"
- "Quality plants, expert care, endless inspiration"
- "From seed to bloom, we're with you"

RESPOND ONLY WITH VALID JSON. Do not include any other text, explanations, or markdown formatting.`;

/**
 * System prompt for generating individual page sections
 *
 * This prompt instructs the LLM to generate specific sections
 * (About, Values, Features, Services, Team, Testimonials, Contact)
 * based on the section type and site theme.
 */
export const PAGE_GENERATION_SYSTEM_PROMPT = `You are an expert web copywriter specializing in garden centers, plant shops, nurseries, and floral businesses.

Your task is to generate compelling, authentic content for a specific section of a website. The content should align with the site's branding and theme, and be tailored to the garden/plant industry.

**CRITICAL: If existing website content is provided:**
- PRESERVE the core message and key phrases - this is the business's authentic voice
- Keep the original tone and style while only fixing obvious errors
- Maintain all factual information exactly as provided (contact details, addresses, hours, prices)
- You may improve flow and readability, but DO NOT completely rewrite
- Fix grammar, spelling, or clarity issues without changing the meaning
- The existing content should be clearly recognizable in your output
- Think of yourself as an editor improving existing copy, NOT a writer creating new copy

IMPORTANT GUIDELINES:

**Content Style:**
- Write in a warm, authentic, and conversational tone
- Emphasize expertise, quality, sustainability, and community
- Use sensory language that evokes the beauty and experience of plants and gardens
- Avoid corporate jargon - sound like a real person who loves plants
- Include specific, concrete details rather than generic statements
- For longer content, use markdown formatting for readability

**Markdown Usage:**
- Use **bold** for emphasis on key points
- Use bullet lists for features, values, or benefits
- Use paragraphs to create natural flow and readability
- Keep paragraphs concise (2-4 sentences)

**Icon Selection:**
- Only use icons from the Lucide icon library
- Choose icons that are meaningful and relevant to the content
- Common good choices for garden businesses:
  - Leaf, Sprout, TreePine, Trees, Flower, Flower2, FlowerIcon
  - Sun, CloudRain, Heart, Star, Award, CheckCircle
  - Users, UserCheck, HandHeart, Smile, ThumbsUp
  - MapPin, Phone, Mail, Clock, Calendar
  - Shield, Sparkles, Zap, TrendingUp

**Authenticity:**
- Create realistic but generic team members (if applicable)
- Create believable testimonials with natural language
- Avoid making specific claims that can't be verified
- Do not include real personal information, phone numbers, or addresses
- Use placeholder contact info that looks realistic

**Section-Specific Guidelines:**

*About Section:*
- Tell a compelling story about the business origin or mission
- Include 2-4 paragraphs of content
- Optional mission/vision statements should be inspiring but grounded
- Emphasize what makes the business unique

*Values Section:*
- Generate 3-6 core values
- Each value needs: title, description (2-3 sentences), and relevant icon
- Values should reflect the garden/plant industry (sustainability, expertise, community, quality, etc.)

*Features Section:*
- Generate 4-8 features that make the business stand out
- Each feature needs: title, description (1-2 sentences), and icon
- Focus on concrete benefits and services

*Services Section:*
- Generate 3-6 key services offered
- Each service needs: name (required), description (required)
- Price and duration are OPTIONAL - only include if naturally relevant
- IMPORTANT: If price is unknown or not applicable, DO NOT include the price field
- IMPORTANT: If duration is unknown or not applicable, DO NOT include the duration field
- Be specific to garden centers (plant care, landscaping, workshops, delivery, etc.)
- Use null or omit fields rather than making up values

*Team Section:*
- Generate 3-6 team members
- Each needs: name, role, bio (2-3 sentences), optional image description
- Create realistic names and roles (Owner, Head Gardener, Design Specialist, etc.)
- Bios should highlight expertise and personality

*Testimonials Section:*
- Generate 4-8 customer testimonials
- Each needs: name (required), content (required, 2-3 sentences)
- Role/company is OPTIONAL - only include if it adds value
- Rating is OPTIONAL - default to 5 if not specified, or omit entirely
- IMPORTANT: If role is unknown, DO NOT include the role field
- IMPORTANT: If rating is not relevant, DO NOT include the rating field
- Sound like real people, not marketing copy
- Include specific details about products or services
- For anonymous reviews, you can use generic names like "Garden Enthusiast" or "Local Customer"

*Contact Section:*
- ALWAYS generate a contact section with at least a title field
- Include email ONLY if explicitly provided in the business information (do not create placeholders)
- Include phone ONLY if explicitly provided in the business information (do not create placeholders)
- Include address ONLY if explicitly provided in the business information (do not create placeholders or use location field as address)
- Include business hours ONLY if explicitly provided (do not create default hours)
- If no contact information is provided, return JSON with just the title: {"title": "Contact Us"}
- Do NOT create placeholder, fake, or example contact information

RESPOND ONLY WITH VALID JSON matching the schema for the requested section type. Do not include any other text, explanations, or markdown formatting around the JSON.`;

/**
 * Build user prompt for foundation generation (Phase 1)
 *
 * @param businessInfo - Business information from user input
 * @returns Formatted user prompt for foundation generation
 *
 * @example
 * ```typescript
 * const prompt = buildFoundationPrompt({
 *   prompt: "Create a website for my plant shop",
 *   name: "Green Thumb Gardens",
 *   location: "Portland, OR",
 *   industry: "garden center"
 * });
 * ```
 */
export function buildFoundationPrompt(businessInfo: BusinessInfo): string {
  const parts: string[] = [];

  // Start with the user's natural language prompt
  parts.push(`User Request: ${businessInfo.prompt}`);
  parts.push('');

  // Add structured business information
  parts.push('Business Information:');
  parts.push(`- Name: ${businessInfo.name}`);

  if (businessInfo.industry) {
    parts.push(`- Industry: ${businessInfo.industry}`);
  }

  if (businessInfo.location) {
    parts.push(`- Location: ${businessInfo.location}`);
  }

  if (businessInfo.description) {
    parts.push(`- Description: ${businessInfo.description}`);
  }

  if (businessInfo.email) {
    parts.push(`- Email: ${businessInfo.email}`);
  }

  if (businessInfo.phone) {
    parts.push(`- Phone: ${businessInfo.phone}`);
  }

  if (businessInfo.website) {
    parts.push(`- Existing Website: ${businessInfo.website}`);
  }

  // Add any additional details
  if (businessInfo.additionalDetails && Object.keys(businessInfo.additionalDetails).length > 0) {
    parts.push('');
    parts.push('Additional Details:');
    for (const [key, value] of Object.entries(businessInfo.additionalDetails)) {
      parts.push(`- ${key}: ${String(value)}`);
    }
  }

  parts.push('');
  parts.push('Generate the site foundation (metadata, branding, SEO, hero) as structured JSON.');

  return parts.join('\n');
}

/**
 * Build enhanced user prompt for foundation generation with scraped website context (Phase 1)
 *
 * @param businessInfo - Business information from user input
 * @param scrapedContext - Optional scraped website data for enhanced context
 * @returns Formatted user prompt for foundation generation with website context
 *
 * @example
 * ```typescript
 * const prompt = buildFoundationPromptWithContext(
 *   {
 *     prompt: "Modernize my garden center website",
 *     name: "Green Thumb Gardens",
 *     location: "Portland, OR"
 *   },
 *   {
 *     baseUrl: "https://oldsite.com",
 *     businessInfo: {
 *       emails: ["contact@oldsite.com"],
 *       brandColors: ["#2D5F3F", "#8B4513"]
 *     },
 *     contentSummary: "Garden center with 30 years experience..."
 *   }
 * );
 * ```
 */
export function buildFoundationPromptWithContext(
  businessInfo: BusinessInfo,
  scrapedContext?: ScrapedWebsiteContext
): string {
  const sections: string[] = [];

  // User's original request
  sections.push(`User Request: ${businessInfo.prompt}`);
  sections.push('');

  // Basic business information
  sections.push('Business Information:');
  sections.push(`- Name: ${businessInfo.name}`);
  if (businessInfo.industry) sections.push(`- Industry: ${businessInfo.industry}`);
  if (businessInfo.location) sections.push(`- Location: ${businessInfo.location}`);
  if (businessInfo.description) sections.push(`- Description: ${businessInfo.description}`);

  // Use scraped contact info if available, otherwise use provided
  if (scrapedContext?.businessInfo.emails?.length) {
    sections.push(`- Email: ${scrapedContext.businessInfo.emails[0]}`);
  } else if (businessInfo.email) {
    sections.push(`- Email: ${businessInfo.email}`);
  }

  if (scrapedContext?.businessInfo.phones?.length) {
    sections.push(`- Phone: ${scrapedContext.businessInfo.phones[0]}`);
  } else if (businessInfo.phone) {
    sections.push(`- Phone: ${businessInfo.phone}`);
  }

  if (businessInfo.website) sections.push(`- Existing Website: ${businessInfo.website}`);
  sections.push('');

  // Scraped website context (if available)
  if (scrapedContext) {
    sections.push('=== EXISTING WEBSITE ANALYSIS ===');
    sections.push('The user has an existing website that we analyzed. PRESERVE the core messaging while improving presentation.');
    sections.push('');

    // Hero section - MOST IMPORTANT TO PRESERVE
    if (scrapedContext.businessInfo.heroSection) {
      sections.push('*** HERO SECTION FROM EXISTING SITE (PRESERVE THIS) ***');
      if (scrapedContext.businessInfo.heroSection.headline) {
        sections.push(`Existing Hero Headline: "${scrapedContext.businessInfo.heroSection.headline}"`);
        sections.push('^ Use this as your hero headline, only making minor improvements if needed');
      }
      if (scrapedContext.businessInfo.heroSection.subheadline) {
        sections.push(`Existing Hero Subheadline: "${scrapedContext.businessInfo.heroSection.subheadline}"`);
        sections.push('^ Use this as your hero subheadline, preserving the message');
      }
      if (scrapedContext.businessInfo.heroSection.ctaText) {
        sections.push(`Existing Hero CTA: "${scrapedContext.businessInfo.heroSection.ctaText}"`);
        sections.push('^ Keep this CTA text or make only minor improvements');
      }
      if (scrapedContext.businessInfo.heroSection.backgroundImage) {
        sections.push(`Existing Hero Background Image: ${scrapedContext.businessInfo.heroSection.backgroundImage}`);
        sections.push('^ USE THIS EXACT URL in hero.background_image field (do not describe, use the URL as-is)');
      }
      sections.push('');
    }

    // Branding from existing site
    if (scrapedContext.businessInfo.brandColors?.length) {
      sections.push('Existing Brand Colors (use these):');
      scrapedContext.businessInfo.brandColors.forEach(color => {
        sections.push(`- ${color}`);
      });
      sections.push('');
    }

    // FONTS - CRITICAL FOR BRAND CONSISTENCY
    if (scrapedContext.businessInfo.fonts?.length) {
      sections.push('*** EXISTING WEBSITE FONTS (MUST USE EXACTLY) ***');
      sections.push('These fonts were extracted from the existing website. YOU MUST USE THEM:');
      scrapedContext.businessInfo.fonts.forEach((font, index) => {
        if (index === 0) {
          sections.push(`- Heading Font: "${font}" (use for headings)`);
        } else if (index === 1) {
          sections.push(`- Body Font: "${font}" (use for body text)`);
        } else {
          sections.push(`- Additional Font: "${font}"`);
        }
      });
      sections.push('^ Format in branding as: "HeadingFont, BodyFont"');
      sections.push('DO NOT generate random fonts when these are provided!');
      sections.push('');
    }

    // FAVICON
    if (scrapedContext.businessInfo.favicon) {
      sections.push(`Existing Favicon URL: ${scrapedContext.businessInfo.favicon}`);
      sections.push('^ Include this in your logo_description as: "Use existing favicon from: [url]"');
      sections.push('');
    }

    if (scrapedContext.businessInfo.logoUrl) {
      sections.push(`Existing Logo: ${scrapedContext.businessInfo.logoUrl}`);
      sections.push('(Reference this logo URL in your output)');
      sections.push('');
    }

    // SEO METADATA FROM EXISTING SITE
    if (scrapedContext.businessInfo.siteTitle || scrapedContext.businessInfo.siteDescription) {
      sections.push('*** EXISTING SITE SEO METADATA (USE AS FOUNDATION) ***');
      if (scrapedContext.businessInfo.siteTitle) {
        sections.push(`Original Site Title: "${scrapedContext.businessInfo.siteTitle}"`);
        sections.push('^ Use this as the foundation for your SEO title - enhance but preserve the core message');
      }
      if (scrapedContext.businessInfo.siteDescription) {
        sections.push(`Original Site Description: "${scrapedContext.businessInfo.siteDescription}"`);
        sections.push('^ Use this as the foundation for your SEO description - improve for SEO while maintaining voice');
      }
      sections.push('');
    }

    // LOCATION COORDINATES (for local SEO)
    if (scrapedContext.businessInfo.coordinates) {
      sections.push('Location Coordinates:');
      sections.push(`- Latitude: ${scrapedContext.businessInfo.coordinates.lat}`);
      sections.push(`- Longitude: ${scrapedContext.businessInfo.coordinates.lng}`);
      sections.push('(Consider these for local SEO optimization and location-based features)');
      sections.push('');
    }

    // DESIGN SYSTEM TOKENS (NEW)
    if (scrapedContext.businessInfo.designTokens) {
      sections.push('*** DESIGN SYSTEM TOKENS FROM EXISTING SITE ***');
      sections.push('The following design tokens were extracted from the existing site. USE THESE for consistency:');
      sections.push('');

      if (scrapedContext.businessInfo.designTokens.spacing) {
        const { spacing } = scrapedContext.businessInfo.designTokens;
        sections.push(`Spacing Scale (${spacing.unit}):`);
        sections.push(`Values: ${spacing.values.join(', ')}`);
        sections.push('^ Use these EXACT spacing values for margins, padding, and gaps throughout the site');
        sections.push('');
      }

      if (scrapedContext.businessInfo.designTokens.borderRadius) {
        sections.push('Border Radius Values:');
        sections.push(`${scrapedContext.businessInfo.designTokens.borderRadius.values.join(', ')}`);
        sections.push('^ Use these EXACT radius values for rounded corners to maintain consistency');
        sections.push('');
      }

      if (scrapedContext.businessInfo.designTokens.shadows) {
        sections.push(`Shadow Patterns: Found ${scrapedContext.businessInfo.designTokens.shadows.length} shadow patterns`);
        sections.push('^ Apply similar depth and elevation patterns for consistency');
        sections.push('');
      }
    }

    // IMAGE GALLERIES (NEW)
    if (scrapedContext.businessInfo.galleries && scrapedContext.businessInfo.galleries.length > 0) {
      const totalImages = scrapedContext.businessInfo.galleries.reduce((sum, g) => sum + g.images.length, 0);
      sections.push('*** IMAGE GALLERIES FROM EXISTING SITE ***');
      sections.push(`Found ${scrapedContext.businessInfo.galleries.length} galleries with ${totalImages} total images`);

      scrapedContext.businessInfo.galleries.forEach((gallery, index) => {
        sections.push('');
        sections.push(`Gallery ${index + 1}:`);
        sections.push(`- Type: ${gallery.type}`);
        sections.push(`- Images: ${gallery.images.length}`);
        if (gallery.title) sections.push(`- Title: ${gallery.title}`);
        if (gallery.columns) sections.push(`- Columns: ${gallery.columns}`);
      });

      sections.push('');
      sections.push('^ Consider creating similar gallery layouts when generating content');
      sections.push('^ This indicates the business uses visual content heavily - ensure your design accommodates galleries');
      sections.push('');
    }

    // Social media presence
    if (scrapedContext.businessInfo.socialLinks?.length) {
      sections.push('Social Media Links:');
      scrapedContext.businessInfo.socialLinks.forEach(({ platform, url }) => {
        sections.push(`- ${platform}: ${url}`);
      });
      sections.push('');
    }

    // Additional contact info
    if (scrapedContext.businessInfo.addresses?.length) {
      sections.push('Business Address:');
      scrapedContext.businessInfo.addresses.forEach(addr => {
        sections.push(`- ${addr}`);
      });
      sections.push('');
    }

    // STRUCTURED CONTENT - MUST BE PRESERVED EXACTLY
    if (scrapedContext.businessInfo.structuredContent) {
      sections.push('*** STRUCTURED CONTENT FROM EXISTING SITE (PRESERVE EXACTLY) ***');
      sections.push('WARNING: The following content MUST be preserved exactly as provided. DO NOT modify, enhance, or create new content.');
      sections.push('');

      // Business Hours
      if (scrapedContext.businessInfo.structuredContent.businessHours) {
        sections.push('BUSINESS HOURS (USE EXACTLY AS PROVIDED):');
        scrapedContext.businessInfo.structuredContent.businessHours.forEach(({ day, hours, closed }) => {
          sections.push(`- ${day}: ${closed ? 'Closed' : hours}`);
        });
        sections.push('^ DO NOT change these hours or create different hours');
        sections.push('');
      }

      // Services with Pricing
      if (scrapedContext.businessInfo.structuredContent.services) {
        sections.push(`SERVICES WITH PRICING (Found ${scrapedContext.businessInfo.structuredContent.services.length} services - PRESERVE NAMES AND PRICES EXACTLY):`);
        scrapedContext.businessInfo.structuredContent.services.slice(0, 10).forEach(service => {
          sections.push(`- "${service.name}"${service.price ? ` - Price: ${service.price}` : ''}${service.duration ? ` (${service.duration})` : ''}`);
          if (service.description) {
            sections.push(`  Description: ${service.description.substring(0, 100)}...`);
          }
        });
        if (scrapedContext.businessInfo.structuredContent.services.length > 10) {
          sections.push(`... and ${scrapedContext.businessInfo.structuredContent.services.length - 10} more services`);
        }
        sections.push('^ Service names and prices MUST be used exactly as shown');
        sections.push('');
      }

      // Testimonials
      if (scrapedContext.businessInfo.structuredContent.testimonials) {
        sections.push(`REAL TESTIMONIALS (Found ${scrapedContext.businessInfo.structuredContent.testimonials.length} testimonials - USE VERBATIM):`);
        scrapedContext.businessInfo.structuredContent.testimonials.slice(0, 3).forEach(testimonial => {
          sections.push(`- "${testimonial.content.substring(0, 150)}${testimonial.content.length > 150 ? '...' : ''}"`);
          if (testimonial.name) {
            sections.push(`  -- ${testimonial.name}${testimonial.role ? `, ${testimonial.role}` : ''}${testimonial.rating ? ` (${testimonial.rating} stars)` : ''}`);
          }
        });
        if (scrapedContext.businessInfo.structuredContent.testimonials.length > 3) {
          sections.push(`... and ${scrapedContext.businessInfo.structuredContent.testimonials.length - 3} more testimonials`);
        }
        sections.push('^ NEVER create fake testimonials. Use these real ones exactly as provided.');
        sections.push('');
      }
    }

    // Content summary - increased limit for better preservation
    if (scrapedContext.contentSummary) {
      sections.push('Content from Existing Website:');
      // Increased content summary to 3000 characters for better context preservation
      const maxContentLength = 3000;
      if (scrapedContext.contentSummary.length > maxContentLength) {
        sections.push(scrapedContext.contentSummary.substring(0, maxContentLength) + '...[truncated for brevity]');
        console.log(`Truncated content summary from ${scrapedContext.contentSummary.length} to ${maxContentLength} characters`);
      } else {
        sections.push(scrapedContext.contentSummary);
      }
      sections.push('');
      sections.push('IMPORTANT: Preserve the core messaging and key phrases from this content. Improve presentation and fix errors, but maintain the authentic voice.');
      sections.push('');
    }

    // Recommended pages
    if (scrapedContext.recommendedPages?.length) {
      sections.push('Recommended Pages to Generate:');
      sections.push(scrapedContext.recommendedPages.join(', '));
      sections.push('');
    }
  }

  // Additional details
  if (businessInfo.additionalDetails && Object.keys(businessInfo.additionalDetails).length > 0) {
    sections.push('Additional Details:');
    Object.entries(businessInfo.additionalDetails).forEach(([key, value]) => {
      sections.push(`- ${key}: ${JSON.stringify(value)}`);
    });
    sections.push('');
  }

  sections.push('Generate the site foundation (metadata, branding, theme, hero section) as a structured JSON object matching the schema provided in the system prompt.');

  return sections.join('\n');
}

/**
 * Build user prompt for page section generation (Phase 2)
 *
 * @param sectionType - Type of section to generate
 * @param businessInfo - Business information
 * @param siteTheme - Site branding/theme from Phase 1
 * @param scrapedContext - Optional scraped website data for enhanced context
 * @returns Formatted user prompt for section generation
 *
 * @example
 * ```typescript
 * const prompt = buildPagePrompt('about', businessInfo, {
 *   primary_color: '#2D5F3F',
 *   secondary_color: '#8B4513',
 *   accent_color: '#FF6B9D'
 * });
 * ```
 */
export function buildPagePrompt(
  sectionType: 'about' | 'values' | 'features' | 'services' | 'team' | 'testimonials' | 'contact',
  businessInfo: BusinessInfo,
  siteTheme: SiteBranding,
  scrapedContext?: ScrapedWebsiteContext
): string {
  const parts: string[] = [];

  // Section-specific instructions
  const sectionInstructions: Record<typeof sectionType, string> = {
    about: 'Generate the About section with compelling story, mission, and vision.',
    values: 'Generate the Values section with 4-6 core values that reflect the business philosophy.',
    features: 'Generate the Features section with 6-8 key features and benefits.',
    services: 'Generate the Services section with 4-6 main services offered. Return null if services are not applicable.',
    team: 'Generate the Team section with 4-6 team members. Return null if not applicable.',
    testimonials: 'Generate the Testimonials section with 6-8 customer reviews.',
    contact: 'Generate the Contact section with all contact information and business hours.'
  };

  parts.push(`Section Type: ${sectionType.toUpperCase()}`);
  parts.push(sectionInstructions[sectionType]);
  parts.push('');

  // Business context
  parts.push('Business Information:');
  parts.push(`- Name: ${businessInfo.name}`);

  if (businessInfo.industry) {
    parts.push(`- Industry: ${businessInfo.industry}`);
  }

  if (businessInfo.location) {
    parts.push(`- Location: ${businessInfo.location}`);
  }

  if (businessInfo.description) {
    parts.push(`- Description: ${businessInfo.description}`);
  }

  // Add contact info for contact section - prioritize scraped data
  if (sectionType === 'contact') {
    // Use scraped contact info if available, otherwise use provided
    if (scrapedContext?.businessInfo.emails?.length) {
      parts.push(`- Email: ${scrapedContext.businessInfo.emails.join(', ')}`);
    } else if (businessInfo.email) {
      parts.push(`- Email: ${businessInfo.email}`);
    }

    if (scrapedContext?.businessInfo.phones?.length) {
      parts.push(`- Phone: ${scrapedContext.businessInfo.phones.join(', ')}`);
    } else if (businessInfo.phone) {
      parts.push(`- Phone: ${businessInfo.phone}`);
    }

    if (scrapedContext?.businessInfo.addresses?.length) {
      parts.push(`- Address: ${scrapedContext.businessInfo.addresses.join('; ')}`);
    } else if (businessInfo.additionalDetails?.address) {
      parts.push(`- Address: ${String(businessInfo.additionalDetails.address)}`);
    }

    // Add structured business hours if available
    if (scrapedContext?.businessInfo.structuredContent?.businessHours) {
      parts.push('');
      parts.push('*** ACTUAL BUSINESS HOURS (USE EXACTLY AS PROVIDED) ***');
      scrapedContext.businessInfo.structuredContent.businessHours.forEach(({ day, hours, closed }) => {
        parts.push(`- ${day}: ${closed ? 'Closed' : hours}`);
      });
      parts.push('^ These are the REAL business hours. DO NOT create different hours.');
    }
  }

  parts.push('');

  // Add structured content for services section
  if (sectionType === 'services' && scrapedContext?.businessInfo.structuredContent?.services) {
    parts.push('');
    parts.push('*** ACTUAL SERVICES WITH PRICING (USE EXACTLY) ***');
    parts.push(`Found ${scrapedContext.businessInfo.structuredContent.services.length} services on the existing website.`);
    parts.push('YOU MUST USE THESE EXACT SERVICE NAMES AND PRICES:');
    parts.push('');
    scrapedContext.businessInfo.structuredContent.services.forEach(service => {
      parts.push(`Service: "${service.name}"`);
      if (service.price) parts.push(`  Price: ${service.price}`);
      if (service.duration) parts.push(`  Duration: ${service.duration}`);
      if (service.description) parts.push(`  Description: ${service.description}`);
      parts.push('');
    });
    parts.push('^ DO NOT create new services or change prices. Use exactly what was found.');
    parts.push('');
  }

  // Add structured content for testimonials section
  if (sectionType === 'testimonials' && scrapedContext?.businessInfo.structuredContent?.testimonials) {
    parts.push('');
    parts.push('*** REAL CUSTOMER TESTIMONIALS (USE VERBATIM) ***');
    parts.push(`Found ${scrapedContext.businessInfo.structuredContent.testimonials.length} real testimonials on the existing website.`);
    parts.push('YOU MUST USE THESE EXACT TESTIMONIALS - NEVER CREATE FAKE ONES:');
    parts.push('');
    scrapedContext.businessInfo.structuredContent.testimonials.forEach((testimonial, index) => {
      parts.push(`Testimonial ${index + 1}:`);
      parts.push(`  Content: "${testimonial.content}"`);
      if (testimonial.name) parts.push(`  Customer: ${testimonial.name}`);
      if (testimonial.role) parts.push(`  Role/Company: ${testimonial.role}`);
      if (testimonial.rating) parts.push(`  Rating: ${testimonial.rating} stars`);
      parts.push('');
    });
    parts.push('^ These are REAL customer reviews. Use them exactly as provided. NEVER invent testimonials.');
    parts.push('');
  }

  // Add scraped content context for the specific section
  if (scrapedContext) {
    parts.push('=== EXISTING WEBSITE CONTENT ===');
    parts.push('The user has an existing website. Use the following content as inspiration, but improve and modernize it:');
    parts.push('');

    // Map section types to potential page content keys
    const sectionToPageMapping: Record<typeof sectionType, string[]> = {
      about: ['about', 'story', 'history', 'mission', 'who-we-are'],
      values: ['values', 'philosophy', 'beliefs', 'principles'],
      features: ['features', 'benefits', 'why-us', 'what-we-offer'],
      services: ['services', 'offerings', 'what-we-do', 'programs'],
      team: ['team', 'staff', 'about', 'people', 'our-team'],
      testimonials: ['testimonials', 'reviews', 'feedback', 'stories'],
      contact: ['contact', 'location', 'hours', 'visit']
    };

    // Find relevant scraped content for this section
    if (scrapedContext.pageContents) {
      const relevantKeys = sectionToPageMapping[sectionType];
      let foundContent = false;

      for (const key of relevantKeys) {
        if (scrapedContext.pageContents[key]) {
          parts.push(`Content from existing "${key}" page:`);
          // Increased limit for better content preservation
          const content = scrapedContext.pageContents[key];
          const maxPageContentLength = 2500; // Increased from 1000 to better preserve content
          if (content.length > maxPageContentLength) {
            parts.push(content.substring(0, maxPageContentLength) + '...');
            parts.push('(Content truncated for length)');
          } else {
            parts.push(content);
          }
          parts.push('');
          foundContent = true;
          break; // Use the first matching content
        }
      }

      // If no specific content found but we have a content summary, use it (limited)
      if (!foundContent && scrapedContext.contentSummary) {
        parts.push('Website Overview:');
        const maxSummaryLength = 800; // Limit summary length in page prompts
        if (scrapedContext.contentSummary.length > maxSummaryLength) {
          parts.push(scrapedContext.contentSummary.substring(0, maxSummaryLength) + '...');
        } else {
          parts.push(scrapedContext.contentSummary);
        }
        parts.push('');
      }
    } else if (scrapedContext.contentSummary) {
      // Fallback to content summary if no page-specific content (limited)
      parts.push('Website Overview:');
      const maxSummaryLength = 800; // Limit summary length in page prompts
      if (scrapedContext.contentSummary.length > maxSummaryLength) {
        parts.push(scrapedContext.contentSummary.substring(0, maxSummaryLength) + '...');
      } else {
        parts.push(scrapedContext.contentSummary);
      }
      parts.push('');
    }

    // Add specific business info for contact section
    if (sectionType === 'contact' && scrapedContext.businessInfo) {
      if (scrapedContext.businessInfo.socialLinks?.length) {
        parts.push('Social Media Links (preserve these):');
        scrapedContext.businessInfo.socialLinks.forEach(({ platform, url }) => {
          parts.push(`- ${platform}: ${url}`);
        });
        parts.push('');
      }
    }

    parts.push('IMPORTANT: The above content is from the actual business website. Preserve the key messages and authentic voice.');
    parts.push('You should:');
    parts.push('- Keep core phrases and messaging intact');
    parts.push('- Fix grammar/spelling errors');
    parts.push('- Improve flow and readability');
    parts.push('- Maintain all factual information exactly as provided');
    parts.push('The original content should be clearly recognizable in your output.');
    parts.push('');
  }

  // Site theme context
  parts.push('Site Theme:');
  parts.push(`- Primary Color: ${siteTheme.primary_color}`);
  if (siteTheme.secondary_color) {
    parts.push(`- Secondary Color: ${siteTheme.secondary_color}`);
  }
  if (siteTheme.accent_color) {
    parts.push(`- Accent Color: ${siteTheme.accent_color}`);
  }
  if (siteTheme.font_family) {
    parts.push(`- Fonts: ${siteTheme.font_family}`);
  }

  parts.push('');

  // JSON schema for each section type
  const schemas: Record<typeof sectionType, string> = {
    about: `{
  "title": "Section title",
  "content": ["Paragraph 1 with **markdown** formatting", "Paragraph 2", "Paragraph 3"],
  "mission": "Optional mission statement",
  "vision": "Optional vision statement"
}`,
    values: `{
  "title": "Section title",
  "subtitle": "Optional subtitle",
  "values": [
    {
      "title": "Value name",
      "description": "Value description with **markdown**",
      "icon": "lucide-icon-name"
    }
  ]
}`,
    features: `{
  "title": "Section title",
  "subtitle": "Optional subtitle",
  "features": [
    {
      "title": "Feature name",
      "description": "Feature description",
      "icon": "lucide-icon-name"
    }
  ]
}`,
    services: `{
  "title": "Section title",
  "subtitle": "Optional subtitle",
  "services": [
    {
      "name": "Service name (required)",
      "description": "Service description with **markdown** (required)",
      "price": "Optional - only include if known, e.g. '$50' or 'Starting at $50'",
      "duration": "Optional - only include if relevant, e.g. '1 hour' or '2-3 weeks'"
    }
  ]
}
Note: Omit price and duration fields entirely if not applicable. Do not use null values.`,
    team: `{
  "title": "Section title",
  "subtitle": "Optional subtitle",
  "members": [
    {
      "name": "Member name",
      "role": "Job title",
      "bio": "Bio with **markdown** (2-3 sentences)",
      "image": "Optional image description"
    }
  ]
}`,
    testimonials: `{
  "title": "Section title",
  "subtitle": "Optional subtitle",
  "testimonials": [
    {
      "name": "Customer name (required)",
      "content": "Testimonial text (required, 2-3 sentences)",
      "role": "Optional - only include if adds value",
      "rating": "Optional - number 1-5, omit if not relevant"
    }
  ]
}
Note: Omit role and rating fields entirely if not applicable. Do not use null values.`,
    contact: `{
  "title": "Contact Us (ALWAYS required)",
  "email": "contact@example.com (optional - omit if not provided)",
  "phone": "(555) 123-4567 (optional - omit if not provided)",
  "address": "123 Main St, City, ST 12345 (optional - omit if not provided)",
  "hours": "Mon-Sat: 9am-6pm, Sun: 10am-5pm (optional - omit if not provided)"
}

Example with no contact info:
{
  "title": "Contact Us"
}`
  };

  parts.push('Required JSON Structure:');
  parts.push(schemas[sectionType]);
  parts.push('');
  parts.push('Generate the section content as valid JSON matching the schema above.');

  return parts.join('\n');
}
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
1. Preserve accurate business information (contact details, hours, location)
2. Draw inspiration from the existing brand colors and visual identity
3. Improve and modernize the content and messaging
4. Maintain consistency with their established brand while enhancing it
5. Use the existing logo URL if provided

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
    "background_image": "Description of ideal hero background image"
  },
  "branding": {
    "primary_color": "#RRGGBB hex color code",
    "secondary_color": "#RRGGBB hex color code",
    "accent_color": "#RRGGBB hex color code",
    "logo_description": "Description of logo concept and style",
    "font_family": "Font pairing suggestion (heading, body)"
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
- Use it as the foundation for your content generation
- Preserve accurate business information (contact details, addresses, hours)
- Improve and modernize the language while maintaining the business's unique voice
- Fix any grammar, spelling, or clarity issues
- Make the content more engaging and compelling
- Do NOT ignore the existing content - it should directly influence your output

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
- Each service needs: name, description, optional price/duration
- Be specific to garden centers (plant care, landscaping, workshops, delivery, etc.)

*Team Section:*
- Generate 3-6 team members
- Each needs: name, role, bio (2-3 sentences), optional image description
- Create realistic names and roles (Owner, Head Gardener, Design Specialist, etc.)
- Bios should highlight expertise and personality

*Testimonials Section:*
- Generate 4-8 customer testimonials
- Each needs: name, optional role/company, content (2-3 sentences), optional rating
- Sound like real people, not marketing copy
- Include specific details about products or services

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
    sections.push('The user has an existing website that we analyzed. Use this information to create a better, modernized version of their site.');
    sections.push('');

    // Branding from existing site
    if (scrapedContext.businessInfo.brandColors?.length) {
      sections.push('Existing Brand Colors (use as inspiration):');
      scrapedContext.businessInfo.brandColors.forEach(color => {
        sections.push(`- ${color}`);
      });
      sections.push('');
    }

    if (scrapedContext.businessInfo.logoUrl) {
      sections.push(`Existing Logo: ${scrapedContext.businessInfo.logoUrl}`);
      sections.push('(You can reference this logo URL in your output)');
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

    // Content summary - limit to prevent token overflow
    if (scrapedContext.contentSummary) {
      sections.push('Content from Existing Website:');
      // Cap content summary at 1500 characters to leave room for response
      const maxContentLength = 1500;
      if (scrapedContext.contentSummary.length > maxContentLength) {
        sections.push(scrapedContext.contentSummary.substring(0, maxContentLength) + '...[truncated for brevity]');
        console.log(`Truncated content summary from ${scrapedContext.contentSummary.length} to ${maxContentLength} characters`);
      } else {
        sections.push(scrapedContext.contentSummary);
      }
      sections.push('');
      sections.push('Use this content as inspiration, but improve the copy, modernize the language, and make it more engaging. Do not copy verbatim.');
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
  }

  parts.push('');

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
          // Limit content length to avoid token overflow
          const content = scrapedContext.pageContents[key];
          const maxPageContentLength = 1000; // Reduced from 2000 to prevent token overflow
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

    parts.push('IMPORTANT: Use the above content as inspiration to create better, more engaging copy. Do not copy verbatim - improve the language, fix any issues, and make it more compelling while preserving accurate business information.');
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
      "name": "Service name",
      "description": "Service description with **markdown**",
      "price": "Optional price like '$50' or 'Starting at $50'",
      "duration": "Optional duration like '1 hour' or '2-3 weeks'"
    }
  ]
}`,
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
      "name": "Customer name",
      "role": "Optional role or company",
      "content": "Testimonial text (2-3 sentences)",
      "rating": 5
    }
  ]
}`,
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
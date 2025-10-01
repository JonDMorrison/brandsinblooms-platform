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

import { type BusinessInfo, type SiteBranding } from '@/lib/types/site-generation-jobs';

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
 * Build user prompt for page section generation (Phase 2)
 *
 * @param sectionType - Type of section to generate
 * @param businessInfo - Business information
 * @param siteTheme - Site branding/theme from Phase 1
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
  siteTheme: SiteBranding
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

  // Add contact info for contact section
  if (sectionType === 'contact') {
    if (businessInfo.email) {
      parts.push(`- Email: ${businessInfo.email}`);
    }
    if (businessInfo.phone) {
      parts.push(`- Phone: ${businessInfo.phone}`);
    }
    if (businessInfo.additionalDetails?.address) {
      parts.push(`- Address: ${String(businessInfo.additionalDetails.address)}`);
    }
  }

  parts.push('');

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
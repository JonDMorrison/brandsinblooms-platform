/**
 * Generate Seed Content SQL
 *
 * This script generates SQL INSERT statements for seeding complete page content
 * for all test/demo sites in the database. It ensures seeded sites have the same
 * comprehensive set of pages that a newly created site would have.
 *
 * Usage:
 *   pnpm tsx scripts/generate-seed-content.ts > supabase/seed-content-generated.sql
 */

import {
  getSeasonalGuideTemplate,
  getCompanyTemplate,
  getWateringGuideTemplate,
  getLightingGuideTemplate,
  getSoilGuideTemplate,
  getPestsGuideTemplate,
  getPrivacyPolicyTemplate,
  getTermsOfServiceTemplate,
} from '../src/lib/content/seed-templates'

// ============================================================================
// SITE CONFIGURATIONS
// ============================================================================

interface SiteConfig {
  id: string
  subdomain: string
  name: string
  businessName: string
  location: string
  description: string
  tagline: string
  primaryColor: string
  industry: 'dev' | 'gardening' | 'tech'
}

const SITES: SiteConfig[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    subdomain: 'dev',
    name: 'Development Site',
    businessName: 'Dev Corp',
    location: 'Silicon Valley',
    description:
      'A comprehensive testing environment for the Brands in Blooms platform, featuring all available page types and content templates.',
    tagline: 'Building the future of multi-tenant web platforms',
    primaryColor: '#3B82F6',
    industry: 'dev',
  },
  {
    id: '14a3a999-b698-437f-90a8-f89842f10d08',
    subdomain: 'greenthumb',
    name: 'Green Thumb Gardens',
    businessName: 'Green Thumb LLC',
    location: 'Portland, Oregon',
    description:
      'Your trusted local gardening experts, offering premium plants, expert care advice, and sustainable gardening solutions for the Pacific Northwest.',
    tagline: 'Growing green, naturally',
    primaryColor: '#10B981',
    industry: 'gardening',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    subdomain: 'techshop',
    name: 'Tech Shop Pro',
    businessName: 'Tech Shop Inc',
    location: 'Austin, Texas',
    description:
      'Your one-stop shop for cutting-edge electronics, gadgets, and tech accessories. Expert support and competitive prices on all the latest technology.',
    tagline: 'Technology made simple',
    primaryColor: '#8B5CF6',
    industry: 'tech',
  },
]

// Default admin user ID for created content
const ADMIN_USER_ID = '11111111-1111-1111-1111-111111111111'

// ============================================================================
// GENERIC PAGE TEMPLATES
// ============================================================================

function createGenericHomePage(site: SiteConfig) {
  const industryFeatures = {
    dev: [
      'Rapid development environment',
      'Complete feature testing',
      'Multi-tenant architecture',
      'Production-ready templates',
    ],
    gardening: [
      'Expert horticultural guidance',
      'Premium plant selection',
      'Comprehensive care resources',
      'Local climate expertise',
    ],
    tech: [
      'Latest technology products',
      'Expert tech support',
      'Competitive pricing',
      'Fast, reliable shipping',
    ],
  }

  return {
    version: '1.0',
    layout: 'landing',
    sections: {
      hero: {
        type: 'hero',
        order: 1,
        visible: true,
        data: {
          headline: `Welcome to ${site.name}`,
          subheadline: site.tagline,
          ctaText: 'Get Started',
          ctaLink: '/contact',
          secondaryCtaText: 'Learn More',
          secondaryCtaLink: '/about',
          features: industryFeatures[site.industry],
        },
      },
      features: {
        type: 'features',
        order: 2,
        visible: true,
        data: {
          headline: 'Why Choose Us',
          description: site.description,
          features:
            site.industry === 'gardening'
              ? [
                  'Over 20 years of horticultural expertise',
                  'Locally sourced, sustainably grown plants',
                  'Free lifetime plant care support',
                ]
              : site.industry === 'tech'
              ? [
                  'Latest tech from top brands',
                  'Expert product recommendations',
                  'Hassle-free returns and warranty',
                ]
              : [
                  'Comprehensive testing environment',
                  'All feature types available',
                  'Real-world usage examples',
                ],
        },
        settings: {
          backgroundColor: 'alternate',
        },
      },
      cta: {
        type: 'cta',
        order: 3,
        visible: true,
        data: {
          headline: 'Ready to Get Started?',
          description: `Join us at ${site.businessName} and experience the difference.`,
          ctaText: 'Contact Us Today',
          ctaLink: '/contact',
        },
        settings: {
          backgroundColor: 'primary',
        },
      },
    },
  }
}

function createGenericAboutPage(site: SiteConfig) {
  const industryStory = {
    dev: {
      story: `${site.businessName} was created to provide developers with a comprehensive testing environment that mirrors real-world multi-tenant applications. Our platform demonstrates best practices in modern web development.`,
      mission:
        'To empower developers with robust, production-ready templates and testing environments.',
      values: [
        'Innovation in web development',
        'Developer experience first',
        'Open source collaboration',
      ],
    },
    gardening: {
      story: `Founded by master horticulturists in ${site.location}, ${site.businessName} has been serving the local community for over two decades. We believe that everyone can cultivate a thriving garden with the right guidance and quality plants.`,
      mission:
        'To make sustainable gardening accessible to everyone through expert guidance and premium plants.',
      values: [
        'Sustainability and organic practices',
        'Local community engagement',
        'Horticultural education',
      ],
    },
    tech: {
      story: `${site.businessName} started in ${site.location} with a simple goal: make technology accessible to everyone. We curate the best tech products and provide expert guidance to help you make informed decisions.`,
      mission:
        'To democratize technology by providing expert advice and competitive prices.',
      values: [
        'Customer education and support',
        'Quality over quantity',
        'Innovation and accessibility',
      ],
    },
  }

  const story = industryStory[site.industry]

  return {
    version: '1.0',
    layout: 'about',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: `About ${site.name}`,
          subheadline: story.story,
        },
        settings: {
          backgroundColor: 'default',
        },
      },
      values: {
        type: 'features',
        order: 2,
        visible: true,
        data: {
          headline: 'Our Mission',
          description: story.mission,
          features: story.values,
        },
        settings: {
          backgroundColor: 'alternate',
        },
      },
      team: {
        type: 'richText',
        order: 3,
        visible: true,
        data: {
          headline: 'Our Team',
          content: `<p>Our team brings together years of experience and passion for ${
            site.industry === 'gardening'
              ? 'horticulture and sustainable gardening'
              : site.industry === 'tech'
              ? 'technology and customer service'
              : 'web development and platform engineering'
          }. We're committed to providing you with the best possible experience.</p>`,
        },
        settings: {
          backgroundColor: 'default',
        },
      },
    },
  }
}

function createGenericContactPage(site: SiteConfig) {
  return {
    version: '1.0',
    layout: 'contact',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Get in Touch',
          subheadline: `We'd love to hear from you. Contact ${site.businessName} today.`,
        },
        settings: {
          backgroundColor: 'default',
        },
      },
      contactForm: {
        type: 'contactForm',
        order: 2,
        visible: true,
        data: {
          headline: 'Send Us a Message',
          description: "Fill out the form below and we'll get back to you as soon as possible.",
        },
        settings: {
          backgroundColor: 'default',
        },
      },
      contactInfo: {
        type: 'richText',
        order: 3,
        visible: true,
        data: {
          headline: 'Other Ways to Reach Us',
          content: `<p><strong>Location:</strong> ${site.location}</p>
<p><strong>Email:</strong> Contact us through the form above</p>
<p><strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM ${
            site.location.includes('Portland')
              ? 'PST'
              : site.location.includes('Austin')
              ? 'CST'
              : 'PST'
          }</p>`,
        },
        settings: {
          backgroundColor: 'alternate',
        },
      },
    },
  }
}

// ============================================================================
// SQL GENERATION HELPERS
// ============================================================================

function escapeSQLString(str: string): string {
  // Replace single quotes with two single quotes for SQL escaping
  return str.replace(/'/g, "''")
}

function generateContentInsert(
  siteId: string,
  title: string,
  slug: string,
  contentType: string,
  content: any,
  sortOrder: number,
  authorId: string = ADMIN_USER_ID
): string {
  const contentJson = JSON.stringify(content)
  const escapedContent = escapeSQLString(contentJson)

  return `    ('${siteId}', '${title}', '${escapedContent}', '${slug}', true, '${contentType}', ${sortOrder}, '${authorId}')`
}

// ============================================================================
// MAIN GENERATION LOGIC
// ============================================================================

function generateAllSeedContent() {
  const inserts: string[] = []

  for (const site of SITES) {
    console.log(`\n-- ========================================`)
    console.log(`-- ${site.name} (${site.subdomain})`)
    console.log(`-- ========================================\n`)

    // Generate core pages
    inserts.push(
      generateContentInsert(
        site.id,
        'Home',
        'home',
        'landing',
        createGenericHomePage(site),
        10
      )
    )

    inserts.push(
      generateContentInsert(
        site.id,
        'About',
        'about',
        'about',
        createGenericAboutPage(site),
        20
      )
    )

    inserts.push(
      generateContentInsert(
        site.id,
        'Contact',
        'contact',
        'contact',
        createGenericContactPage(site),
        80
      )
    )

    // Generate additional pages (only for gardening and dev sites for now)
    if (site.industry === 'gardening' || site.industry === 'dev') {
      inserts.push(
        generateContentInsert(
          site.id,
          'Privacy Policy',
          'privacy',
          'other',
          getPrivacyPolicyTemplate(
            'Privacy Policy',
            `Last Updated: ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`,
            { complexity: 'detailed' }
          ),
          90
        )
      )

      inserts.push(
        generateContentInsert(
          site.id,
          'Terms of Service',
          'terms',
          'other',
          getTermsOfServiceTemplate(
            'Terms of Service',
            `Last Updated: ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`,
            { complexity: 'detailed' }
          ),
          100
        )
      )

      if (site.industry === 'gardening') {
        inserts.push(
          generateContentInsert(
            site.id,
            'Seasonal Plant Care Guide',
            'seasonal-guide',
            'other',
            getSeasonalGuideTemplate(site.businessName, site.location),
            110
          )
        )

        inserts.push(
          generateContentInsert(
            site.id,
            'About Our Company',
            'company',
            'other',
            getCompanyTemplate(site.businessName),
            120
          )
        )

        inserts.push(
          generateContentInsert(
            site.id,
            'Watering 101',
            'watering',
            'other',
            getWateringGuideTemplate(site.businessName),
            130
          )
        )

        inserts.push(
          generateContentInsert(
            site.id,
            'Light Requirements Explained',
            'lighting',
            'other',
            getLightingGuideTemplate(site.businessName),
            140
          )
        )

        inserts.push(
          generateContentInsert(
            site.id,
            'Soil & Repotting Guide',
            'soil',
            'other',
            getSoilGuideTemplate(site.businessName),
            150
          )
        )

        inserts.push(
          generateContentInsert(
            site.id,
            'Common Pests & Problems',
            'pests',
            'other',
            getPestsGuideTemplate(site.businessName),
            160
          )
        )
      }
    } else {
      // Tech shop gets basic pages only
      inserts.push(
        generateContentInsert(
          site.id,
          'Privacy Policy',
          'privacy',
          'other',
          getPrivacyPolicyTemplate(
            'Privacy Policy',
            `Last Updated: ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`,
            { complexity: 'simple' }
          ),
          90
        )
      )

      inserts.push(
        generateContentInsert(
          site.id,
          'Terms of Service',
          'terms',
          'other',
          getTermsOfServiceTemplate(
            'Terms of Service',
            `Last Updated: ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`,
            { complexity: 'simple' }
          ),
          100
        )
      )
    }
  }

  // Output SQL
  console.log(`-- Generated Content for Seed Data`)
  console.log(`-- Auto-generated by scripts/generate-seed-content.ts`)
  console.log(`-- Generated on: ${new Date().toISOString()}`)
  console.log(`--`)
  console.log(`-- This ensures seeded sites have the same comprehensive page set`)
  console.log(`-- that newly created sites receive through the app.\n`)

  console.log(
    `INSERT INTO content (site_id, title, content, slug, is_published, content_type, sort_order, author_id)`
  )
  console.log(`VALUES`)
  console.log(inserts.join(',\n'))
  console.log(`;`)

  console.log(`\n-- Content generation complete!`)
  console.log(`-- Total pages generated: ${inserts.length}`)
}

// Run the generator
generateAllSeedContent()

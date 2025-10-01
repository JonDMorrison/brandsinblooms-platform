/**
 * Site Creator Module
 *
 * Creates sites and pages in the database from LLM-generated content.
 * Handles site creation, page creation with proper PageContent structure.
 *
 * AI-First Approach: Maximizes use of AI-generated data with minimal hardcoded defaults.
 */

import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/types/error-handling';
import type { GeneratedSiteData } from '@/lib/types/site-generation-jobs';
import type { Database } from '@/lib/database/types';

type ContentInsert = Database['public']['Tables']['content']['Insert'];

/**
 * Result from site creation
 */
export interface SiteCreationResult {
  /** Created site ID */
  siteId: string;
  /** Site name */
  siteName: string;
  /** Site subdomain */
  subdomain: string;
  /** Created page IDs */
  pageIds: string[];
}

/**
 * Generates a URL-safe subdomain from site name
 */
function generateSubdomain(siteName: string): string {
  return siteName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Helper: Create Home page content from AI-generated data
 * Uses: hero, features, description, tagline
 */
function createHomePageContent(data: GeneratedSiteData) {
  return {
    version: '1.0',
    layout: 'landing',
    sections: {
      hero: {
        type: 'hero',
        order: 1,
        visible: true,
        data: {
          headline: data.hero.headline,
          subheadline: data.hero.subheadline,
          ctaText: data.hero.cta_text,
          ctaLink: '/plants',
          secondaryCtaText: 'Care Guides',
          secondaryCtaLink: '/care-guides',
          backgroundImage: data.hero.background_image || '/images/hero-greenhouse.jpg',
          features: data.features?.features?.map(f => f.title).slice(0, 4) || [
            'Expert horticultural guidance',
            'Premium plant selection',
            'Comprehensive care resources',
            'Local hardiness zone expertise'
          ]
        }
      },
      featured: {
        type: 'featured',
        order: 2,
        visible: true,
        data: {
          headline: 'Featured Plants This Season',
          subheadline: 'Handpicked selections from our master horticulturists, perfect for current growing conditions',
          viewAllLink: '/plants',
          viewAllText: 'View All Plants'
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      features: {
        type: 'features',
        order: 3,
        visible: true,
        data: {
          headline: data.features?.title || 'Essential Plant Care Features',
          description: data.features?.subtitle || 'Master these key practices for healthy, thriving plants year-round',
          features: data.features?.features?.map(f => f.description || f.title).slice(0, 3) || []
        },
        settings: {
          backgroundColor: 'alternate'
        }
      },
      categories: {
        type: 'categories',
        order: 4,
        visible: true,
        data: {
          headline: 'Find Your Perfect Plant Match',
          description: 'Browse our expertly curated collections organized by care complexity and plant type'
        },
        settings: {
          backgroundColor: 'default'
        }
      },
      cta: {
        type: 'cta',
        order: 5,
        visible: true,
        data: {
          headline: 'Growing Together, Sustainably',
          description: data.description || data.tagline,
          ctaText: 'Shop Plants',
          ctaLink: '/',
          secondaryCtaText: 'Browse Plants',
          secondaryCtaLink: '/'
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
  };
}

/**
 * Helper: Create About page content from AI-generated data
 * Uses: about, values, features, tagline, description
 */
function createAboutPageContent(data: GeneratedSiteData) {
  return {
    version: '1.0',
    layout: 'about',
    sections: {
      hero: {
        type: 'hero',
        order: 1,
        visible: true,
        data: {
          headline: data.about.title || 'About',
          subheadline: data.tagline || data.description,
          ctaText: 'Contact Us',
          ctaLink: '/contact',
          secondaryCtaText: 'View Our Services',
          secondaryCtaLink: '/services',
          features: [
            'Professional Horticulturists',
            'Expert Plant Care Guidance',
            'Sustainable Growing Practices',
            'Local Plant Sourcing'
          ]
        }
      },
      mission: {
        type: 'mission',
        order: 2,
        visible: true,
        data: {
          headline: 'Our Mission',
          content: data.about.mission || data.about.content?.[0] || data.description
        }
      },
      ...(data.values && data.values.values.length > 0 ? {
        values: {
          type: 'values',
          order: 3,
          visible: true,
          data: {
            headline: data.values.title,
            description: data.values.subtitle || 'The principles that guide everything we do',
            items: data.values.values.map((v, i) => ({
              id: v.title.toLowerCase().replace(/\s+/g, '-'),
              title: v.title,
              content: v.description,
              description: v.description,
              icon: v.icon || 'Leaf',
              order: i
            }))
          },
          settings: {
            backgroundColor: 'alternate'
          }
        }
      } : {}),
      ...(data.features && data.features.features.length > 0 ? {
        features: {
          type: 'features',
          order: 5,
          visible: true,
          data: {
            headline: 'Professional Certifications',
            description: 'Our credentials and expertise you can trust',
            features: data.features.features.map(f => f.title).slice(0, 5)
          },
          settings: {
            backgroundColor: 'alternate'
          }
        }
      } : {}),
      richText: {
        type: 'richText',
        order: 6,
        visible: true,
        data: {
          headline: 'Our Story',
          content: `<p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">${
            data.about.vision || data.about.content?.[1] || data.about.content?.[0] || data.description
          }</p>`
        }
      },
      cta: {
        type: 'cta',
        order: 7,
        visible: true,
        data: {
          headline: 'Ready to Start Your Plant Journey?',
          description: 'Let our experts help you create the perfect green sanctuary for your space.',
          ctaText: 'Schedule Consultation',
          ctaLink: '/consultation',
          secondaryCtaText: 'Browse Plants',
          secondaryCtaLink: '/plants'
        },
        settings: {
          backgroundColor: 'primary'
        }
      }
    }
  };
}

/**
 * Helper: Create Contact page content from AI-generated data
 * Uses: contact, testimonials (as FAQs)
 */
function createContactPageContent(data: GeneratedSiteData) {
  const contact = data.contact;

  return {
    version: '1.0',
    layout: 'contact',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: contact.title || 'Contact',
          subheadline: 'We\'d love to hear from you. Reach out to us for questions, support, or just to say hello.'
        },
        settings: {
          backgroundColor: 'gradient'
        }
      },
      businessInfo: {
        type: 'businessInfo',
        order: 2,
        visible: true,
        data: {
          headline: 'Contact Information',
          email: contact.email,
          phone: contact.phone || '',
          address: contact.address ? {
            street: contact.address,
            city: '',
            state: '',
            zip: ''
          } : undefined,
          hours: contact.hours ? [
            { days: 'Monday - Friday', time: contact.hours }
          ] : [
            { days: 'Monday - Friday', time: '9:00 AM - 6:00 PM' },
            { days: 'Saturday', time: '10:00 AM - 4:00 PM' },
            { days: 'Sunday', time: 'Closed' }
          ],
          socials: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: ''
          }
        }
      },
      richText: {
        type: 'richText',
        order: 3,
        visible: true,
        data: {
          content: 'Whether you have questions about our products, need support, or want to learn more about what we offer, our team is ready to assist you. We strive to respond to all inquiries within 24 hours during business days.<br><br>For urgent matters, please call us directly. For general inquiries, feel free to email us or visit our location during business hours.',
          headline: 'We\'re Here to Help'
        }
      },
      faq: {
        type: 'faq',
        order: 4,
        visible: true,
        data: {
          headline: 'Frequently Asked Questions',
          description: '',
          faqs: [
            {
              id: 'faq-1',
              order: 0,
              question: 'What are your business hours?',
              answer: contact.hours
                ? `We are open ${contact.hours}.`
                : 'We are open Monday through Friday from 9:00 AM to 6:00 PM, and Saturdays from 10:00 AM to 4:00 PM. We are closed on Sundays.'
            },
            {
              id: 'faq-2',
              order: 1,
              question: 'How can I reach customer support?',
              answer: `You can reach our customer support team by phone at ${contact.phone || '(555) 123-4567'}, by email at ${contact.email}, or by visiting our location during business hours.`
            },
            {
              id: 'faq-3',
              order: 2,
              question: 'Do you offer consultations?',
              answer: 'Yes! We offer free consultations to help you choose the right solutions for your needs. Contact us to schedule an appointment.'
            },
            {
              id: 'faq-4',
              order: 3,
              question: 'Where are you located?',
              answer: contact.address
                ? `We are located at ${contact.address}. Parking is available on-site.`
                : 'We are located at 123 Plant Avenue. Parking is available on-site.'
            }
          ]
        },
        settings: {
          backgroundColor: 'alternate'
        }
      }
    }
  };
}

/**
 * Creates a site and pages from generated content
 *
 * AI-First Strategy:
 * - Generates 3 pages: Home (landing), About, Contact
 * - Uses AI data for all content, headings, features, values
 * - Minimal hardcoded defaults (only structural/UI elements)
 *
 * @param data - Generated site data from LLM
 * @param userId - Owner user ID
 * @returns Site creation result
 * @throws Error if creation fails
 */
export async function createSiteFromGenerated(
  data: GeneratedSiteData,
  userId: string
): Promise<SiteCreationResult> {
  const supabase = await createClient();
  let siteId: string | null = null;
  const createdPageIds: string[] = [];

  try {
    console.log('Creating site:', data.site_name);

    // Generate subdomain
    const subdomain = generateSubdomain(data.site_name);

    // Check if subdomain is already taken
    const { data: existingSite } = await supabase
      .from('sites')
      .select('id')
      .eq('subdomain', subdomain)
      .single();

    // If subdomain exists, append random suffix
    const finalSubdomain = existingSite
      ? `${subdomain}-${Math.random().toString(36).substring(2, 8)}`
      : subdomain;

    // Create site record
    const themeSettings = {
      colors: {
        primary: data.branding?.primary_color || '#8B5CF6',
        secondary: data.branding?.secondary_color || '#06B6D4',
        accent: data.branding?.accent_color || '#F59E0B',
        background: '#FFFFFF'
      },
      typography: {
        headingFont: data.branding?.font_family?.split(',')[0]?.trim() || 'Inter',
        bodyFont: data.branding?.font_family?.split(',')[1]?.trim() || 'Inter',
        fontSize: 'medium'
      },
      layout: {
        headerStyle: 'modern',
        footerStyle: 'centered',
        menuStyle: 'horizontal'
      },
      logo: {
        url: null,
        position: 'left',
        size: 'medium',
        description: data.branding?.logo_description || null
      },
      navigation: {
        items: [
          { label: 'Home', href: '/home' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' }
        ],
        style: 'horizontal'
      },
      footer: {
        style: 'centered',
        navigationItems: [
          { label: 'Home', href: '/home' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' }
        ],
        socialLinks: [],
        copyright: `© ${new Date().getFullYear()} ${data.site_name}. All rights reserved.`
      },
      // Store original branding and SEO for reference
      _generated: {
        branding: data.branding,
        seo: data.seo
      }
    };

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .insert({
        name: data.site_name,
        subdomain: finalSubdomain,
        business_name: data.site_name,
        description: data.description || data.tagline,
        business_email: data.contact?.email,
        business_phone: data.contact?.phone,
        business_address: data.contact?.address,
        primary_color: data.branding?.primary_color || '#3B82F6',
        theme_settings: JSON.parse(JSON.stringify(themeSettings)),
        is_active: true,
        is_published: true,
        created_by: userId,
      })
      .select('id')
      .single();

    if (siteError || !site) {
      throw new Error(`Failed to create site: ${handleError(siteError).message}`);
    }

    siteId = site.id;
    console.log('Site created:', siteId);

    // Create site membership for the owner
    const { error: membershipError } = await supabase
      .from('site_memberships')
      .insert({
        user_id: userId,
        site_id: siteId,
        role: 'owner',
        is_active: true
      })
      .select('id')
      .single();

    if (membershipError) {
      console.error('Failed to create site membership:', handleError(membershipError).message);
      throw new Error(`Failed to create site membership: ${handleError(membershipError).message}`);
    }

    console.log('Site membership created for user:', userId);

    // Create Home page (from hero + features)
    if (data.hero) {
      const { data: homePage, error: homeError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: 'Home',
          slug: 'home',
          content_type: 'page',
          content: createHomePageContent(data),
          is_published: true,
          sort_order: 10,
          author_id: userId,
        } as ContentInsert)
        .select('id')
        .single();

      if (homeError) {
        console.error('Failed to create home page:', handleError(homeError).message);
      } else if (homePage) {
        createdPageIds.push(homePage.id);
        console.log('Home page created');
      }
    }

    // Create About page (from about + values + features)
    if (data.about) {
      const { data: aboutPage, error: aboutError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: 'About',
          slug: 'about',
          content_type: 'page',
          content: createAboutPageContent(data),
          is_published: true,
          sort_order: 20,
          author_id: userId,
        } as ContentInsert)
        .select('id')
        .single();

      if (aboutError) {
        console.error('Failed to create about page:', handleError(aboutError).message);
      } else if (aboutPage) {
        createdPageIds.push(aboutPage.id);
        console.log('About page created');
      }
    }

    // Create Contact page (from contact + testimonials)
    if (data.contact) {
      const { data: contactPage, error: contactError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: 'Contact',
          slug: 'contact',
          content_type: 'page',
          content: createContactPageContent(data),
          is_published: true,
          sort_order: 80,
          author_id: userId,
        } as ContentInsert)
        .select('id')
        .single();

      if (contactError) {
        console.error('Failed to create contact page:', handleError(contactError).message);
      } else if (contactPage) {
        createdPageIds.push(contactPage.id);
        console.log('Contact page created');
      }
    }

    console.log(`Site creation complete. Created ${createdPageIds.length} pages`);

    return {
      siteId,
      siteName: data.site_name,
      subdomain: finalSubdomain,
      pageIds: createdPageIds,
    };
  } catch (error: unknown) {
    const errorInfo = handleError(error);
    console.error('Site creation failed:', errorInfo.message);

    // Cleanup: Delete created site and pages if error occurred
    if (siteId) {
      console.log('Cleaning up failed site creation...');

      // Delete pages (cascading delete should handle this, but we'll be explicit)
      if (createdPageIds.length > 0) {
        await supabase.from('content').delete().in('id', createdPageIds);
      }

      // Delete site
      await supabase.from('sites').delete().eq('id', siteId);

      console.log('Cleanup complete');
    }

    throw new Error(`Site creation failed: ${errorInfo.message}`);
  }
}

/**
 * Gets the URL for a created site
 *
 * @param subdomain - Site subdomain
 * @returns Full URL to the site
 */
export function getSiteUrl(subdomain: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  return `${baseUrl}/${subdomain}`;
}

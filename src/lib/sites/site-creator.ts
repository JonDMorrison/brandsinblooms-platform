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
import type { GeneratedSiteData, CustomPageSection } from '@/lib/types/site-generation-jobs';
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
          ctaLink: '/contact',
          secondaryCtaText: 'Care Guides',
          secondaryCtaLink: '/watering',
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
          viewAllLink: '/home',
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
          ctaText: 'Get Started',
          ctaLink: '/contact',
          secondaryCtaText: 'Learn More',
          secondaryCtaLink: '/about'
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
          secondaryCtaText: 'Our Company',
          secondaryCtaLink: '/company',
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
          ctaText: 'Contact Us',
          ctaLink: '/contact',
          secondaryCtaText: 'Learn More',
          secondaryCtaLink: '/about'
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
  const hasAnyContactInfo = contact.email || contact.phone || contact.address || contact.hours;

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
          subheadline: hasAnyContactInfo
            ? 'We\'d love to hear from you. Reach out to us for questions, support, or just to say hello.'
            : 'We\'re updating our contact information. Please check back soon!'
        },
        settings: {
          backgroundColor: 'gradient'
        }
      },
      businessInfo: {
        type: 'businessInfo',
        order: 2,
        visible: true,
        data: hasAnyContactInfo ? {
          headline: 'Contact Information',
          email: contact.email || undefined,
          phone: contact.phone || undefined,
          address: contact.address ? {
            street: contact.address,
            city: '',
            state: '',
            zip: ''
          } : undefined,
          hours: contact.hours ? [
            { days: 'Monday - Friday', time: contact.hours }
          ] : undefined,
          socials: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: ''
          }
        } : {
          headline: 'Contact Information',
          message: "We're updating our contact information. Please check back soon for ways to reach us!"
        }
      },
      richText: {
        type: 'richText',
        order: 3,
        visible: true,
        data: {
          headline: hasAnyContactInfo ? 'We\'re Here to Help' : 'Coming Soon',
          content: hasAnyContactInfo
            ? 'Whether you have questions about our products, need support, or want to learn more about what we offer, our team is ready to assist you. We strive to respond to all inquiries within 24 hours during business days.<br><br>For urgent matters, please call us directly. For general inquiries, feel free to email us or visit our location during business hours.'
            : 'We\'re currently updating our contact information. In the meantime, feel free to visit us in person or check back soon for updated contact details.'
        }
      },
      faq: {
        type: 'faq',
        order: 4,
        visible: true,
        data: {
          headline: 'Frequently Asked Questions',
          description: '',
          faqs: hasAnyContactInfo ? [
            // Only include hours FAQ if hours are provided
            ...(contact.hours ? [{
              id: 'faq-1',
              order: 0,
              question: 'What are your business hours?',
              answer: `We are open ${contact.hours}.`
            }] : []),
            {
              id: 'faq-2',
              order: contact.hours ? 1 : 0,
              question: 'How can I reach customer support?',
              answer: [
                contact.phone && `You can reach us by phone at ${contact.phone}`,
                contact.email && `by email at ${contact.email}`,
                'We typically respond to inquiries within 24 hours during business days.'
              ].filter(Boolean).join(', ')
            },
            {
              id: 'faq-3',
              order: contact.hours ? 2 : 1,
              question: 'Do you offer consultations?',
              answer: 'Yes! We offer consultations to help you choose the right solutions for your needs. Contact us to schedule an appointment.'
            },
            // Only include location FAQ if address is provided
            ...(contact.address ? [{
              id: 'faq-4',
              order: contact.hours ? 3 : 2,
              question: 'Where are you located?',
              answer: `We are located at ${contact.address}. Parking is available on-site.`
            }] : [])
          ] : [
            // Generic FAQs when no contact info is available
            {
              id: 'faq-1',
              order: 0,
              question: 'How can I get in touch?',
              answer: 'We\'re currently updating our contact information. Please check back soon for updated ways to reach us.'
            },
            {
              id: 'faq-2',
              order: 1,
              question: 'Do you have a physical location?',
              answer: 'Yes! Check back soon for our address and visiting hours.'
            },
            {
              id: 'faq-3',
              order: 2,
              question: 'When will contact information be available?',
              answer: 'We\'re working on updating our site. Please check back soon for our full contact details.'
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
 * Helper: Create custom page content from CustomPageSection
 * Converts LLM-generated custom pages to PageContent structure
 */
function createCustomPageContent(customPage: CustomPageSection) {
  const sections: Record<string, unknown> = {
    header: {
      type: 'header',
      order: 1,
      visible: true,
      data: {
        headline: customPage.content.headline || customPage.title,
        subheadline: customPage.content.description || ''
      },
      settings: {
        backgroundColor: 'gradient'
      }
    }
  };

  // Add items section if items are provided
  if (customPage.content.items && customPage.content.items.length > 0) {
    // Determine section type based on pageType
    let sectionType = 'features';
    if (customPage.pageType === 'services') {
      sectionType = 'features';
    } else if (customPage.pageType === 'team') {
      sectionType = 'team';
    } else if (customPage.pageType === 'faq') {
      sectionType = 'faq';
    }

    sections.items = {
      type: sectionType,
      order: 2,
      visible: true,
      data: {
        headline: customPage.content.headline || customPage.title,
        description: customPage.content.description || '',
        items: customPage.content.items.map((item, index) => ({
          id: `${customPage.slug}-item-${index}`,
          title: item.title,
          description: item.description || '',
          content: item.content || item.description || '',
          icon: item.icon || 'Circle',
          order: index
        }))
      },
      settings: {
        backgroundColor: 'default'
      }
    };
  }

  // Add rich text section if richText is provided
  if (customPage.content.richText) {
    sections.richText = {
      type: 'richText',
      order: 3,
      visible: true,
      data: {
        headline: customPage.content.headline || customPage.title,
        content: customPage.content.richText
      },
      settings: {
        backgroundColor: 'alternate'
      }
    };
  }

  return {
    version: '1.0',
    layout: 'other',
    sections
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
 * @param logoUrl - Optional logo URL
 * @param scrapedContext - Optional scraped website context for enhanced features
 * @returns Site creation result
 * @throws Error if creation fails
 */
export async function createSiteFromGenerated(
  data: GeneratedSiteData,
  userId: string,
  logoUrl?: string,
  scrapedContext?: import('@/lib/types/site-generation-jobs').ScrapedWebsiteContext
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

    // Build navigation items including custom pages
    const navigationItems: Array<{
      label: string;
      href: string;
      children?: Array<{ label: string; href: string; description?: string }>;
    }> = [
      { label: 'Home', href: '/home' },
      { label: 'About', href: '/about' }
    ];

    // Add product/service categories if available from scraped context
    const productCategories = scrapedContext?.businessInfo?.structuredContent?.productCategories;
    if (productCategories && productCategories.length > 0) {
      // Determine if it's products or services based on category names
      const hasServices = productCategories.some((cat: { name: string }) =>
        cat.name.toLowerCase().includes('service') ||
        cat.name.toLowerCase().includes('consultation') ||
        cat.name.toLowerCase().includes('support')
      );

      const parentLabel = hasServices ? 'Services' : 'Products';

      // Create dropdown menu with categories
      navigationItems.push({
        label: parentLabel,
        href: '#', // Parent item doesn't navigate
        children: productCategories.map((category: { name: string; description?: string }) => ({
          label: category.name,
          href: `/${parentLabel.toLowerCase()}/${category.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')}`,
          description: category.description
        }))
      });

      console.log(`Added ${productCategories.length} product/service categories to navigation`);
    }

    // Add custom page links in the middle
    if (data.customPages && data.customPages.length > 0) {
      data.customPages.forEach(page => {
        navigationItems.push({
          label: page.title,
          href: `/${page.slug}`
        });
      });
    }

    // Add Contact at the end
    navigationItems.push({ label: 'Contact', href: '/contact' });

    // Extract footer content from scraped context
    const footerContent = scrapedContext?.businessInfo?.structuredContent?.footerContent;

    // Build footer links array
    const footerLinks: Array<{ text: string; url: string }> = [];

    // Add important links from scraped footer if available
    if (footerContent?.importantLinks && footerContent.importantLinks.length > 0) {
      footerLinks.push(...footerContent.importantLinks.map(link => ({
        text: link.text,
        url: link.url
      })));
      console.log(`Added ${footerContent.importantLinks.length} footer links from scraped content`);
    }

    // Determine copyright text - use scraped if available, otherwise generate
    const copyrightText = footerContent?.copyrightText ||
                         `© ${new Date().getFullYear()} ${data.site_name}. All rights reserved.`;

    if (footerContent?.copyrightText) {
      console.log('Using scraped footer copyright text');
    }

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
        url: logoUrl || null,
        text: data.site_name,
        position: 'left',
        size: 'medium',
        pixelSize: logoUrl ? 80 : undefined,
        displayType: logoUrl ? 'both' : undefined,
        description: data.branding?.logo_description || null
      },
      navigation: {
        items: navigationItems,
        style: 'horizontal'
      },
      footer: {
        style: 'centered',
        navigationItems: navigationItems, // Use same navigation items in footer
        socialLinks: [],
        copyright: copyrightText,
        links: footerLinks, // Include scraped footer links
        additionalInfo: footerContent?.additionalInfo || undefined
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
        logo_url: logoUrl || null,
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
          content_type: 'landing',
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
          content_type: 'about',
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

    // Create custom pages (if provided) - insert between About and Contact
    if (data.customPages && data.customPages.length > 0) {
      let sortOrder = 30; // Start after About (20), before Contact (80)

      for (const customPage of data.customPages) {
        try {
          const { data: customPageData, error: customPageError } = await supabase
            .from('content')
            .insert({
              site_id: siteId,
              title: customPage.title,
              slug: customPage.slug,
              content_type: 'other',
              content: createCustomPageContent(customPage),
              is_published: true,
              sort_order: sortOrder,
              author_id: userId,
            } as ContentInsert)
            .select('id')
            .single();

          if (customPageError) {
            console.error(`Failed to create custom page ${customPage.slug}:`, handleError(customPageError).message);
          } else if (customPageData) {
            createdPageIds.push(customPageData.id);
            console.log(`Custom page created: ${customPage.title} (${customPage.slug})`);
          }

          sortOrder += 10; // Increment for next custom page
        } catch (error: unknown) {
          console.error(`Error creating custom page ${customPage.slug}:`, handleError(error).message);
          // Continue with other pages
        }
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
          content_type: 'contact',
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

/**
 * Site Creator Module
 *
 * Creates sites and pages in the database from LLM-generated content.
 * Handles site creation, page creation with proper PageContent structure.
 *
 * AI-First Approach: Maximizes use of AI-generated data with minimal hardcoded defaults.
 */

import { createClient } from '@/src/lib/supabase/server';
import { handleError } from '@/src/lib/types/error-handling';
import type { GeneratedSiteData, CustomPageSection } from '@/src/lib/types/site-generation-jobs';
import type { Database } from '@/src/lib/database/types';

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
    version: '2.0',
    layout: 'landing',
    sections: [
      {
        id: 'hero',
        type: 'hero',
        order: 1,
        visible: true,
        settings: {},
        data: {
          headline: data.hero.headline,
          subheadline: data.hero.subheadline,
          ctaText: data.hero.cta_text,
          ctaLink: '/contact',
          secondaryCtaText: 'Care Guides',
          secondaryCtaLink: '/resources',
          backgroundImage: data.hero.background_image ? '/images/hero-placeholder.jpg' : undefined
        }
      },
      {
        id: 'features',
        type: 'featuresGrid',
        order: 2,
        visible: true,
        settings: {},
        data: {
          headline: data.features?.title || 'Why Choose Us',
          subheadline: data.features?.subtitle || 'We bring expertise and passion to every project',
          items: data.features?.features?.map((feature, index) => ({
            id: `feature-${index}`,
            title: feature.title,
            content: feature.description,
            icon: feature.icon || 'Star',
            order: index
          })) || []
        }
      },
      {
        id: 'about',
        type: 'text',
        order: 3,
        visible: true,
        settings: {},
        data: {
          content: `<h2>About ${data.site_name}</h2><p>${data.description}</p>`
        }
      },
      {
        id: 'cta',
        type: 'callToAction',
        order: 4,
        visible: true,
        settings: {},
        data: {
          headline: 'Ready to Transform Your Garden?',
          description: 'Contact us today to get started on your dream landscape.',
          ctaText: 'Contact Us',
          ctaLink: '/contact'
        }
      }
    ]
  }
}

/**
 * Helper: Create About page content from AI-generated data
 * Uses: about, values, features, tagline, description
 */
function createAboutPageContent(data: GeneratedSiteData) {
  return {
    version: '2.0',
    layout: 'about',
    sections: [
      {
        id: 'hero',
        type: 'hero',
        order: 1,
        visible: true,
        settings: {},
        data: {
          headline: 'About Us',
          subheadline: `Learn more about ${data.site_name}`,
          alignment: 'center'
        }
      },
      {
        id: 'mission',
        type: 'text',
        order: 2,
        visible: true,
        settings: {},
        data: {
          content: `<h2>Our Mission</h2><p>${data.about.mission || data.description}</p>`
        }
      },
      {
        id: 'values',
        type: 'featuresGrid',
        order: 3,
        visible: true,
        settings: {},
        data: {
          headline: data.values?.title || 'Our Values',
          items: data.values?.values?.map((value, index) => ({
            id: `value-${index}`,
            title: value.title,
            content: value.description,
            icon: value.icon || 'Star',
            order: index
          })) || []
        }
      }
    ]
  }
}

/**
 * Helper: Create Contact page content from AI-generated data
 * Uses: contact, testimonials (as FAQs)
 */
function createContactPageContent(data: GeneratedSiteData) {
  return {
    version: '2.0',
    layout: 'contact',
    sections: [
      {
        id: 'hero',
        type: 'hero',
        order: 1,
        visible: true,
        settings: {},
        data: {
          headline: 'Contact Us',
          subheadline: 'Get in touch with our team',
          alignment: 'center'
        }
      },
      {
        id: 'info',
        type: 'featuresGrid',
        order: 2,
        visible: true,
        settings: {},
        data: {
          items: [
            {
              id: 'contact-email',
              title: 'Email',
              content: data.contact.email || 'Not provided',
              icon: 'Mail',
              order: 0
            },
            {
              id: 'contact-phone',
              title: 'Phone',
              content: data.contact.phone || 'Not provided',
              icon: 'Phone',
              order: 1
            },
            {
              id: 'contact-address',
              title: 'Address',
              content: data.contact.address || 'Not provided',
              icon: 'MapPin',
              order: 2
            }
          ]
        }
      },
      {
        id: 'form',
        type: 'form',
        order: 3,
        visible: true,
        settings: {},
        data: {
          headline: 'Send us a message',
          fields: [
            { id: 'name', type: 'text', label: 'Name', required: true, order: 0 },
            { id: 'email', type: 'email', label: 'Email', required: true, order: 1 },
            { id: 'message', type: 'textarea', label: 'Message', required: true, order: 2 }
          ]
        }
      }
    ]
  }
}

/**
 * Helper: Create custom page content from CustomPageSection
 * Converts LLM-generated custom pages to PageContent structure
 */
function createCustomPageContent(customPage: CustomPageSection) {
  return {
    version: '2.0',
    layout: 'other',
    sections: [
      {
        id: 'header',
        type: 'header',
        order: 1,
        visible: true,
        settings: {},
        data: {
          headline: customPage.content.headline || customPage.title,
          subheadline: customPage.content.description || ''
        }
      },
      // Add items section if items are provided
      ...(customPage.content.items && customPage.content.items.length > 0 ? [{
        id: 'items',
        type: 'featuresGrid',
        order: 2,
        visible: true,
        settings: {},
        data: {
          headline: customPage.content.headline || customPage.title,
          items: customPage.content.items.map((item, index) => ({
            id: `item-${index}`,
            title: item.title,
            content: item.description || item.content,
            icon: item.icon || 'Star',
            order: index
          }))
        }
      }] : []),
      // Add rich text section if provided
      ...(customPage.content.richText ? [{
        id: 'content',
        type: 'text',
        order: 3,
        visible: true,
        settings: {},
        data: {
          content: customPage.content.richText
        }
      }] : [])
    ]
  }
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
        // Use extracted typography or fall back to font_family
        headingFont: data.branding?.typography?.heading?.fontFamily ||
          data.branding?.font_family?.split(',')[0]?.trim() ||
          'Inter',
        bodyFont: data.branding?.typography?.body?.fontFamily ||
          data.branding?.font_family?.split(',')[1]?.trim() ||
          'Inter',
        fontSize: 'medium',
        // Add extracted font weights if available
        headingWeight: data.branding?.typography?.heading?.fontWeight || '700',
        bodyWeight: data.branding?.typography?.body?.fontWeight || '400',
        // Add extracted text colors if available
        headingColor: data.branding?.typography?.heading?.textColor,
        bodyColor: data.branding?.typography?.body?.textColor,
        // Add line height if available
        bodyLineHeight: data.branding?.typography?.body?.lineHeight,
        // Add accent typography if available
        accentFont: data.branding?.typography?.accent?.fontFamily,
        accentWeight: data.branding?.typography?.accent?.fontWeight,
        accentColor: data.branding?.typography?.accent?.textColor
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
        displayType: logoUrl ? 'logo' : 'text',
        description: data.branding?.logo_description || null
      },
      navigation: {
        items: navigationItems,
        style: 'horizontal'
      },
      footer: {
        style: 'centered',
        navigationItems: navigationItems, // Use same navigation items in footer
        socialLinks: scrapedContext?.businessInfo?.socialLinks || [],
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

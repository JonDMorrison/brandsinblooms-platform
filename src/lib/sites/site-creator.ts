/**
 * Site Creator Module
 *
 * Creates sites and pages in the database from LLM-generated content.
 * Handles site creation, page creation, and error cleanup.
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
 *
 * @param siteName - Site name to convert
 * @returns URL-safe subdomain
 */
function generateSubdomain(siteName: string): string {
  return siteName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Creates a site and pages from generated content
 *
 * This function:
 * 1. Creates the site record with branding
 * 2. Creates page records for each section (hero, about, values, etc.)
 * 3. Returns site ID and metadata
 * 4. Cleans up on error
 *
 * @param data - Generated site data from LLM
 * @param userId - Owner user ID
 * @returns Site creation result
 * @throws Error if creation fails
 *
 * @example
 * ```ts
 * const result = await createSiteFromGenerated(generatedData, userId);
 * console.log('Created site:', result.siteId);
 * console.log('Created pages:', result.pageIds.length);
 * ```
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
        theme_settings: {
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
            footerStyle: 'minimal',
            menuStyle: 'horizontal'
          },
          logo: {
            url: null,
            position: 'left',
            size: 'medium',
            description: data.branding?.logo_description || null
          },
          // Store original branding and SEO for reference
          _generated: {
            branding: data.branding,
            seo: data.seo
          }
        },
        is_active: true,
        is_published: false, // Requires manual review before publishing
        created_by: userId,
      })
      .select('id')
      .single();

    if (siteError || !site) {
      throw new Error(`Failed to create site: ${handleError(siteError).message}`);
    }

    siteId = site.id;
    console.log('Site created:', siteId);

    // Create page for hero section
    if (data.hero) {
      const { data: heroPage, error: heroError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: 'Home - Hero',
          slug: 'hero',
          content_type: 'hero',
          content: data.hero,
          is_published: true,
          sort_order: 10,
          author_id: userId,
        } as ContentInsert)
        .select('id')
        .single();

      if (heroError) {
        console.error('Failed to create hero page:', handleError(heroError).message);
      } else if (heroPage) {
        createdPageIds.push(heroPage.id);
      }
    }

    // Create About page
    if (data.about) {
      const { data: aboutPage, error: aboutError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: data.about.title || 'About Us',
          slug: 'about',
          content_type: 'about',
          content: data.about,
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
      }
    }

    // Create Values page (optional)
    if (data.values) {
      const { data: valuesPage, error: valuesError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: data.values.title || 'Our Values',
          slug: 'values',
          content_type: 'values',
          content: data.values,
          is_published: true,
          sort_order: 30,
          author_id: userId,
        } as ContentInsert)
        .select('id')
        .single();

      if (valuesError) {
        console.error('Failed to create values page:', handleError(valuesError).message);
      } else if (valuesPage) {
        createdPageIds.push(valuesPage.id);
      }
    }

    // Create Features page (optional)
    if (data.features) {
      const { data: featuresPage, error: featuresError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: data.features.title || 'Features',
          slug: 'features',
          content_type: 'features',
          content: data.features,
          is_published: true,
          sort_order: 40,
          author_id: userId,
        } as ContentInsert)
        .select('id')
        .single();

      if (featuresError) {
        console.error('Failed to create features page:', handleError(featuresError).message);
      } else if (featuresPage) {
        createdPageIds.push(featuresPage.id);
      }
    }

    // Create Services page (optional)
    if (data.services) {
      const { data: servicesPage, error: servicesError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: data.services.title || 'Our Services',
          slug: 'services',
          content_type: 'services',
          content: data.services,
          is_published: true,
          sort_order: 50,
          author_id: userId,
        } as ContentInsert)
        .select('id')
        .single();

      if (servicesError) {
        console.error('Failed to create services page:', handleError(servicesError).message);
      } else if (servicesPage) {
        createdPageIds.push(servicesPage.id);
      }
    }

    // Create Team page (optional)
    if (data.team) {
      const { data: teamPage, error: teamError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: data.team.title || 'Our Team',
          slug: 'team',
          content_type: 'team',
          content: data.team,
          is_published: true,
          sort_order: 60,
          author_id: userId,
        } as ContentInsert)
        .select('id')
        .single();

      if (teamError) {
        console.error('Failed to create team page:', handleError(teamError).message);
      } else if (teamPage) {
        createdPageIds.push(teamPage.id);
      }
    }

    // Create Testimonials page (optional)
    if (data.testimonials) {
      const { data: testimonialsPage, error: testimonialsError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: data.testimonials.title || 'Testimonials',
          slug: 'testimonials',
          content_type: 'testimonials',
          content: data.testimonials,
          is_published: true,
          sort_order: 70,
          author_id: userId,
        } as ContentInsert)
        .select('id')
        .single();

      if (testimonialsError) {
        console.error('Failed to create testimonials page:', handleError(testimonialsError).message);
      } else if (testimonialsPage) {
        createdPageIds.push(testimonialsPage.id);
      }
    }

    // Create Contact page
    if (data.contact) {
      const { data: contactPage, error: contactError } = await supabase
        .from('content')
        .insert({
          site_id: siteId,
          title: data.contact.title || 'Contact Us',
          slug: 'contact',
          content_type: 'contact',
          content: data.contact,
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
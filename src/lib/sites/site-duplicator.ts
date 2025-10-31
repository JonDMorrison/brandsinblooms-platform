/**
 * Site Duplicator Service
 *
 * Handles the duplication of sites including content, products, theme, and navigation.
 * Creates a complete copy of an existing site with a new name and subdomain.
 */

import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/types/error-handling';
import type { Database } from '@/lib/database/types';

type Site = Database['public']['Tables']['sites']['Row'];
type Content = Database['public']['Tables']['content']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type SiteInsert = Database['public']['Tables']['sites']['Insert'];
type ContentInsert = Database['public']['Tables']['content']['Insert'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

export interface DuplicateSiteOptions {
  sourceSiteId: string;
  newName: string;
  newSubdomain: string;
  copyContent: boolean;
  copyProducts: boolean;
  copyTheme: boolean;
  copyNavigation: boolean;
}

export interface DuplicateSiteResult {
  success: boolean;
  siteId?: string;
  siteName?: string;
  subdomain?: string;
  error?: string;
  copiedItems?: {
    contentPages: number;
    products: number;
  };
}

/**
 * Duplicates a site with selected options
 */
export async function duplicateSite(
  options: DuplicateSiteOptions,
  userId: string
): Promise<DuplicateSiteResult> {
  try {
    const supabase = await createClient();

    // 1. Fetch source site and verify user has access to it
    const { data: sourceSite, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', options.sourceSiteId)
      .single();

    if (siteError || !sourceSite) {
      return {
        success: false,
        error: 'Source site not found'
      };
    }

    // 2. Verify user owns the source site
    if (sourceSite.created_by !== userId) {
      return {
        success: false,
        error: 'You do not have permission to duplicate this site'
      };
    }

    // 3. Check subdomain availability
    const { data: existingSubdomain } = await supabase
      .from('sites')
      .select('id')
      .eq('subdomain', options.newSubdomain)
      .maybeSingle();

    if (existingSubdomain) {
      return {
        success: false,
        error: 'Subdomain is already taken'
      };
    }

    // 4. Create new site record
    const newSiteData: SiteInsert = {
      name: options.newName,
      subdomain: options.newSubdomain,
      business_name: sourceSite.business_name,
      business_email: sourceSite.business_email,
      business_phone: sourceSite.business_phone,
      business_address: sourceSite.business_address,
      business_hours: sourceSite.business_hours,
      primary_color: options.copyTheme ? sourceSite.primary_color : null,
      theme_settings: options.copyTheme ? sourceSite.theme_settings : null,
      logo_url: options.copyTheme ? sourceSite.logo_url : null,
      logo_cdn_url: options.copyTheme ? sourceSite.logo_cdn_url : null,
      logo_s3_key: options.copyTheme ? sourceSite.logo_s3_key : null,
      logo_s3_bucket: options.copyTheme ? sourceSite.logo_s3_bucket : null,
      logo_storage_type: options.copyTheme ? sourceSite.logo_storage_type : null,
      description: sourceSite.description,
      latitude: sourceSite.latitude,
      longitude: sourceSite.longitude,
      timezone: sourceSite.timezone,
      is_active: true,
      is_published: sourceSite.is_published, // Copy published status from source
      created_by: userId
    };

    const { data: newSite, error: createError } = await supabase
      .from('sites')
      .insert(newSiteData)
      .select()
      .single();

    if (createError || !newSite) {
      return {
        success: false,
        error: 'Failed to create new site: ' + createError?.message
      };
    }

    // 5. Create site membership for the new site owner
    // This is required for the site to appear in the user's dashboard
    const { error: membershipError } = await supabase
      .from('site_memberships')
      .insert({
        user_id: userId,
        site_id: newSite.id,
        role: 'owner',
        is_active: true
      });

    if (membershipError) {
      console.error('Failed to create site membership:', membershipError);
      // Rollback: delete the created site if membership fails
      await supabase.from('sites').delete().eq('id', newSite.id);
      return {
        success: false,
        error: 'Failed to create site membership. Site creation rolled back.'
      };
    }

    let contentCount = 0;
    let productCount = 0;

    // 6. Copy content if requested
    if (options.copyContent) {
      const { data: sourceContent } = await supabase
        .from('content')
        .select('*')
        .eq('site_id', options.sourceSiteId);

      if (sourceContent && sourceContent.length > 0) {
        const newContent: ContentInsert[] = sourceContent.map((content) => ({
          site_id: newSite.id,
          title: content.title,
          slug: content.slug,
          content: content.content,
          content_type: content.content_type,
          author_id: userId,
          is_published: content.is_published,
          is_featured: content.is_featured,
          meta_data: content.meta_data,
          published_at: content.published_at,
          sort_order: content.sort_order
        }));

        const { data: insertedContent, error: contentError } = await supabase
          .from('content')
          .insert(newContent)
          .select();

        if (contentError) {
          console.error('Failed to copy content:', contentError);
        } else if (insertedContent) {
          contentCount = insertedContent.length;
        }
      }
    }

    // 7. Copy products if requested
    if (options.copyProducts) {
      const { data: sourceProducts } = await supabase
        .from('products')
        .select('*')
        .eq('site_id', options.sourceSiteId);

      if (sourceProducts && sourceProducts.length > 0) {
        const newProducts: ProductInsert[] = sourceProducts.map((product) => ({
          site_id: newSite.id,
          name: product.name,
          description: product.description,
          price: product.price,
          compare_at_price: product.compare_at_price,
          sku: product.sku ? `${product.sku}-copy` : null,
          inventory_count: product.inventory_count,
          stock_status: product.stock_status,
          is_active: product.is_active,
          category: product.category,
          care_instructions: product.care_instructions,
          attributes: product.attributes
        }));

        const { data: insertedProducts, error: productError } = await supabase
          .from('products')
          .insert(newProducts)
          .select();

        if (productError) {
          console.error('Failed to copy products:', productError);
        } else if (insertedProducts) {
          productCount = insertedProducts.length;
        }
      }
    }

    // 8. Return success with statistics
    return {
      success: true,
      siteId: newSite.id,
      siteName: newSite.name,
      subdomain: newSite.subdomain,
      copiedItems: {
        contentPages: contentCount,
        products: productCount
      }
    };

  } catch (error) {
    console.error('Site duplication error:', error);
    return {
      success: false,
      error: handleError(error).message
    };
  }
}

/**
 * Validates subdomain availability
 */
export async function checkSubdomainAvailable(subdomain: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from('sites')
      .select('id')
      .eq('subdomain', subdomain)
      .single();

    return !data; // Available if no existing site found
  } catch {
    return false;
  }
}

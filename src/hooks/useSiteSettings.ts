'use client';

import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSupabase } from '@/hooks/useSupabase';
import { useSiteId } from '@/src/contexts/SiteContext';
import { useSitePermissions } from '@/hooks/useSite';
import { updateSite } from '@/lib/queries/domains/sites';
import { isSubdomainAvailable } from '@/lib/site/queries';
import { validateSiteForUpdate } from '@/lib/site/validation';
import { handleError } from '@/lib/types/error-handling';
import { Tables, TablesUpdate } from '@/lib/database/types';

type Site = Tables<'sites'>;
type SiteUpdate = TablesUpdate<'sites'>;

export interface SiteSettingsData {
  name: string;
  description?: string;
  subdomain: string;
  timezone?: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
}

export function useUpdateSiteSettings() {
  const supabase = useSupabase();
  const siteId = useSiteId();
  const { canManage } = useSitePermissions();

  return useSupabaseMutation(
    async (settings: SiteSettingsData, signal: AbortSignal) => {
      if (!siteId) {
        throw new Error('No site ID available');
      }

      if (!canManage) {
        throw new Error('You do not have permission to update site settings');
      }

      // Prepare the site data for validation and update
      const siteData: SiteUpdate = {
        name: settings.name,
        description: settings.description || null,
        subdomain: settings.subdomain,
        timezone: settings.timezone || null,
        business_name: settings.business_name || null,
        business_email: settings.business_email || null,
        business_phone: settings.business_phone || null,
        business_address: settings.business_address || null,
      };

      // For subdomain validation, we'll need to get current site data
      // This is a simplified approach - in a real implementation you might
      // want to pass the current site data as part of the settings
      const { data: currentSite } = await supabase
        .from('sites')
        .select('subdomain')
        .eq('id', siteId)
        .single();
      
      // Check if subdomain has changed and validate availability if so
      if (currentSite && settings.subdomain !== currentSite.subdomain) {
        const availabilityResult = await isSubdomainAvailable(
          settings.subdomain,
          siteId // Exclude current site from availability check
        );

        if (availabilityResult.error) {
          throw new Error('Could not verify subdomain availability. Please try again.');
        }

        if (availabilityResult.data === false) {
          throw new Error('This subdomain is already taken. Please choose another one.');
        }
      }

      // Validate the site data
      const validationResult = await validateSiteForUpdate(siteId, siteData, {
        checkAvailability: false, // We already checked availability above
        useServer: false
      });

      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors.map(error => error.message);
        throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
      }

      // Update the site
      return await updateSite(supabase, siteId, siteData);
    },
    {
      showSuccessToast: 'Site settings saved successfully',
      onSuccess: () => {
        // Only clear specific cache keys instead of all site-related data
        if (typeof window !== 'undefined' && siteId) {
          // Only clear the specific settings cache, not all site data
          localStorage.removeItem(`site-settings-${siteId}`)
          localStorage.removeItem('user-sites') // Only clear user sites list
        }
      }
    }
  );
}
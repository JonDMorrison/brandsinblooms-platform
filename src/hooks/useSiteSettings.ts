'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const siteId = useSiteId();
  const { canManage } = useSitePermissions();

  return useMutation({
    mutationFn: async (settings: SiteSettingsData) => {
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

      // Get current site to compare subdomain changes
      const currentSiteQueryKey = ['site', siteId];
      const currentSite = queryClient.getQueryData<Site>(currentSiteQueryKey);
      
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

    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['site', siteId] });

      // Snapshot the previous value
      const previousSite = queryClient.getQueryData<Site>(['site', siteId]);

      // Optimistically update to the new value
      if (previousSite) {
        queryClient.setQueryData<Site>(['site', siteId], (old) => {
          if (!old) return old;

          return {
            ...old,
            name: newSettings.name,
            description: newSettings.description || null,
            subdomain: newSettings.subdomain,
            timezone: newSettings.timezone || null,
            business_name: newSettings.business_name || null,
            business_email: newSettings.business_email || null,
            business_phone: newSettings.business_phone || null,
            business_address: newSettings.business_address || null,
            updated_at: new Date().toISOString(),
          };
        });

        // Also update the sites list if it exists in cache
        queryClient.setQueryData(['user-sites'], (oldSites: any) => {
          if (!oldSites || !Array.isArray(oldSites)) return oldSites;

          return oldSites.map((siteWithAccess: any) => {
            if (siteWithAccess.site?.id === siteId) {
              return {
                ...siteWithAccess,
                site: {
                  ...siteWithAccess.site,
                  name: newSettings.name,
                  description: newSettings.description || null,
                  subdomain: newSettings.subdomain,
                  timezone: newSettings.timezone || null,
                  business_name: newSettings.business_name || null,
                  business_email: newSettings.business_email || null,
                  business_phone: newSettings.business_phone || null,
                  business_address: newSettings.business_address || null,
                  updated_at: new Date().toISOString(),
                }
              };
            }
            return siteWithAccess;
          });
        });
      }

      // Return a context object with the snapshotted value
      return { previousSite };
    },

    onError: (err: unknown, _newSettings, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSite) {
        queryClient.setQueryData(['site', siteId], context.previousSite);
      }

      const errorDetails = handleError(err);
      toast.error(errorDetails.message);
    },

    onSuccess: (updatedSite) => {
      toast.success('Site settings saved successfully');
      
      // Update the cache with the actual returned site data
      queryClient.setQueryData(['site', siteId], updatedSite);
    },

    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      queryClient.invalidateQueries({ queryKey: ['user-sites'] });
    },
  });
}
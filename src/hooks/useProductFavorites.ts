'use client'

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { useSiteId } from '@/src/contexts/SiteContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useProfile } from '@/src/contexts/ProfileContext';
import { supabase } from '@/src/lib/supabase/client';
import { getUserFavorites, toggleFavorite } from '@/src/lib/queries/domains/favorites';
import { handleError } from '@/src/lib/types/error-handling';
import { toast } from 'sonner';
import { queryKeys } from '@/src/lib/queries/keys';

export function useProductFavorites() {
  const siteId = useSiteId();
  const { user } = useAuth();
  const { profileId } = useProfile();

  const { data: favorites = [], loading } = useSupabaseQuery(
    (signal) => getUserFavorites(supabase, siteId!),
    {
      enabled: !!siteId && !!profileId,
      initialData: [],
    }
  );

  const toggleFavoriteMutation = useSupabaseMutation(
    ({ productId, isFavorite }: { productId: string; isFavorite: boolean }, signal) => {
      if (!profileId) {
        throw new Error('Profile not found. Please ensure your profile is set up.');
      }
      if (!siteId) {
        throw new Error('No site context available');
      }
      return toggleFavorite(supabase, productId, siteId, profileId, isFavorite);
    },
    {
      onSuccess: (newFavoriteStatus, { isFavorite }) => {
        toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
      },
      onError: (error) => {
        toast.error(`Failed to update favorite: ${error.message}`);
      },
    }
  );

  const isFavorite = (productId: string) => 
    favorites.some((f: { product_id?: string }) => f.product_id === productId);

  const handleToggleFavorite = (params: { productId: string; isFavorite: boolean }) => {
    if (!user) {
      toast.error('Please log in to add favorites');
      return;
    }
    if (!profileId) {
      toast.error('Setting up your profile...');
      return;
    }
    toggleFavoriteMutation.mutate(params);
  };

  return {
    favorites,
    isLoading: loading,
    toggleFavorite: handleToggleFavorite,
    isFavorite,
    isToggling: toggleFavoriteMutation.loading,
    isAuthenticated: !!user,
  };
}
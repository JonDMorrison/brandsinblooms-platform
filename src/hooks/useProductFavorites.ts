'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', siteId, profileId],
    queryFn: () => getUserFavorites(supabase, siteId!),
    enabled: !!siteId && !!profileId,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ productId, isFavorite }: { productId: string; isFavorite: boolean }) => {
      if (!profileId) {
        throw new Error('Profile not found. Please ensure your profile is set up.');
      }
      if (!siteId) {
        throw new Error('No site context available');
      }
      return toggleFavorite(supabase, productId, siteId, profileId, isFavorite);
    },
    onMutate: async ({ productId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', siteId, profileId] });
      
      const previousFavorites = queryClient.getQueryData(['favorites', siteId, profileId]);
      
      queryClient.setQueryData(['favorites', siteId, profileId], (old: unknown[]) => {
        if (!Array.isArray(old)) return old;
        
        if (isFavorite) {
          // Remove from favorites
          return old.filter((f: { product_id?: string }) => f.product_id !== productId);
        } else {
          // Add to favorites
          return [...old, { 
            product_id: productId, 
            profile_id: profileId!, 
            site_id: siteId,
            created_at: new Date().toISOString()
          }];
        }
      });
      
      return { previousFavorites };
    },
    onError: (err: unknown, variables, context) => {
      queryClient.setQueryData(['favorites', siteId, profileId], context?.previousFavorites);
      const error = handleError(err);
      toast.error(`Failed to update favorite: ${error.message}`);
    },
    onSuccess: (newFavoriteStatus, { isFavorite }) => {
      toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
      // Invalidate product queries to update favorite counts
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists(siteId!) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', siteId, profileId] });
    }
  });

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
    isLoading,
    toggleFavorite: handleToggleFavorite,
    isFavorite,
    isToggling: toggleFavoriteMutation.isPending,
    isAuthenticated: !!user,
  };
}
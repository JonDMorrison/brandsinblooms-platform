'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { uploadMedia } from '@/lib/queries/domains/media';
import { handleError } from '@/lib/types/error-handling';
import { Tables, TablesUpdate } from '@/lib/database/types';

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

export interface ProfileFormData {
  fullName: string;
  username: string;
  email: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar_url?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Prepare the profile data
      const profileData: ProfileUpdate = {
        full_name: data.fullName,
        username: data.username,
        email: data.email,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
        updated_at: new Date().toISOString(),
      };

      // Update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Update auth.users metadata
      const { error: authError } = await supabase.auth.updateUser({
        email: data.email,
        data: {
          full_name: data.fullName,
          username: data.username,
          bio: data.bio,
          website: data.website,
          location: data.location,
          avatar_url: data.avatar_url,
        }
      });

      if (authError) {
        throw authError;
      }

      return { success: true };
    },
    onMutate: async (newData) => {
      if (!user) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile', user.id] });
      
      // Snapshot the previous value
      const previousUser = user;
      
      // Optimistically update user context (this would happen naturally through auth state change)
      // We don't directly update the user state here as it's managed by AuthContext
      
      // Return a context object with the snapshotted value
      return { previousUser };
    },
    onError: (err: unknown, newData, context) => {
      // Handle the error
      const errorDetails = handleError(err);
      toast.error(`Failed to update profile: ${errorDetails.message}`);
      
      // The auth state will revert naturally if the mutation failed
      console.error('Profile update error:', errorDetails);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      
      // Invalidate and refetch profile-related queries
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }
    },
  });
}

export function useUploadAvatar() {
  const supabase = useSupabase();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Since we don't have a site context for user avatars, we'll use a generic approach
      // Upload to a user-specific path in the media storage
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `avatars/${user.id}/${fileName}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload avatar: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);

      return publicUrl;
    },
    onError: (err: unknown) => {
      const errorDetails = handleError(err);
      toast.error(`Failed to upload avatar: ${errorDetails.message}`);
    },
    onSuccess: () => {
      toast.success('Avatar uploaded successfully');
    },
  });
}

export function useDeleteAvatar() {
  const supabase = useSupabase();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (avatarUrl: string) => {
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Extract path from URL
      const url = new URL(avatarUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/media\/(.*)/);
      
      if (pathMatch && pathMatch[1]) {
        // Delete from storage
        const { error } = await supabase.storage
          .from('media')
          .remove([pathMatch[1]]);

        if (error) {
          throw new Error(`Failed to delete avatar: ${error.message}`);
        }
      }

      // Update profile to remove avatar_url
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          avatar_url: null,
        }
      });

      if (authError) {
        throw authError;
      }

      return { success: true };
    },
    onError: (err: unknown) => {
      const errorDetails = handleError(err);
      toast.error(`Failed to delete avatar: ${errorDetails.message}`);
    },
    onSuccess: () => {
      toast.success('Avatar deleted successfully');
    },
  });
}
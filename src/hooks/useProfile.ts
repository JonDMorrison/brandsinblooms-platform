'use client';

import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { toast } from 'sonner';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { uploadMedia } from '@/src/lib/queries/domains/media';
import { handleError } from '@/src/lib/types/error-handling';
import { Tables, TablesUpdate } from '@/src/lib/database/types';

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

export interface ProfileFormData {
  fullName: string;
}

export function useUpdateProfile() {
  const supabase = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    async (data: ProfileFormData, signal: AbortSignal) => {
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Prepare the profile data
      const profileData: ProfileUpdate = {
        full_name: data.fullName,
        updated_at: new Date().toISOString(),
      };

      // Update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .abortSignal(signal);

      if (profileError) {
        throw profileError;
      }

      // Update auth.users metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
        }
      });

      if (authError) {
        throw authError;
      }

      return { success: true };
    },
    {
      showSuccessToast: 'Profile updated successfully'
    }
  );
}

export function useUploadAvatar() {
  const supabase = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    async (file: File, signal: AbortSignal): Promise<string> => {
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
    {
      showSuccessToast: 'Avatar uploaded successfully'
    }
  );
}

export function useDeleteAvatar() {
  const supabase = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation(
    async (avatarUrl: string, signal: AbortSignal) => {
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
        .eq('user_id', user.id)
        .abortSignal(signal);

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
    {
      showSuccessToast: 'Avatar deleted successfully'
    }
  );
}
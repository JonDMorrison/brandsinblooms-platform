'use client';

import { useSupabaseQuery } from '@/hooks/base/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/base/useSupabaseMutation';
import { toast } from 'sonner';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { handleError } from '@/lib/types/error-handling';
import { Tables, TablesInsert, TablesUpdate } from '@/lib/database/types';

type NotificationPreferences = Tables<'notification_preferences'>;
type NotificationPreferencesInsert = TablesInsert<'notification_preferences'>;
type NotificationPreferencesUpdate = TablesUpdate<'notification_preferences'>;

export interface NotificationPreferencesFormData {
  email_marketing: boolean;
  email_updates: boolean;
  push_enabled: boolean;
  digest_frequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

// Default preferences for new users
const DEFAULT_PREFERENCES: NotificationPreferencesFormData = {
  email_marketing: true,
  email_updates: true,
  push_enabled: false,
  digest_frequency: 'weekly',
};

/**
 * Hook to fetch user's notification preferences
 */
export function useNotificationPreferences() {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useSupabaseQuery<NotificationPreferencesFormData>(
    async (signal): Promise<NotificationPreferencesFormData> => {
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('email_marketing, email_updates, push_enabled, digest_frequency')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      // If no preferences exist, return defaults
      if (!data) {
        return DEFAULT_PREFERENCES;
      }

      return {
        email_marketing: data.email_marketing,
        email_updates: data.email_updates,
        push_enabled: data.push_enabled,
        digest_frequency: data.digest_frequency as 'daily' | 'weekly' | 'monthly' | 'never',
      };
    },
    {
      enabled: !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
      persistKey: user ? `notification-preferences-${user.id}` : undefined,
    }
  );
}

/**
 * Hook to update notification preferences with optimistic updates
 */
export function useUpdateNotificationPreferences() {
  const supabase = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation<NotificationPreferences, NotificationPreferencesFormData>(
    async (preferences: NotificationPreferencesFormData, signal: AbortSignal): Promise<NotificationPreferences> => {
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Check if preferences already exist
      const { data: existingPreferences } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingPreferences) {
        // Update existing preferences
        const updateData: NotificationPreferencesUpdate = {
          email_marketing: preferences.email_marketing,
          email_updates: preferences.email_updates,
          push_enabled: preferences.push_enabled,
          digest_frequency: preferences.digest_frequency,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('notification_preferences')
          .update(updateData)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data;
      } else {
        // Create new preferences
        const insertData: NotificationPreferencesInsert = {
          user_id: user.id,
          email_marketing: preferences.email_marketing,
          email_updates: preferences.email_updates,
          push_enabled: preferences.push_enabled,
          digest_frequency: preferences.digest_frequency,
        };

        const { data, error } = await supabase
          .from('notification_preferences')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data;
      }
    },
    {
      showSuccessToast: 'Notification preferences saved successfully',
      showErrorToast: true
    }
  );
}

/**
 * Hook to create initial notification preferences for a user
 * This can be called during user onboarding or first settings visit
 */
export function useCreateNotificationPreferences() {
  const supabase = useSupabase();
  const { user } = useAuth();
  
  return useSupabaseMutation<NotificationPreferences, Partial<NotificationPreferencesFormData>>(
    async (preferences: Partial<NotificationPreferencesFormData> = {}, signal: AbortSignal): Promise<NotificationPreferences> => {
      if (!user) {
        throw new Error('No authenticated user');
      }

      const insertData: NotificationPreferencesInsert = {
        user_id: user.id,
        email_marketing: preferences.email_marketing ?? DEFAULT_PREFERENCES.email_marketing,
        email_updates: preferences.email_updates ?? DEFAULT_PREFERENCES.email_updates,
        push_enabled: preferences.push_enabled ?? DEFAULT_PREFERENCES.push_enabled,
        digest_frequency: preferences.digest_frequency ?? DEFAULT_PREFERENCES.digest_frequency,
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    {
      showSuccessToast: false,
      showErrorToast: true
    }
  );
}
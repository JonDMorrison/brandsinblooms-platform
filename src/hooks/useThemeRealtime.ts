'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useRealtimeSubscription } from './useRealtime';
import { useSiteId } from '@/src/contexts/SiteContext';
import { queryKeys } from '@/lib/queries/keys';
import { ThemeSettings } from '@/lib/queries/domains/theme';
import { applyThemeToDOM } from '@/lib/queries/domains/theme';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteTheme } from './useSiteTheme';

interface UseThemeRealtimeOptions {
  enabled?: boolean;
  onThemeUpdated?: (theme: ThemeSettings, updatedBy: string) => void;
  showNotifications?: boolean;
  autoApplyTheme?: boolean;
}

interface SiteWithTheme {
  id: string;
  theme_settings: ThemeSettings | null;
  updated_by?: string;
}

/**
 * Real-time subscription hook for collaborative theme editing
 * Subscribes to sites table theme_settings column changes
 * Applies theme changes immediately to DOM
 */
export function useThemeRealtime({
  enabled = true,
  onThemeUpdated,
  showNotifications = true,
  autoApplyTheme = true,
}: UseThemeRealtimeOptions = {}) {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const lastUpdateTime = useRef<number>(0);
  const isUpdatingLocally = useRef(false);

  // Subscribe to sites table changes for theme_settings
  const channel = useRealtimeSubscription({
    table: 'sites',
    event: 'UPDATE',
    filter: `id=eq.${siteId}`,
    enabled: enabled && !!siteId,
    onUpdate: (payload: RealtimePostgresChangesPayload<SiteWithTheme>) => {
      const updatedSite = payload.new;
      const previousSite = payload.old as SiteWithTheme;
      
      // Check if theme_settings actually changed
      const updatedTheme = 'theme_settings' in updatedSite ? updatedSite.theme_settings : null;
      const previousTheme = 'theme_settings' in previousSite ? previousSite.theme_settings : null;
      const themeChanged = JSON.stringify(updatedTheme) !== JSON.stringify(previousTheme);
      
      if (!themeChanged) return;
      
      // Prevent feedback loops from own updates
      const now = Date.now();
      if (isUpdatingLocally.current || (now - lastUpdateTime.current) < 1000) {
        return;
      }
      lastUpdateTime.current = now;
      
      const newTheme = 'theme_settings' in updatedSite ? updatedSite.theme_settings : null;
      if (!newTheme) return;
      
      // Update cache
      queryClient.setQueryData(
        queryKeys.theme.settings(siteId!),
        newTheme
      );
      
      // Apply theme to DOM if enabled
      if (autoApplyTheme) {
        applyThemeToDOM(newTheme);
      }
      
      // Show notification
      const updatedBy = 'updated_by' in updatedSite ? updatedSite.updated_by : null;
      if (showNotifications && updatedBy !== user?.id) {
        toast.info('Theme updated', {
          description: 'Another user has updated the theme settings',
          action: {
            label: 'Refresh',
            onClick: () => {
              // Force refetch to ensure consistency
              queryClient.invalidateQueries({
                queryKey: queryKeys.theme.settings(siteId!),
              });
            },
          },
        });
      }
      
      // Call custom handler
      onThemeUpdated?.(newTheme, updatedBy || 'Unknown');
    },
  });

  // Track local updates to prevent feedback loops
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.query.queryKey[0] === 'sites' &&
        event.query.queryKey[1] === siteId &&
        event.query.queryKey[2] === 'theme'
      ) {
        isUpdatingLocally.current = true;
        setTimeout(() => {
          isUpdatingLocally.current = false;
        }, 2000); // Reset after 2 seconds
      }
    });

    return unsubscribe;
  }, [queryClient, siteId]);

  return channel;
}

/**
 * Hook for collaborative theme editing presence
 * Shows who else is currently editing the theme
 */
export function useThemeEditorPresence() {
  const siteId = useSiteId();
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const presenceState = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (!siteId || !user) return;

    const channelName = `theme-editor-${siteId}`;
    
    // Import supabase client
    import('@/lib/supabase/client').then(({ supabase }) => {
      channelRef.current = supabase
        .channel(channelName, {
          config: {
            presence: {
              key: user.id,
            },
          },
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channelRef.current?.presenceState() || {};
          presenceState.current.clear();
          
          Object.entries(state).forEach(([key, presences]: [string, any]) => {
            if (Array.isArray(presences) && presences.length > 0) {
              const presence = presences[0];
              if (presence.user_id !== user.id) {
                presenceState.current.set(key, presence);
              }
            }
          });
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (newPresences[0]?.user_id !== user.id) {
            presenceState.current.set(key, newPresences[0]);
            
            toast.info('Theme editor joined', {
              description: `${newPresences[0]?.user_name || 'Someone'} is now editing the theme`,
            });
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          const leftUser = presenceState.current.get(key);
          presenceState.current.delete(key);
          
          if (leftUser) {
            toast.info('Theme editor left', {
              description: `${leftUser.user_name || 'Someone'} stopped editing the theme`,
            });
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && channelRef.current) {
            await channelRef.current.track({
              user_id: user.id,
              user_name: user.email?.split('@')[0] || 'User',
              editing_at: new Date().toISOString(),
            });
          }
        });
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        import('@/lib/supabase/client').then(({ supabase }) => {
          supabase.removeChannel(channelRef.current);
        });
        channelRef.current = null;
      }
    };
  }, [siteId, user]);

  return {
    activeEditors: Array.from(presenceState.current.values()),
    isOthersEditing: presenceState.current.size > 0,
  };
}

/**
 * Hook for theme change conflict resolution
 * Useful when multiple users are editing theme simultaneously
 */
export function useThemeConflictResolution() {
  const siteId = useSiteId();
  const queryClient = useQueryClient();
  const { theme: currentTheme } = useSiteTheme();
  const pendingChanges = useRef<ThemeSettings | null>(null);

  const handleConflict = (
    localTheme: ThemeSettings,
    remoteTheme: ThemeSettings,
    onResolve: (theme: ThemeSettings) => void
  ) => {
    // Store pending changes
    pendingChanges.current = localTheme;
    
    // Show conflict resolution dialog
    toast.warning('Theme conflict detected', {
      description: 'Another user has made changes to the theme. What would you like to do?',
      duration: Infinity,
      action: {
        label: 'Keep Mine',
        onClick: () => {
          onResolve(localTheme);
          pendingChanges.current = null;
        },
      },
      cancel: {
        label: 'Use Theirs',
        onClick: () => {
          onResolve(remoteTheme);
          applyThemeToDOM(remoteTheme);
          pendingChanges.current = null;
        },
      },
    });
  };

  const mergeThemes = (localTheme: ThemeSettings, remoteTheme: ThemeSettings): ThemeSettings => {
    // Simple merge strategy - could be made more sophisticated
    return {
      ...remoteTheme,
      ...localTheme,
      // Merge nested objects
      colors: { ...remoteTheme.colors, ...localTheme.colors },
      typography: { ...remoteTheme.typography, ...localTheme.typography },
      layout: { ...remoteTheme.layout, ...localTheme.layout },
      logo: { ...remoteTheme.logo, ...localTheme.logo },
    };
  };

  return {
    handleConflict,
    mergeThemes,
    hasPendingChanges: !!pendingChanges.current,
    pendingChanges: pendingChanges.current,
  };
}
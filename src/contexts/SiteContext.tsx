'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Site, SiteMembership, SiteWithMembership } from '@/lib/database/aliases';
import { getCurrentUserSite, getUserSites } from '@/lib/queries/domains/sites';

interface SiteContextType {
  currentSite: Site | null;
  currentMembership: SiteMembership | null;
  userSites: SiteWithMembership[];
  loading: boolean;
  error: Error | null;
  switchSite: (siteId: string) => Promise<void>;
  refreshSites: () => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [currentMembership, setCurrentMembership] = useState<SiteMembership | null>(null);
  const [userSites, setUserSites] = useState<SiteWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSites = async () => {
    if (!user) {
      setCurrentSite(null);
      setCurrentMembership(null);
      setUserSites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all sites for the user
      const sites = await getUserSites(supabase, user.id);
      setUserSites(sites);

      // Get current site from localStorage or use the first site
      const savedSiteId = localStorage.getItem('currentSiteId');
      let selectedSite = sites.find(s => s.id === savedSiteId);

      if (!selectedSite && sites.length > 0) {
        selectedSite = sites[0];
        localStorage.setItem('currentSiteId', selectedSite.id);
      }

      if (selectedSite) {
        // Extract site properties (excluding membership)
        const { membership, ...siteData } = selectedSite;
        setCurrentSite(siteData as Site);
        setCurrentMembership(membership || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load sites'));
      console.error('Error loading sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchSite = async (siteId: string) => {
    const targetSite = userSites.find(s => s.id === siteId);
    if (!targetSite) {
      throw new Error('Site not found or user does not have access');
    }

    // Extract site properties (excluding membership)
    const { membership, ...siteData } = targetSite;
    setCurrentSite(siteData as Site);
    setCurrentMembership(membership || null);
    localStorage.setItem('currentSiteId', siteId);
  };

  const refreshSites = async () => {
    await loadSites();
  };

  useEffect(() => {
    loadSites();
  }, [user]);

  // Subscribe to site membership changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('site-memberships')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_memberships',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh sites when membership changes
          loadSites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <SiteContext.Provider
      value={{
        currentSite,
        currentMembership,
        userSites,
        loading,
        error,
        switchSite,
        refreshSites,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}

// Convenience hook to get just the current site ID
export function useSiteId(): string | null {
  const { currentSite } = useSite();
  return currentSite?.id || null;
}

// Hook to check if user has specific permission
export function useSitePermission(permission: 'owner' | 'editor' | 'viewer'): boolean {
  const { currentMembership } = useSite();
  if (!currentMembership) return false;

  const roleHierarchy = {
    owner: ['owner', 'editor', 'viewer'],
    editor: ['editor', 'viewer'],
    viewer: ['viewer'],
  };

  return roleHierarchy[permission].includes(currentMembership.role);
}
/**
 * Site management hooks
 * Handles soft-delete, restore, and recovery operations
 */

'use client';

import { useState, useCallback } from 'react';
import type { Tables } from '@/src/lib/database/types';

type Site = Tables<'sites'>;

interface DeletedSitesResponse {
  sites: Site[];
  count: number;
}

/**
 * Hook to soft-delete a site
 */
export function useDeleteSite() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = useCallback(async (siteId: string) => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete site');
      }

      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutateAsync, isPending, error };
}

/**
 * Hook to restore a soft-deleted site
 */
export function useRestoreSite() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = useCallback(async (siteId: string) => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/sites/${siteId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore site');
      }

      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutateAsync, isPending, error };
}

/**
 * Hook to permanently delete a site (cannot be recovered)
 */
export function usePermanentlyDeleteSite() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = useCallback(async (siteId: string) => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/sites/${siteId}/permanent`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to permanently delete site');
      }

      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutateAsync, isPending, error };
}

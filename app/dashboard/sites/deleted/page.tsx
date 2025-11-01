/**
 * Deleted Sites Page
 * Displays all soft-deleted sites with recovery options
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Skeleton } from '@/src/components/ui/skeleton';
import { RotateCcw, Trash2, Clock, AlertCircle, Info } from 'lucide-react';
import {
  useRestoreSite,
  usePermanentlyDeleteSite,
} from '@/src/hooks/useSiteManagement';
import { toast } from 'sonner';
import type { Tables } from '@/lib/database/types';

type Site = Tables<'sites'>;

export default function DeletedSitesPage() {
  const router = useRouter();
  const [deletedSites, setDeletedSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const restoreSite = useRestoreSite();
  const permanentlyDelete = usePermanentlyDeleteSite();

  // Fetch deleted sites
  useEffect(() => {
    const fetchDeletedSites = async () => {
      try {
        const response = await fetch('/api/sites/deleted');
        if (!response.ok) throw new Error('Failed to fetch deleted sites');

        const data = await response.json();
        setDeletedSites(data.data.sites || []);
      } catch (error) {
        console.error('Error fetching deleted sites:', error);
        toast.error('Failed to load deleted sites');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeletedSites();
  }, []);

  const handleRestore = async (siteId: string, siteName: string) => {
    try {
      await restoreSite.mutateAsync(siteId);
      toast.success(`"${siteName}" has been restored`, {
        description: 'Your site is now active again.',
      });
      // Refresh the list
      setDeletedSites(prev => prev.filter(s => s.id !== siteId));
    } catch (error) {
      toast.error('Failed to restore site', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  const handlePermanentDelete = async (siteId: string, siteName: string) => {
    if (!confirm(`Permanently delete "${siteName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await permanentlyDelete.mutateAsync(siteId);
      toast.success('Site permanently deleted');
      // Refresh the list
      setDeletedSites(prev => prev.filter(s => s.id !== siteId));
    } catch (error) {
      toast.error('Failed to permanently delete site');
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, daysRemaining);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Deleted Sites</h1>
        <p className="text-gray-500">
          Manage sites that have been deleted. Sites can be recovered for 30 days.
        </p>
      </div>

      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Recovery Period</AlertTitle>
        <AlertDescription>
          Deleted sites are kept for 30 days before permanent deletion. You can restore
          them at any time during this period.
        </AlertDescription>
      </Alert>

      {/* Deleted Sites Grid */}
      {!deletedSites || deletedSites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trash2 className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No deleted sites</h3>
            <p className="text-sm text-gray-500">
              Deleted sites will appear here with a 30-day recovery period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {deletedSites.map((site) => {
            const daysRemaining = getDaysRemaining(site.deleted_at!);
            const isExpiringSoon = daysRemaining < 7;

            return (
              <Card key={site.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{site.name}</CardTitle>
                      <CardDescription>{site.subdomain}</CardDescription>
                    </div>
                    <Badge
                      variant={isExpiringSoon ? 'destructive' : 'secondary'}
                      className="gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {daysRemaining}d left
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Deletion Info */}
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      Deleted{' '}
                      {formatDistanceToNow(new Date(site.deleted_at!), {
                        addSuffix: true,
                      })}
                    </p>
                    {isExpiringSoon && (
                      <p className="text-orange-600 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Expiring soon
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRestore(site.id, site.name)}
                      disabled={restoreSite.isPending}
                      className="flex-1 gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePermanentDelete(site.id, site.name)}
                      disabled={permanentlyDelete.isPending}
                      className="gap-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Forever
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

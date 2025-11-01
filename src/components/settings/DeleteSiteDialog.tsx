/**
 * Delete Site Confirmation Dialog
 * Two-stage confirmation with type-to-confirm pattern
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { cn } from '@/lib/utils';
import { useDeleteSite } from '@/src/hooks/useSiteManagement';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/lib/database/types';

type Site = Tables<'sites'>;

interface DeleteSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: Site;
  impactData: {
    contentCount: number;
    domainCount: number;
    memberCount: number;
  };
}

export function DeleteSiteDialog({
  open,
  onOpenChange,
  site,
  impactData,
}: DeleteSiteDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const router = useRouter();
  const deleteSite = useDeleteSite();

  // Validate confirmation text
  const confirmMatch = confirmText === site.name || confirmText === site.subdomain;
  const canDelete = confirmMatch && !deleteSite.isPending;

  const handleDelete = async () => {
    try {
      await deleteSite.mutateAsync(site.id);

      toast.success('Site deleted successfully', {
        description: 'You have 30 days to restore it.',
        action: {
          label: 'View Deleted Sites',
          onClick: () => router.push('/dashboard/sites/deleted'),
        },
      });

      onOpenChange(false);
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to delete site', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-left">
              Delete &quot;{site.name}&quot;?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-4 pt-4">
            <p>
              This action will delete your site and make it inaccessible to visitors.
              Your site will be recoverable for <strong>30 days</strong>.
            </p>

            {/* Impact Details */}
            {(impactData.contentCount > 0 ||
              impactData.domainCount > 0 ||
              impactData.memberCount > 0) && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <p className="font-medium mb-2">What will be affected:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {impactData.contentCount > 0 && (
                      <li>
                        {impactData.contentCount} page
                        {impactData.contentCount !== 1 ? 's' : ''} will be hidden
                      </li>
                    )}
                    {impactData.domainCount > 0 && (
                      <li>
                        {impactData.domainCount} custom domain
                        {impactData.domainCount !== 1 ? 's' : ''} will be disconnected
                      </li>
                    )}
                    {impactData.memberCount > 0 && (
                      <li>
                        {impactData.memberCount} team member
                        {impactData.memberCount !== 1 ? 's' : ''} will lose access
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Recovery Info */}
            <Alert className="bg-orange-50 border-orange-200">
              <Info className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-800">
                <strong>Recovery period:</strong> You can restore this site from the
                &quot;Deleted Sites&quot; page within 30 days. After that, it will be
                permanently deleted.
              </AlertDescription>
            </Alert>

            {/* Type-to-Confirm */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-delete">
                Type <strong>{site.name}</strong> to confirm
              </Label>
              <Input
                id="confirm-delete"
                type="text"
                placeholder={site.name}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={cn(
                  'transition-colors',
                  confirmMatch && 'border-green-500 focus-visible:ring-green-500'
                )}
                autoFocus
                autoComplete="off"
              />
              <p
                className={cn(
                  'text-xs transition-colors',
                  confirmMatch ? 'text-green-600 font-medium' : 'text-gray-500'
                )}
              >
                {confirmMatch ? '✓ Confirmed' : `Type "${site.name}" to confirm`}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSite.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canDelete}
            className={cn(
              'bg-red-600 text-white hover:bg-red-700 border-0',
              !canDelete && 'opacity-50 cursor-not-allowed hover:bg-red-600'
            )}
          >
            {deleteSite.isPending ? 'Deleting...' : 'Delete Site'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

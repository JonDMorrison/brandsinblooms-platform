/**
 * Danger Zone Component
 * Warning section for destructive site operations
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import { Separator } from '@/src/components/ui/separator';
import { DeleteSiteDialog } from './DeleteSiteDialog';
import { useCurrentSite } from '@/src/hooks/useSite';

export function DangerZone() {
  const { site: currentSite } = useCurrentSite();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // For now, use placeholder counts - these could be fetched from API if needed
  const contentCount = 0;
  const domainCount = 0;
  const memberCount = 1;

  if (!currentSite) return null;

  return (
    <>
      {/* Visual Separator */}
      <div className="mt-16 mb-8">
        <Separator />
      </div>

      {/* Danger Zone Card - Clean faded red design */}
      <Card className="border-0 bg-red-500/10 dark:bg-red-500/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" aria-hidden="true" />
            <CardTitle className="text-red-600 dark:text-red-500">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Irreversible actions that permanently affect your site
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Delete Action Section */}
          <div className="p-6 bg-red-600 dark:bg-red-700 rounded-lg">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-white font-semibold text-lg">Delete This Site</h3>
                <p className="text-red-100">
                  Once you delete "{currentSite.name}", there is no going back for 30 days. Please be certain.
                </p>
              </div>

              {/* What will be deleted */}
              <div className="p-4 bg-red-700/50 dark:bg-red-800/50 rounded-md">
                <p className="text-red-100 text-sm font-medium mb-2">This action will delete:</p>
                <ul className="list-disc list-inside space-y-1 text-red-200 text-sm">
                  <li>All site content and pages</li>
                  <li>Custom domain configurations</li>
                  <li>Team member access</li>
                  <li>All associated data</li>
                </ul>
                <p className="text-green-300 text-sm mt-3 font-medium">
                  ✓ Sites can be recovered within 30 days of deletion
                </p>
              </div>

              {/* Delete Button */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteDialog(true)}
                  className="bg-white hover:bg-red-50 text-red-600 font-semibold border-0"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Site
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteSiteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        site={currentSite}
        impactData={{
          contentCount,
          domainCount,
          memberCount,
        }}
      />
    </>
  );
}

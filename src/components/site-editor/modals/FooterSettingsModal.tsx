'use client'

/**
 * Footer Settings Modal
 * Modal for editing footer settings in Full Site Editor
 * Wraps the existing FooterCustomization component from dashboard/design
 */

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { FooterCustomization } from '@/src/components/design/FooterCustomization'
import { useDesignSettings } from '@/src/hooks/useDesignSettings'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { createClient } from '@/src/lib/supabase/client'
import { updateSiteTheme } from '@/src/lib/queries/domains/theme'
import type { ThemeSettings } from '@/src/lib/queries/domains/theme'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface FooterSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FooterSettingsModal({ isOpen, onClose }: FooterSettingsModalProps) {
  const { currentSite } = useSiteContext()
  const { data: designSettings, loading, refetch } = useDesignSettings()
  const [saving, setSaving] = useState(false)

  // Handle settings change with immediate save
  const handleChange = async (updatedSettings: ThemeSettings) => {
    if (!currentSite?.id) {
      toast.error('Site not found')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      await updateSiteTheme(supabase, currentSite.id, updatedSettings)

      // Refetch to get updated settings
      await refetch()

      toast.success('Footer settings saved!')
    } catch (error) {
      console.error('Failed to save footer settings:', error)
      toast.error('Failed to save footer settings')
    } finally {
      setSaving(false)
    }
  }

  if (!designSettings) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Footer Settings</DialogTitle>
          <DialogDescription>
            Customize your site footer and links
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <FooterCustomization
            value={designSettings}
            colors={designSettings.colors}
            typography={designSettings.typography}
            onChange={handleChange}
          />
        </div>

        {saving && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50 rounded-lg">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--theme-primary)' }} />
              <span className="text-sm font-medium">Saving...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

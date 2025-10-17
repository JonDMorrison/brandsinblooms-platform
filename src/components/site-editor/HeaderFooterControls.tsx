'use client'

/**
 * Header/Footer Controls
 * Floating controls that appear on hover for header/footer management
 * Simplified version of SectionControls - only shows settings gear icon
 */

import React from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'

interface HeaderFooterControlsProps {
  type: 'header' | 'footer'
  onSettingsClick: () => void
}

export function HeaderFooterControls({ type, onSettingsClick }: HeaderFooterControlsProps) {
  return (
    <div
      className={cn(
        'absolute top-2 right-2 z-[60]',
        'flex items-center gap-1 p-1',
        'bg-white rounded-lg shadow-lg border border-gray-200',
        'animate-in fade-in duration-200'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Settings */}
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onSettingsClick}
        title={`${type === 'header' ? 'Header' : 'Footer'} settings`}
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  )
}

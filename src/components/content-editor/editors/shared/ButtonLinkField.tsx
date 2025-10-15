/**
 * ButtonLinkField component for button link configuration with smart internal/external detection
 * Allows switching between internal page selection and external URL input
 */

import React, { useState } from 'react'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { ExternalLink, FileText } from 'lucide-react'
import { PageSelector } from './PageSelector'

interface ButtonLinkFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
}

/**
 * Detects if a URL is external (starts with http:// or https://)
 */
function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Detects if a URL is internal (starts with /)
 */
function isInternalUrl(url: string): boolean {
  return url.startsWith('/') || url === ''
}

export function ButtonLinkField({
  value,
  onChange,
  label,
  placeholder = 'Select page or enter URL',
  className = ''
}: ButtonLinkFieldProps) {
  // Determine initial mode based on current value (only on mount)
  const [linkMode, setLinkMode] = useState<'internal' | 'external'>(() => {
    if (!value) return 'internal'
    return isExternalUrl(value) ? 'external' : 'internal'
  })

  const handleModeSwitch = (mode: 'internal' | 'external') => {
    setLinkMode(mode)
    // Clear value when switching modes to avoid confusion
    if (mode === 'internal' && isExternalUrl(value)) {
      onChange('/')
    } else if (mode === 'external' && isInternalUrl(value)) {
      onChange('')
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && <Label className="text-xs font-medium">{label}</Label>}

      {/* Mode toggle and input - stacked on mobile, inline on desktop */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        {/* Mode toggle buttons */}
        <div className="flex gap-1 flex-shrink-0">
          <Button
            type="button"
            size="sm"
            variant={linkMode === 'internal' ? 'default' : 'outline'}
            onClick={() => handleModeSwitch('internal')}
            className="h-8 px-2 text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            Page
          </Button>
          <Button
            type="button"
            size="sm"
            variant={linkMode === 'external' ? 'default' : 'outline'}
            onClick={() => handleModeSwitch('external')}
            className="h-8 px-2 text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            URL
          </Button>
        </div>

        {/* Input based on mode */}
        <div className="flex-1 w-full">
          {linkMode === 'internal' ? (
            <PageSelector
              value={value}
              onChange={onChange}
              placeholder="Select a page"
            />
          ) : (
            <Input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-8"
              placeholder="https://example.com"
            />
          )}
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        {linkMode === 'internal'
          ? 'Select an internal page from your site'
          : 'Enter a full URL including https://'}
      </p>
    </div>
  )
}

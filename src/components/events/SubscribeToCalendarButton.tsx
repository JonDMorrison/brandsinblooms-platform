/**
 * Subscribe to Calendar Button Component
 * Provides a button/link to subscribe to the site's events calendar feed
 */

'use client'

import { Calendar, Download } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/src/components/ui/dropdown-menu'
import { useState } from 'react'

interface SubscribeToCalendarButtonProps {
  siteId: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showInstructions?: boolean
}

export function SubscribeToCalendarButton({
  siteId,
  variant = 'outline',
  size = 'default',
  showInstructions = true,
}: SubscribeToCalendarButtonProps) {
  const [copied, setCopied] = useState(false)

  // Generate calendar feed URL
  const calendarUrl = `${window.location.origin}/api/calendar/${siteId}/events.ics`

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Direct download
  const downloadCalendar = () => {
    window.open(calendarUrl, '_blank')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Calendar className="h-4 w-4 mr-2" />
          Subscribe to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {showInstructions && (
          <>
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Subscribe to get automatic updates for all upcoming events in your calendar app.
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <Calendar className="h-4 w-4 mr-2" />
          {copied ? 'Copied!' : 'Copy Calendar URL'}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={downloadCalendar} className="cursor-pointer">
          <Download className="h-4 w-4 mr-2" />
          Download Calendar File
        </DropdownMenuItem>

        {showInstructions && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <p className="text-xs font-medium mb-2">How to subscribe:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Google Calendar:</strong> Add by URL</li>
                <li>• <strong>Apple Calendar:</strong> File → New Calendar Subscription</li>
                <li>• <strong>Outlook:</strong> Add Calendar → From Internet</li>
              </ul>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Simple variant without dropdown menu
 * Just downloads the .ics file directly
 */
export function SubscribeToCalendarLink({
  siteId,
  className,
}: {
  siteId: string
  className?: string
}) {
  const calendarUrl = `/api/calendar/${siteId}/events.ics`

  return (
    <a
      href={calendarUrl}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Calendar className="h-4 w-4 inline mr-2" />
      Subscribe to Calendar
    </a>
  )
}

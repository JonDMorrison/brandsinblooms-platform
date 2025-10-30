'use client'

import { Button } from '@/src/components/ui/button'
import { ExternalLink } from 'lucide-react'
import { useSite } from '@/src/hooks/useSite'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip'

interface ViewSiteButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  showTextOnMobile?: boolean
}

/**
 * Reusable button component for viewing the live site in a new tab
 * Used across dashboard pages for consistent site viewing experience
 */
export function ViewSiteButton({
  className = '',
  variant = 'outline',
  showTextOnMobile = false
}: ViewSiteButtonProps) {
  const { getSiteUrl, site, isPublished } = useSite()

  // Don't render if no site is available
  if (!site) return null

  const handleViewSite = () => {
    const siteUrl = getSiteUrl()
    if (siteUrl) {
      window.open(siteUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const button = (
    <Button
      onClick={handleViewSite}
      className={`flex items-center gap-2 ${className}`}
      variant={variant}
    >
      <ExternalLink className="h-4 w-4" />
      <span className={showTextOnMobile ? '' : 'hidden sm:inline'}>
        View Site
      </span>
    </Button>
  )

  // Show tooltip if site is not published
  if (!isPublished) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>Site is not published yet</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}

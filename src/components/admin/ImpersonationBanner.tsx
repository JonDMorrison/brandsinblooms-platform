'use client'

import React, { useEffect, useState } from 'react'
import { 
  UserCheck, 
  Clock, 
  StopCircle, 
  Eye, 
  AlertTriangle,
  X,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { 
  useCurrentImpersonation,
  useImpersonationManager 
} from '@/src/contexts/AdminImpersonationContext'
import { toast } from 'sonner'

interface ImpersonationBannerProps {
  className?: string
  showAdminLink?: boolean
}

export function ImpersonationBanner({ 
  className = '',
  showAdminLink = true 
}: ImpersonationBannerProps) {
  const { session, isActive, timeRemaining, isExpiringSoon } = useCurrentImpersonation()
  const { endCurrentImpersonation, loading } = useImpersonationManager()
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showExpiryWarning, setShowExpiryWarning] = useState(false)

  // Show expiry warning when session is about to expire
  useEffect(() => {
    if (isExpiringSoon && !showExpiryWarning) {
      setShowExpiryWarning(true)
      toast.warning('Impersonation session expiring soon', {
        description: `Session will expire in ${timeRemaining} minutes`
      })
    }
  }, [isExpiringSoon, showExpiryWarning, timeRemaining])

  // Don't render if not impersonating
  if (!isActive || !session) {
    return null
  }

  const handleEndImpersonation = async () => {
    try {
      await endCurrentImpersonation()
      toast.success('Impersonation session ended')
    } catch (err) {
      console.error('Failed to end impersonation:', err)
      toast.error('Failed to end impersonation session')
    }
  }

  const openAdminPanel = () => {
    const adminUrl = `${window.location.origin}/admin/sites/${session.site_id}/edit`
    window.open(adminUrl, '_blank')
  }

  const formatTimeRemaining = (minutes: number | null): string => {
    if (minutes === null) return 'Unknown'
    
    if (minutes < 1) return 'Less than 1 minute'
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    } else {
      return `${hours}h ${remainingMinutes}m`
    }
  }

  if (isCollapsed) {
    return (
      <div className={`fixed top-0 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
        <div className="bg-gray-100 text-white px-4 py-2 rounded-b-lg shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="text-white hover:bg-orange-600 h-6 px-2"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">Impersonating</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Impersonation info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      Admin Impersonation Active
                    </span>
                    {isExpiringSoon && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-orange-100 truncate">
                    Site: {session.site_name}
                    {session.impersonated_user_email && (
                      <span className="ml-2">
                        • Viewing as: {session.impersonated_user_name || session.impersonated_user_email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Center - Time remaining */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <Clock className="h-4 w-4" />
              <span className="whitespace-nowrap">
                {formatTimeRemaining(timeRemaining)} remaining
              </span>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              {showAdminLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openAdminPanel}
                  className="text-white hover:bg-orange-600 h-8 px-3 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Admin Panel
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEndImpersonation}
                disabled={loading}
                className="text-white hover:bg-orange-600 h-8 px-3 text-xs"
              >
                <StopCircle className="h-3 w-3 mr-1" />
                End Session
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(true)}
                className="text-white hover:bg-orange-600 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expiry Warning Bar */}
        {isExpiringSoon && (
          <div className="bg-red-600 px-4 py-2 border-t border-red-500">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle className="h-4 w-4 text-yellow-200" />
                <span>
                  Warning: This impersonation session will expire in {formatTimeRemaining(timeRemaining)}. 
                  Consider extending or starting a new session if needed.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Hook to get impersonation banner properties for layout adjustments
 */
export function useImpersonationBannerHeight() {
  const { isActive, isExpiringSoon } = useCurrentImpersonation()
  
  if (!isActive) return 0
  
  // Base banner height (56px) + expiry warning height (40px if present)
  return isExpiringSoon ? 96 : 56
}

/**
 * Component to add top padding when impersonation banner is active
 */
export function ImpersonationSpacer({ children }: { children: React.ReactNode }) {
  const bannerHeight = useImpersonationBannerHeight()
  
  return (
    <div style={{ paddingTop: bannerHeight }}>
      {children}
    </div>
  )
}

/**
 * Minimalist version of the impersonation banner for embedded use
 */
export function ImpersonationIndicator({ className = '' }: { className?: string }) {
  const { session, isActive, timeRemaining } = useCurrentImpersonation()
  const { endCurrentImpersonation, loading } = useImpersonationManager()

  if (!isActive || !session) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
        <UserCheck className="h-3 w-3" />
        <span className="font-medium">Impersonating</span>
      </div>
      
      <span className="text-gray-500">
        {formatTimeRemaining(timeRemaining)} left
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => endCurrentImpersonation()}
        disabled={loading}
        className="h-6 px-2 text-xs"
      >
        End
      </Button>
    </div>
  )
}

function formatTimeRemaining(minutes: number | null): string {
  if (minutes === null) return 'Unknown'
  
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `${minutes}m`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  } else {
    return `${hours}h${remainingMinutes}m`
  }
}
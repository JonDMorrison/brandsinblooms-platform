'use client'

import { useState } from 'react'
import { 
  useSiteSwitcher, 
  useCurrentSite, 
  useSitePermissions 
} from '@/src/hooks/useSite'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import { ChevronDown, Check, Globe, Settings } from 'lucide-react'

export function SiteSwitcher() {
  const { switchSite, availableSites, currentSiteId } = useSiteSwitcher()
  const { site: currentSite, loading } = useCurrentSite()
  const { role, canManage } = useSitePermissions()
  const [switching, setSwitching] = useState(false)

  const handleSiteSwitch = async (siteId: string) => {
    if (siteId === currentSiteId || switching) return
    
    try {
      setSwitching(true)
      await switchSite(siteId)
    } catch (error) {
      console.error('Failed to switch site:', error)
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-10 w-48" />
  }

  if (!currentSite || availableSites.length === 0) {
    return null
  }

  const getRoleColor = (userRole: string) => {
    switch (userRole) {
      case 'owner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'editor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-48 justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <Globe className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{currentSite.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Switch Site</span>
          {role && (
            <Badge variant="secondary" className={getRoleColor(role)}>
              {role}
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {availableSites.map((siteAccess) => (
          <DropdownMenuItem
            key={siteAccess.site.id}
            onClick={() => handleSiteSwitch(siteAccess.site.id)}
            disabled={switching}
            className="flex items-center justify-between p-3 cursor-pointer"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {siteAccess.site.id === currentSiteId ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  {siteAccess.site.name}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {siteAccess.site.subdomain}
                  {siteAccess.site.custom_domain && ` • ${siteAccess.site.custom_domain}`}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Badge 
                variant="outline" 
                className={`text-xs ${getRoleColor(siteAccess.role)}`}
              >
                {siteAccess.role}
              </Badge>
              
              {siteAccess.canManage && (
                <Settings className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        {availableSites.length === 0 && (
          <DropdownMenuItem disabled>
            No sites available
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Compact version of site switcher for smaller spaces
 */
export function CompactSiteSwitcher() {
  const { switchSite, availableSites, currentSiteId } = useSiteSwitcher()
  const { site: currentSite, loading } = useCurrentSite()
  const [switching, setSwitching] = useState(false)

  const handleSiteSwitch = async (siteId: string) => {
    if (siteId === currentSiteId || switching) return
    
    try {
      setSwitching(true)
      await switchSite(siteId)
    } catch (error) {
      console.error('Failed to switch site:', error)
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    // Return a placeholder that maintains the same dimensions
    // to prevent layout shift during loading
    return (
      <div className="flex items-center space-x-2 text-sm h-8 px-3">
        <Globe className="h-4 w-4 opacity-50" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (!currentSite || availableSites.length <= 1) {
    return currentSite ? (
      <div className="flex items-center space-x-2 text-sm">
        <Globe className="h-4 w-4" />
        <span className="truncate">{currentSite.name}</span>
      </div>
    ) : null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="justify-start">
          <Globe className="h-4 w-4 mr-2" />
          <span className="truncate">{currentSite.name}</span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start">
        {availableSites.map((siteAccess) => (
          <DropdownMenuItem
            key={siteAccess.site.id}
            onClick={() => handleSiteSwitch(siteAccess.site.id)}
            disabled={switching}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              {siteAccess.site.id === currentSiteId && (
                <Check className="h-4 w-4" />
              )}
              <span>{siteAccess.site.name}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {siteAccess.role}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
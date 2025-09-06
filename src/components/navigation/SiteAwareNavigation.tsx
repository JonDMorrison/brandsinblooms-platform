'use client'

import { useCurrentSite, useSitePermissions } from '@/src/contexts/SiteContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { Flower, Menu, X, ExternalLink } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/src/components/ui/sheet'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/src/lib/utils'
import { Tables } from '@/src/lib/database/types'
import { User } from '@supabase/supabase-js'

interface NavigationItem {
  label: string
  href: string
  icon?: React.ReactNode
  requiresAuth?: boolean
  requiresEdit?: boolean
  requiresManage?: boolean
  external?: boolean
}

interface SiteAwareNavigationProps {
  variant?: 'header' | 'sidebar' | 'minimal'
  className?: string
  customItems?: NavigationItem[]
  showBranding?: boolean
  fixed?: boolean
}

export function SiteAwareNavigation({ 
  variant = 'header',
  className,
  customItems = [],
  showBranding = true,
  fixed = true
}: SiteAwareNavigationProps) {
  const { site, loading } = useCurrentSite()
  const { user } = useAuth()
  const { hasAccess, canEdit, canManage } = useSitePermissions()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Generate navigation items based on site context and permissions
  const navigationItems = getNavigationItems(user, hasAccess, canEdit, canManage, customItems)

  if (loading) {
    return <NavigationSkeleton variant={variant} fixed={fixed} />
  }

  if (variant === 'header') {
    return (
      <header className={cn(
        "bg-white/95 backdrop-blur-sm border-b z-50",
        fixed && "fixed top-0 left-0 right-0",
        className
      )}>
        <nav className="brand-container">
          <div className="flex items-center justify-between h-16">
            {/* Site Branding */}
            {showBranding && (
              <SiteBranding site={site} />
            )}

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <NavigationLink 
                  key={item.href} 
                  item={item}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <UserActions user={user} />
              
              {/* Mobile Menu Trigger */}
              <div className="lg:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <MobileNavigation 
                      items={navigationItems}
                      user={user}
                      site={site}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </nav>
      </header>
    )
  }

  if (variant === 'sidebar') {
    return (
      <aside className={cn(
        "w-64 bg-card border-r h-full overflow-y-auto",
        className
      )}>
        <div className="p-6">
          {showBranding && (
            <div className="mb-8">
              <SiteBranding site={site} />
            </div>
          )}

          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <NavigationLink 
                key={item.href} 
                item={item}
                variant="sidebar"
              />
            ))}
          </nav>
        </div>
      </aside>
    )
  }

  // Minimal variant
  return (
    <nav className={cn("flex items-center space-x-6", className)}>
      {navigationItems.map((item) => (
        <NavigationLink 
          key={item.href} 
          item={item}
          variant="minimal"
        />
      ))}
    </nav>
  )
}

function SiteBranding({ site }: { site: Tables<'sites'> | null }) {
  return (
    <Link href="/" className="flex items-center space-x-3">
      {site?.logo_url ? (
        <img 
          src={site.logo_url} 
          alt={`${site.name} logo`}
          className="w-8 h-8 rounded object-cover"
        />
      ) : (
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded">
          <Flower className="h-4 w-4 text-white" />
        </div>
      )}
      
      <div>
        <span className="font-brand-heading text-lg text-gradient-primary">
          {site?.name || 'Site'}
        </span>
        {site?.description && (
          <p className="text-xs text-gray-500">
            {site.description}
          </p>
        )}
      </div>
    </Link>
  )
}

function NavigationLink({ 
  item, 
  variant = 'header',
  onClick 
}: { 
  item: NavigationItem
  variant?: 'header' | 'sidebar' | 'minimal'
  onClick?: () => void
}) {
  const linkClasses = {
    header: "text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors",
    sidebar: "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gradient-primary-20 transition-colors",
    minimal: "text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
  }

  const content = (
    <>
      {variant === 'sidebar' && item.icon && (
        <span className="flex-shrink-0">{item.icon}</span>
      )}
      <span className={variant === 'sidebar' ? 'flex-1' : ''}>
        {item.label}
      </span>
      {item.external && (
        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
      )}
    </>
  )

  if (item.external) {
    return (
      <a 
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses[variant]}
        onClick={onClick}
      >
        {content}
      </a>
    )
  }

  return (
    <Link 
      href={item.href}
      className={linkClasses[variant]}
      onClick={onClick}
    >
      {content}
    </Link>
  )
}

function UserActions({ user }: { user: User | null }) {
  if (user) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Dashboard
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="outline" size="sm">
            {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Profile'}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Sign In
        </Button>
      </Link>
      <Link href="/signup">
        <Button size="sm" className="btn-gradient-primary">
          Sign Up
        </Button>
      </Link>
    </div>
  )
}

function MobileNavigation({ 
  items, 
  user, 
  site, 
  onNavigate 
}: { 
  items: NavigationItem[]
  user: User | null
  site: Tables<'sites'> | null
  onNavigate: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Site Branding */}
      <div className="border-b pb-4 mb-6">
        <SiteBranding site={site} />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-2">
        {items.map((item) => (
          <NavigationLink 
            key={item.href} 
            item={item}
            variant="sidebar"
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t pt-4 mt-auto">
        {user ? (
          <div className="space-y-2">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <Link href="/profile" onClick={onNavigate}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Profile Settings
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => {
                // Handle sign out
                onNavigate()
              }}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="/login" onClick={onNavigate}>
              <Button variant="ghost" size="sm" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" onClick={onNavigate}>
              <Button size="sm" className="w-full btn-gradient-primary">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function NavigationSkeleton({ variant, fixed }: { variant: string; fixed: boolean }) {
  if (variant === 'header') {
    return (
      <header className={cn(
        "bg-white/95 backdrop-blur-sm border-b",
        fixed && "fixed top-0 left-0 right-0"
      )}>
        <nav className="brand-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded animate-pulse" />
              <div className="w-24 h-4 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-8 bg-muted rounded animate-pulse" />
              <div className="w-16 h-8 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </nav>
      </header>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="w-8 h-8 bg-muted rounded animate-pulse" />
      <div className="w-20 h-4 bg-muted rounded animate-pulse" />
    </div>
  )
}

function getNavigationItems(
  user: User | null,
  hasAccess: boolean,
  canEdit: boolean,
  canManage: boolean,
  customItems: NavigationItem[]
): NavigationItem[] {
  const items: NavigationItem[] = [
    {
      label: 'Home',
      href: '/',
    },
  ]

  // Add authenticated user items
  if (user) {
    items.push({
      label: 'Dashboard',
      href: '/dashboard',
      requiresAuth: true,
    })

    // Add site-specific items if user has access
    if (hasAccess) {
      if (canEdit) {
        items.push({
          label: 'Editor',
          href: '/editor',
          requiresEdit: true,
        })
      }

      if (canManage) {
        items.push({
          label: 'Settings',
          href: '/settings',
          requiresManage: true,
        })
      }
    }

    items.push({
      label: 'My Sites',
      href: '/sites',
      requiresAuth: true,
    })
  }

  // Add custom items
  items.push(...customItems)

  // Filter items based on permissions
  return items.filter(item => {
    if (item.requiresAuth && !user) return false
    if (item.requiresEdit && !canEdit) return false
    if (item.requiresManage && !canManage) return false
    return true
  })
}

export default SiteAwareNavigation
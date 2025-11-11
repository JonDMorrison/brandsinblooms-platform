'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart } from 'lucide-react'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { useCartContext } from '@/src/contexts/CartContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { useDesignSettings } from '@/src/hooks/useDesignSettings'
import { useHasBlogPosts } from '@/src/hooks/useHasBlogPosts'
import { useHasEvents } from '@/src/hooks/useHasEvents'
import { useIsVisualEditMode } from '@/src/contexts/FullSiteEditorContext'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import { BrandLogo } from './BrandLogo'
import { DesktopNavItem } from './NavItems'
import { MobileNav } from './MobileNav'
import { SearchBar } from './SearchBar'
import { CartButton } from './CartButton'
import { UserMenu } from './UserMenu'
import { SearchOverlay } from './SearchOverlay'
import { getDefaultNavItems } from './utils'
import { NavigationItem, getDefaultNavigationItems } from '@/src/lib/queries/domains/theme'
import type { SiteNavigationProps } from './types'

export function SiteNavigation({ className }: SiteNavigationProps) {
  const { currentSite: site, canEdit, canManage } = useSiteContext()
  const { data: designSettings } = useDesignSettings()
  const { itemCount } = useCartContext()
  const { user } = useAuth()
  const isVisualEditMode = useIsVisualEditMode()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Check if site has published blog posts
  const { data: hasBlogPosts, loading: isLoadingBlogCheck } = useHasBlogPosts(site?.id)

  // Check if site has published events
  const { data: hasEvents, loading: isLoadingEventsCheck } = useHasEvents(site?.id)


  // Get navigation configuration from theme settings
  const theme = designSettings
  const menuStyle = theme?.layout?.menuStyle || 'horizontal'
  const headerHeight = theme?.layout?.headerHeight || 'normal'
  const stickyHeader = theme?.layout?.stickyHeader !== false
  const headerStyle = theme?.layout?.headerStyle || 'modern'

  // Build navigation items from theme settings
  const configuredNavItems = (theme?.navigation?.items || []) as NavigationItem[]

  // Filter visible items and sort by order
  const visibleNavItems = configuredNavItems
    .filter(item => item.visible !== false) // Show items that are explicitly visible or undefined
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  // If no configured items, use defaults
  const allNavItems = visibleNavItems.length > 0
    ? visibleNavItems
    : getDefaultNavigationItems().filter(item => item.visible)

  // Filter out Blog and Events navigation if no published content exists
  // Only filter during normal operation, not while loading
  const navItems = useMemo(() => {
    // During loading, show all items to prevent layout shift
    if (isLoadingBlogCheck || isLoadingEventsCheck) {
      return allNavItems;
    }

    // Filter out blog and events navigation if no content exists
    return allNavItems.filter((item) => {
      // Filter blog navigation
      if (item.href.includes('/blog')) {
        // Show blog items only if posts exist OR user can edit
        // (editors should see blog nav even without posts)
        return hasBlogPosts === true || canEdit;
      }

      // Filter events navigation
      if (item.href.includes('/events')) {
        // Show events items only if events exist OR user can edit
        // (editors should see events nav even without events)
        return hasEvents === true || canEdit;
      }

      // Keep all other items
      return true;
    });
  }, [allNavItems, hasBlogPosts, hasEvents, canEdit, isLoadingBlogCheck, isLoadingEventsCheck])
  
  // Get branding configuration
  const brandingType = theme?.logo?.displayType || 'text'
  const brandText = theme?.logo?.text || site?.name || 'Store'
  const logoUrl = theme?.logo?.url
  const logoSize = theme?.logo?.pixelSize || 100
  
  // Get CTA button configuration
  const ctaButton = theme?.layout?.ctaButton
  
  // Height classes based on theme
  const heightClass = {
    compact: 'h-14',
    normal: 'h-16',
    tall: 'h-20'
  }[headerHeight] || 'h-16'

  // Right section component for reuse
  const rightSection = (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className={isVisualEditMode ? "hidden @sm:block" : "hidden sm:block"}>
        <SearchBar searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
      </div>

      {/* User Account */}
      <UserMenu user={user} canEdit={canEdit} />

      {/* Shopping Cart */}
      <CartButton itemCount={itemCount} />

      {/* CTA Button */}
      {ctaButton?.enabled && ctaButton?.text && (
        <Button
          className={isVisualEditMode ? "hidden @md:inline-flex ml-2 btn-theme-primary" : "hidden md:inline-flex ml-2 btn-theme-primary"}
          asChild
        >
          <Link href={ctaButton.href || '#'}>
            {ctaButton.text}
          </Link>
        </Button>
      )}
    </div>
  )

  return (
    <header
      className={cn(
        'w-full bg-white border-b transition-all duration-200',
        stickyHeader && (isVisualEditMode ? 'sticky top-14 z-30' : 'sticky top-0 z-50'),
        headerStyle === 'classic' ? '' : headerStyle === 'modern' || headerStyle === 'minimal' ? 'py-3' : heightClass,
        className
      )}
    >
      <div className={cn(
        'brand-container mx-auto px-4',
        headerStyle === 'classic' ? 'py-3' : headerStyle === 'modern' || headerStyle === 'minimal' ? '' : 'h-full'
      )}>
        {/* Modern Header Style */}
        {headerStyle === 'modern' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BrandLogo 
                brandingType={brandingType}
                logoUrl={logoUrl}
                brandText={brandText}
                logoSize={logoSize}
              />
              {/* Desktop Navigation - Only show on large screens */}
              <div className={isVisualEditMode ? "hidden @lg:block" : "hidden lg:block"}>
                {menuStyle === 'horizontal' && (
                  <nav className="flex gap-4 text-sm items-center" style={{ fontFamily: 'var(--theme-font-body)' }}>
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="hover:opacity-70 cursor-pointer transition-opacity"
                        style={{ color: 'var(--theme-secondary)' }}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Desktop Icons */}
              <div className={isVisualEditMode ? "hidden @lg:flex items-center gap-3" : "hidden lg:flex items-center gap-3"}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="h-8 w-8"
                >
                  <Search className="h-4 w-4" style={{ color: 'var(--theme-text)' }} />
                </Button>
                <CartButton itemCount={itemCount} />
                {ctaButton?.enabled && ctaButton?.text && (
                  <Link href={ctaButton.href || '#'}>
                    <button
                      className="px-3 py-1 text-sm rounded hover:opacity-90 transition-opacity cursor-pointer"
                      style={{ backgroundColor: 'var(--theme-primary)', color: '#fff' }}
                    >
                      {ctaButton.text}
                    </button>
                  </Link>
                )}
              </div>
              {/* Mobile Icons - Only on Mobile/Tablet */}
              <div className={isVisualEditMode ? "flex @lg:hidden items-center gap-2" : "flex lg:hidden items-center gap-2"}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="h-8 w-8"
                >
                  <Search className="h-4 w-4" style={{ color: 'var(--theme-text)' }} />
                </Button>
                <CartButton itemCount={itemCount} />
                <div
                  className="w-6 h-5 flex flex-col gap-1 items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }}></div>
                  <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }}></div>
                  <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }}></div>
                </div>
              </div>
              {/* Hidden Mobile Nav for Sheet */}
              <MobileNav 
                navItems={navItems}
                canEdit={canEdit}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                ctaButton={ctaButton}
              />
            </div>
          </div>
        )}

        {/* Classic Header Style */}
        {headerStyle === 'classic' && (
          <div className="space-y-2">
            {/* Desktop Layout */}
            <div className={isVisualEditMode ? "hidden @md:block text-center space-y-2" : "hidden md:block text-center space-y-2"}>
              <BrandLogo 
                brandingType={brandingType}
                logoUrl={logoUrl}
                brandText={brandText}
                logoSize={logoSize}
                className="justify-center"
                textClassName="font-bold text-lg"
              />
              <div className="flex justify-center items-center gap-6">
                <nav className="flex items-center gap-4 text-sm" style={{ fontFamily: 'var(--theme-font-body)' }}>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="hover:opacity-70 cursor-pointer transition-opacity"
                      style={{ color: 'var(--theme-secondary)' }}
                    >
                      {item.label}
                    </Link>
                  ))}
                  {/* Search and Cart Icons inline with navigation */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                    className="h-8 w-8"
                  >
                    <Search className="h-4 w-4" style={{ color: 'var(--theme-text)' }} />
                  </Button>
                  <CartButton itemCount={itemCount} />
                </nav>
              </div>
              {/* CTA Button below navigation */}
              {ctaButton?.enabled && ctaButton?.text && (
                <div className="flex justify-center pt-1">
                  <Link href={ctaButton.href || '#'}>
                    <button
                      className="px-3 py-1 text-sm rounded hover:opacity-90 transition-opacity cursor-pointer"
                      style={{ backgroundColor: 'var(--theme-primary)', color: '#fff' }}
                    >
                      {ctaButton.text}
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Layout */}
            <div className={isVisualEditMode ? "@md:hidden" : "md:hidden"}>
              <div className="flex items-center justify-between">
                <BrandLogo
                  brandingType={brandingType}
                  logoUrl={logoUrl}
                  brandText={brandText}
                  logoSize={logoSize}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                    className="h-8 w-8"
                  >
                    <Search className="h-4 w-4" style={{ color: 'var(--theme-text)' }} />
                  </Button>
                  <CartButton itemCount={itemCount} />
                  <div
                    className="w-6 h-5 flex flex-col gap-1 items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => setMobileMenuOpen(true)}
                  >
                    <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }}></div>
                    <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }}></div>
                    <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }}></div>
                  </div>
                </div>
                {/* Hidden Mobile Nav for Sheet */}
                <MobileNav 
                  navItems={navItems}
                  canEdit={canEdit}
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                  ctaButton={ctaButton}
                />
              </div>
            </div>
          </div>
        )}

        {/* Minimal Header Style - Hamburger menu at all screen sizes */}
        {headerStyle === 'minimal' && (
          <div className="flex items-center justify-between">
            <BrandLogo
              brandingType={brandingType}
              logoUrl={logoUrl}
              brandText={brandText}
              logoSize={logoSize}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="h-8 w-8"
              >
                <Search className="h-4 w-4" style={{ color: 'var(--theme-text)' }} />
              </Button>
              <CartButton itemCount={itemCount} />
              <div
                className="w-6 h-5 flex flex-col gap-1 items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => setMobileMenuOpen(true)}
              >
                <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }}></div>
                <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }}></div>
                <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }}></div>
              </div>
            </div>
            {/* Hidden Mobile Nav for Sheet - Available at all screen sizes */}
            <MobileNav 
              navItems={navItems}
              canEdit={canEdit}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              ctaButton={ctaButton}
            />
          </div>
        )}
      </div>

      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
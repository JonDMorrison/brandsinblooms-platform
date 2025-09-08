'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart } from 'lucide-react'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { useCartContext } from '@/src/contexts/CartContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { useDesignSettings } from '@/src/hooks/useDesignSettings'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import { BrandLogo } from './BrandLogo'
import { DesktopNavItem } from './NavItems'
import { MobileNav } from './MobileNav'
import { SearchBar } from './SearchBar'
import { CartButton } from './CartButton'
import { UserMenu } from './UserMenu'
import type { SiteNavigationProps } from './types'

export function SiteNavigation({ className }: SiteNavigationProps) {
  const { currentSite: site, canEdit, canManage } = useSiteContext()
  const { data: designSettings } = useDesignSettings()
  const { itemCount } = useCartContext()
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  
  // Get navigation configuration from theme settings
  const theme = designSettings
  const menuStyle = theme?.layout?.menuStyle || 'horizontal'
  const headerHeight = theme?.layout?.headerHeight || 'normal'
  const stickyHeader = theme?.layout?.stickyHeader !== false
  const headerStyle = theme?.layout?.headerStyle || 'modern'
  
  // Build navigation items - always include Products, plus configured optional items
  const configuredNavItems = theme?.navigation?.items || []
  const navItems = [
    { label: 'Products', href: '/products' },
    ...configuredNavItems.filter(item => 
      ['About', 'Contact', 'Home', 'Blog'].includes(item.label)
    )
  ]
  
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
      <div className="hidden sm:block">
        <SearchBar searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
      </div>
      
      {/* User Account */}
      <UserMenu user={user} canEdit={canEdit} />
      
      {/* Shopping Cart */}
      <CartButton itemCount={itemCount} />

      {/* CTA Button */}
      {ctaButton?.text && (
        <Button
          className="hidden md:inline-flex ml-2 btn-theme-primary"
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
        stickyHeader && 'sticky top-0 z-50',
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
              <div className="hidden lg:block">
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
              <div className="hidden lg:flex items-center gap-3">
                <Search 
                  className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" 
                  style={{ color: 'var(--theme-text)' }}
                  onClick={() => setSearchOpen(true)}
                />
                <ShoppingCart 
                  className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" 
                  style={{ color: 'var(--theme-text)' }}
                />
                {ctaButton?.text && (
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
              <div className="flex lg:hidden items-center gap-2">
                <Search 
                  className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" 
                  style={{ color: 'var(--theme-text)' }}
                  onClick={() => setSearchOpen(true)}
                />
                <ShoppingCart 
                  className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" 
                  style={{ color: 'var(--theme-text)' }}
                />
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
            <div className="hidden md:block text-center space-y-2">
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
                  <Search 
                    className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" 
                    style={{ color: 'var(--theme-text)' }}
                    onClick={() => setSearchOpen(true)}
                  />
                  <ShoppingCart 
                    className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" 
                    style={{ color: 'var(--theme-text)' }}
                  />
                </nav>
              </div>
              {/* CTA Button below navigation */}
              {ctaButton?.text && (
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
            <div className="md:hidden">
              <div className="flex items-center justify-between">
                <BrandLogo 
                  brandingType={brandingType}
                  logoUrl={logoUrl}
                  brandText={brandText}
                  logoSize={logoSize}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <Search 
                    className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" 
                    style={{ color: 'var(--theme-text)' }}
                    onClick={() => setSearchOpen(true)}
                  />
                  <ShoppingCart 
                    className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" 
                    style={{ color: 'var(--theme-text)' }}
                  />
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
              <Search 
                className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" 
                style={{ color: 'var(--theme-text)' }}
                onClick={() => setSearchOpen(true)}
              />
              <ShoppingCart 
                className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" 
                style={{ color: 'var(--theme-text)' }}
              />
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
    </header>
  )
}
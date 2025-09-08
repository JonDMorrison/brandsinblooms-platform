'use client'

import { useState } from 'react'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { useCartContext } from '@/src/contexts/CartContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { useDesignSettings } from '@/src/hooks/useDesignSettings'
import { Sheet, SheetContent, SheetTrigger } from '@/src/components/ui/sheet'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { 
  ShoppingCart, 
  Menu, 
  User, 
  Search, 
  X,
  ChevronDown,
  Home,
  Package,
  Info,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'

interface NavigationItem {
  label: string
  href: string
  icon?: React.ReactNode
  children?: NavigationItem[]
}

interface SiteNavigationProps {
  className?: string
}

// Brand logo component that handles different display types
function BrandLogo({ 
  brandingType, 
  logoUrl, 
  brandText, 
  logoSize, 
  className = "",
  textClassName = "font-bold text-xl" 
}: {
  brandingType: 'text' | 'logo' | 'both'
  logoUrl?: string | null
  brandText: string
  logoSize: number
  className?: string
  textClassName?: string
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 hover:opacity-80 transition-opacity", className)}>
      {(brandingType === 'logo' || brandingType === 'both') && logoUrl && (
        <img 
          src={logoUrl} 
          alt="Logo" 
          className="object-contain"
          style={{ height: `${Math.round(logoSize * 0.6)}px` }}
        />
      )}
      {(brandingType === 'text' || brandingType === 'both') && (
        <span 
          className={`${textClassName} theme-brand-text`}
          style={{ 
            color: 'var(--theme-primary)',
            fontFamily: 'var(--theme-font-heading) !important'
          }}
        >
          {brandText}
        </span>
      )}
    </Link>
  )
}

function getDefaultNavItems(): NavigationItem[] {
  return [
    { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Products', href: '/products', icon: <Package className="w-4 h-4" /> },
    { label: 'About', href: '/about', icon: <Info className="w-4 h-4" /> },
    { label: 'Contact', href: '/contact', icon: <Phone className="w-4 h-4" /> },
  ]
}

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
    { label: 'Products', href: '/products', icon: <Package className="w-4 h-4" /> },
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
  
  // Mobile menu component for reuse
  const mobileMenu = (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[350px]">
        <nav className="flex flex-col gap-4 mt-8">
          {navItems.map((item) => (
            <MobileNavItem 
              key={item.href} 
              item={item} 
              onClick={() => setMobileMenuOpen(false)}
            />
          ))}
          {canEdit && (
            <>
              <div className="border-t pt-4 mt-2" />
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gradient-primary-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )

  // Right section component for reuse
  const rightSection = (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className="hidden sm:block">
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="Search products..."
              className="w-[200px]"
              autoFocus
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        )}
      </div>
      
      {/* User Account */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
            <span className="sr-only">Account</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {user ? user.email : 'Guest'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user ? (
            <>
              <DropdownMenuItem asChild>
                <Link href="/account">My Account</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/account/orders">Orders</Link>
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/logout">Sign Out</Link>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link href="/login">Sign In</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/register">Create Account</Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Shopping Cart */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        asChild
      >
        <Link href="/cart">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
          <span className="sr-only">Cart ({itemCount} items)</span>
        </Link>
      </Button>

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
        heightClass,
        className
      )}
    >
      <div className="brand-container mx-auto px-4 h-full">
        {/* Modern Header Style */}
        {headerStyle === 'modern' && (
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
              {mobileMenu}
              <BrandLogo 
                brandingType={brandingType}
                logoUrl={logoUrl}
                brandText={brandText}
                logoSize={logoSize}
              />
              {/* Desktop Navigation */}
              {menuStyle === 'horizontal' && (
                <nav className="hidden md:flex items-center gap-6 ml-6">
                  {navItems.map((item) => (
                    <DesktopNavItem key={item.href} item={item} />
                  ))}
                </nav>
              )}
            </div>
            {rightSection}
          </div>
        )}

        {/* Classic Header Style */}
        {headerStyle === 'classic' && (
          <div className="space-y-3">
            {/* Desktop Layout */}
            <div className="hidden md:block text-center space-y-3">
              <BrandLogo 
                brandingType={brandingType}
                logoUrl={logoUrl}
                brandText={brandText}
                logoSize={logoSize * 0.674}
                className="justify-center"
                textClassName="font-bold text-lg"
              />
              <div className="flex justify-center items-center gap-6">
                <nav className="flex items-center gap-6">
                  {navItems.map((item) => (
                    <DesktopNavItem key={item.href} item={item} />
                  ))}
                  {/* Search and Cart Icons inline with navigation */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    asChild
                  >
                    <Link href="/cart">
                      <ShoppingCart className="h-5 w-5" />
                      {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                          {itemCount > 99 ? '99+' : itemCount}
                        </span>
                      )}
                      <span className="sr-only">Cart ({itemCount} items)</span>
                    </Link>
                  </Button>
                </nav>
              </div>
              {/* CTA Button below navigation */}
              {ctaButton?.text && (
                <div className="flex justify-center pt-2">
                  <Button
                    className="btn-theme-primary"
                    asChild
                  >
                    <Link href={ctaButton.href || '#'}>
                      {ctaButton.text}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mobileMenu}
                  <BrandLogo 
                    brandingType={brandingType}
                    logoUrl={logoUrl}
                    brandText={brandText}
                    logoSize={logoSize}
                  />
                </div>
                {rightSection}
              </div>
            </div>
          </div>
        )}

        {/* Minimal Header Style */}
        {headerStyle === 'minimal' && (
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-2">
              <div className="md:hidden">
                {mobileMenu}
              </div>
              <BrandLogo 
                brandingType={brandingType}
                logoUrl={logoUrl}
                brandText={brandText}
                logoSize={logoSize}
              />
            </div>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" />
              <ShoppingCart className="h-4 w-4 hover:opacity-70 transition-opacity cursor-pointer" />
              {ctaButton?.text && (
                <Button
                  className="btn-theme-primary hidden md:inline-flex"
                  size="sm"
                  asChild
                >
                  <Link href={ctaButton.href || '#'}>
                    {ctaButton.text}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function DesktopNavItem({ item }: { item: NavigationItem }) {
  if (item.children && item.children.length > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-1">
            {item.icon}
            {item.label}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {item.children.map((child) => (
            <DropdownMenuItem key={child.href} asChild>
              <Link href={child.href} className="flex items-center gap-2">
                {child.icon}
                {child.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  
  return (
    <Link
      href={item.href}
      className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md hover:bg-gradient-primary-20 transition-colors"
    >
      {item.icon}
      {item.label}
    </Link>
  )
}

function MobileNavItem({ 
  item, 
  onClick 
}: { 
  item: NavigationItem
  onClick: () => void 
}) {
  const [expanded, setExpanded] = useState(false)
  
  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-gradient-primary-50"
        >
          <span className="flex items-center gap-2">
            {item.icon}
            {item.label}
          </span>
          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>
        {expanded && (
          <div className="ml-4 mt-2 space-y-2">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gradient-primary-50"
                onClick={onClick}
              >
                {child.icon}
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <Link
      href={item.href}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gradient-primary-50"
      onClick={onClick}
    >
      {item.icon}
      {item.label}
    </Link>
  )
}
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { preloadOnHover, preloadCriticalChunks, addResourceHints } from '@/src/lib/preloader'
import {
  Home,
  FileText,
  Palette,
  Package,
  ShoppingCart,
  Settings,
  Flower,
  X,
  Shield,
  ChevronRight,
  ChevronDown,
  User,
  Globe,
  Building2,
  Lock,
  CreditCard,
  Blocks
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Separator } from '@/src/components/ui/separator'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/src/components/ui/collapsible'
import { useAdminAuth } from '@/src/contexts/AdminAuthContext'

interface DashboardSidebarProps {
  onClose?: () => void
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
  children?: Array<{
    name: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

const allNavigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Content', href: '/dashboard/content', icon: FileText },
  { name: 'Design', href: '/dashboard/design', icon: Palette },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    children: [
      { name: 'Profile Settings', href: '/dashboard/settings/profile', icon: User },
      { name: 'Site Information', href: '/dashboard/settings/site', icon: Globe },
      { name: 'Business Configuration', href: '/dashboard/settings/business', icon: Building2 },
      { name: 'Security Settings', href: '/dashboard/settings/security', icon: Lock },
      { name: 'Payment Settings', href: '/dashboard/settings/payments', icon: CreditCard },
      { name: 'Domains', href: '/dashboard/settings/domains', icon: Blocks },
    ]
  },
  { name: 'Admin', href: '/dashboard/admin', icon: Shield, adminOnly: true },
]

export default function DashboardSidebar({ onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { isAdmin } = useAdminAuth()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Filter navigation items based on admin status
  const navigationItems = allNavigationItems.filter(item => {
    // Show Admin item only to admins
    if (item.adminOnly) {
      return isAdmin
    }
    // Show all other items
    return true
  })

  // Auto-expand Settings if on any settings page
  useEffect(() => {
    if (pathname.startsWith('/dashboard/settings')) {
      setExpandedItems(prev => new Set(prev).add('Settings'))
    }
  }, [pathname])

  // Initialize performance optimizations
  useEffect(() => {
    preloadCriticalChunks()
    addResourceHints()
  }, [])

  // Preload handlers for navigation items
  const handleHover = (href: string) => {
    if (href.includes('/products')) {
      preloadOnHover.products()
    } else if (href.includes('/design')) {
      preloadOnHover.design()
    } else if (href.includes('/orders')) {
      preloadOnHover.orders()
    } else if (href.includes('/dashboard')) {
      preloadOnHover.dashboard()
    }
  }

  // Toggle expanded state for an item
  const toggleExpanded = (itemName: string) => {
    // Prevent collapsing Settings if we're on a settings page
    if (itemName === 'Settings' && pathname.startsWith('/dashboard/settings')) {
      return
    }

    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemName)) {
        newSet.delete(itemName)
      } else {
        newSet.add(itemName)
      }
      return newSet
    })
  }

  return (
    <div className="h-full flex flex-col bg-white border-r shadow-lg">
      {/* Logo section */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
            <Flower className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-brand-heading text-gradient-primary">
              Brands & Blooms
            </h1>
            <p className="text-xs text-gray-500">Platform</p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.has(item.name)

          // Check if any child is active
          const isChildActive = hasChildren && item.children?.some(child => pathname === child.href)
          const isParentActive = pathname === item.href || (item.href !== '/dashboard' && !hasChildren && pathname.startsWith(item.href))
          const isActive = isParentActive || isChildActive

          if (hasChildren) {
            return (
              <div key={item.href}>
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(item.name)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      onMouseEnter={() => handleHover(item.href)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-primary text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gradient-primary-50 interactive'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'group-hover:text-primary'}`} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className={`h-4 w-4 transition-transform ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      ) : (
                        <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1">
                    {item.children?.map((child) => {
                      const isChildItemActive = pathname === child.href
                      const ChildIcon = child.icon
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={`flex items-center pl-11 pr-3 py-2 rounded-lg transition-all duration-200 text-sm group ${
                            isChildItemActive
                              ? 'bg-gradient-primary-50 text-primary font-medium border-l-2 border-primary ml-[2px]'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gradient-primary-50 interactive'
                          }`}
                        >
                          {ChildIcon && (
                            <ChildIcon className={`h-4 w-4 mr-2 ${
                              isChildItemActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'
                            }`} />
                          )}
                          <span>{child.name}</span>
                        </Link>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              onMouseEnter={() => handleHover(item.href)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gradient-primary-50 interactive'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'group-hover:text-primary'}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <Separator />

    </div>
  )
}
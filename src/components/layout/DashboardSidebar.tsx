'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { preloadOnHover, preloadCriticalChunks, addResourceHints } from '@/src/lib/preloader'
import { 
  Home, 
  FileText, 
  Palette, 
  Package, 
  ShoppingCart, 
  Settings,
  Flower,
  X
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Separator } from '@/src/components/ui/separator'

interface DashboardSidebarProps {
  onClose?: () => void
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Content', href: '/dashboard/content', icon: FileText },
  { name: 'Design', href: '/dashboard/design', icon: Palette },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardSidebar({ onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

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
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
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

      {/* Bottom section */}
      <div className="p-4">
        <div className="bg-gradient-primary-soft border border-primary/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-gray-1000 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">Pro Plan</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Unlock advanced features and unlimited projects
          </p>
          <Button size="sm" className="w-full btn-gradient-primary text-xs">
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  )
}
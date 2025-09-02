'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { useCartContext } from '@/src/contexts/CartContext'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import {
  Home,
  Search,
  ShoppingCart,
  User,
  Grid3X3,
  Menu
} from 'lucide-react'

interface MobileNavigationProps {
  className?: string
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname()
  const { itemCount } = useCartContext()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  // Hide/show based on scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold
        setIsVisible(false)
      } else {
        // Scrolling up
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])
  
  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/'
    },
    {
      label: 'Shop',
      href: '/products',
      icon: Grid3X3,
      isActive: pathname === '/products'
    },
    {
      label: 'Search',
      href: '/search',
      icon: Search,
      isActive: pathname === '/search'
    },
    {
      label: 'Cart',
      href: '/cart',
      icon: ShoppingCart,
      isActive: pathname === '/cart',
      badge: itemCount > 0 ? itemCount : null
    },
    {
      label: 'Account',
      href: '/account',
      icon: User,
      isActive: pathname?.startsWith('/account')
    }
  ]
  
  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t transition-transform duration-300",
          !isVisible && "translate-y-full",
          className
        )}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative",
                "transition-colors duration-200",
                item.isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      
      {/* Add padding to body to account for fixed bottom nav */}
      <div className="md:hidden h-16" />
    </>
  )
}

// Mobile-optimized product grid component
export function MobileProductGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {children}
    </div>
  )
}

// Touch-optimized button component
export function TouchButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "min-h-[44px] min-w-[44px]", // iOS touch target minimum
        "active:scale-95 transition-transform", // Touch feedback
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

// Swipeable product carousel component
export function SwipeableProductCarousel({ 
  products 
}: { 
  products: any[] 
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe && currentIndex < products.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }
  
  return (
    <div 
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {products.map((product, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {/* Product card content */}
          </div>
        ))}
      </div>
      
      {/* Indicators */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        {products.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  )
}

// Mobile search overlay component
export function MobileSearchOverlay({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex items-center gap-2 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none"
          autoFocus
        />
      </div>
      
      {/* Search results */}
      <div className="p-4">
        {searchQuery ? (
          <div>
            {/* Search results would go here */}
            <p className="text-muted-foreground">
              Searching for "{searchQuery}"...
            </p>
          </div>
        ) : (
          <div>
            {/* Recent searches or suggestions */}
            <h3 className="font-medium mb-3">Popular Searches</h3>
            <div className="space-y-2">
              <button className="block w-full text-left p-2 hover:bg-accent rounded">
                Flowers
              </button>
              <button className="block w-full text-left p-2 hover:bg-accent rounded">
                Plants
              </button>
              <button className="block w-full text-left p-2 hover:bg-accent rounded">
                Gifts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/src/components/ui/sheet'
import { Button } from '@/src/components/ui/button'
import { MobileNavItem } from './NavItems'
import type { NavigationItem } from './types'

interface MobileNavProps {
  navItems: NavigationItem[]
  canEdit: boolean
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export function MobileNav({ 
  navItems, 
  canEdit, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}: MobileNavProps) {
  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
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
}
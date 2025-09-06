'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { 
  Menu, 
  Search, 
  User, 
  Settings, 
  LogOut,
  HelpCircle,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/components/ui/tooltip'
// ThemeToggle removed - light mode only
import { useAuth } from '@/src/contexts/AuthContext'
import { toast } from 'sonner'
import { CompactSiteSwitcher } from '@/src/components/site/SiteSwitcher'
import { GlobalSearch, GlobalSearchDialog } from '@/src/components/search'
import { NotificationCenter } from '@/src/components/notifications'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcut for search (⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Focus the search input by clicking on it
        const searchContainer = searchInputRef.current
        if (searchContainer) {
          const input = searchContainer.querySelector('input')
          if (input) {
            input.focus()
            input.click()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Successfully signed out!')
      // Use window.location for a clean navigation to avoid webpack issues
      window.location.href = '/login'
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const handleHelpClick = () => {
    toast.info('Will open helpdesk / FAQ\'s')
  }

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U'
  }

  return (
    <header className="bg-gradient-card border-b shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Site Switcher */}
          <div className="hidden lg:block">
            <CompactSiteSwitcher />
          </div>

          {/* Search */}
          <div className="hidden md:block" ref={searchInputRef}>
            <GlobalSearch placeholder="Search... (⌘K)" />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Search button for mobile */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications - Hidden for now */}
          {/* <NotificationCenter /> */}

          {/* Help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleHelpClick}>
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Help/Support
            </TooltipContent>
          </Tooltip>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 px-2 space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-white text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start min-w-[120px]">
                  <span className="text-sm font-medium">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {user?.email || 'Loading...'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Dialog */}
      <GlobalSearchDialog 
        open={mobileSearchOpen} 
        onOpenChange={setMobileSearchOpen}
        placeholder="Search content..."
      />
    </header>
  )
}
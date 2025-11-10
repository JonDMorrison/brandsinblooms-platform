'use client'

import Link from 'next/link'
import {
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
// ThemeToggle removed - light mode only
import { useAuth } from '@/src/contexts/AuthContext'
import { useAdminAuth } from '@/src/contexts/AdminAuthContext'
import { toast } from 'sonner'
import { CompactSiteSwitcher } from '@/src/components/site/SiteSwitcher'
import { NotificationCenter } from '@/src/components/notifications'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdminAuth()

  // Check if dev features are enabled
  const isDevFeaturesEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_FEATURES === 'true'

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
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">

          {/* Notifications - Hidden for now */}
          {/* <NotificationCenter /> */}

          {/* User menu - Always visible */}
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
                  <span className="text-xs text-gray-500 truncate max-w-[200px]">
                    {user?.email || 'Loading...'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Admin Panel Link */}
              {isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {/* Development-only menu items */}
              {isDevFeaturesEnabled && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {/* Settings hidden - always hidden from main site */}
                  {false && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              {/* Always show sign out */}
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
    </header>
  )
}
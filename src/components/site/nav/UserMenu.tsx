import Link from 'next/link'
import { User } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import type { UserMenuProps } from './types'

export function UserMenu({ user, canEdit }: UserMenuProps) {
  return (
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
  )
}
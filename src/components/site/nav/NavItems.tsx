import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { cn } from '@/src/lib/utils'
import type { NavItemProps, MobileNavItemProps } from './types'

export function DesktopNavItem({ item }: NavItemProps) {
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
      className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md hover:opacity-70 transition-opacity"
      style={{ color: 'var(--theme-secondary)' }}
    >
      {item.icon}
      {item.label}
    </Link>
  )
}

export function MobileNavItem({ 
  item, 
  onClick 
}: MobileNavItemProps) {
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
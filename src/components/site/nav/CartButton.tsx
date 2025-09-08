import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import type { CartButtonProps } from './types'

export function CartButton({ itemCount }: CartButtonProps) {
  return (
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
  )
}
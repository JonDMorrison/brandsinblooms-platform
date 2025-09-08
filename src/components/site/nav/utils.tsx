import { Home, Package, Info, Phone } from 'lucide-react'
import type { NavigationItem } from './types'

export function getDefaultNavItems(): NavigationItem[] {
  return [
    { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Products', href: '/products', icon: <Package className="w-4 h-4" /> },
    { label: 'About', href: '/about', icon: <Info className="w-4 h-4" /> },
    { label: 'Contact', href: '/contact', icon: <Phone className="w-4 h-4" /> },
  ]
}
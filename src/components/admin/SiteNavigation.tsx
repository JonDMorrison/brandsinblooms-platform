'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Settings, 
  FileText, 
  Package, 
  Activity,
  ArrowLeft,
  UserCheck,
  Eye,
  BarChart3,
  Shield
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'

interface SiteNavigationProps {
  siteId: string
  siteName: string
  siteSubdomain: string
  showBackButton?: boolean
}

export function SiteNavigation({ 
  siteId, 
  siteName, 
  siteSubdomain,
  showBackButton = true 
}: SiteNavigationProps) {
  const pathname = usePathname()

  const navigationItems = [
    {
      name: 'Site Settings',
      href: `/admin/sites/${siteId}/edit`,
      icon: Settings,
      description: 'Basic site configuration and settings'
    },
    {
      name: 'Content Management',
      href: `/admin/sites/${siteId}/content`,
      icon: FileText,
      description: 'Manage pages, posts, and content'
    },
    {
      name: 'Product Management',
      href: `/admin/sites/${siteId}/products`,
      icon: Package,
      description: 'Manage product catalog and inventory'
    },
    {
      name: 'Analytics',
      href: `/admin/sites/${siteId}/analytics`,
      icon: BarChart3,
      description: 'Performance metrics and visitor analytics'
    },
    {
      name: 'Health Monitoring',
      href: `/admin/sites/${siteId}/health`,
      icon: Shield,
      description: 'Site health status and monitoring'
    },
    {
      name: 'Activity Log',
      href: `/admin/sites/${siteId}/activity`,
      icon: Activity,
      description: 'View admin actions and audit trail'
    },
    {
      name: 'Site Access',
      href: `/admin/sites/${siteId}/access`,
      icon: Eye,
      description: 'Impersonate and preview site'
    }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
            <div>
              <CardTitle className="text-lg">{siteName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {siteSubdomain}.brandsinblooms.com
              </p>
            </div>
          </div>
          <Badge variant="outline">Site ID: {siteId.slice(0, 8)}...</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`
                    p-4 rounded-lg border transition-all cursor-pointer
                    ${active 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'hover:bg-muted/50 hover:border-border'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-medium ${active ? 'text-primary' : 'text-foreground'}`}>
                      {item.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
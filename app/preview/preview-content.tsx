'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/database/types'
import { SiteProvider } from '@/src/contexts/SiteContext'
import { Flower } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import Link from 'next/link'
// import { ProductCatalog } from '@/src/components/site/ProductCatalog'
import { SiteThemeProvider, ThemeWrapper } from '@/src/components/theme/ThemeProvider'
import { SiteNavigation } from '@/src/components/site/SiteNavigation'
import { SiteFooter } from '@/src/components/site/SiteFooter'
import { MobileNavigation } from '@/src/components/site/MobileNavigation'
import { CartProvider } from '@/src/contexts/CartContext'

interface PreviewContentProps {
  siteId: string
}

export default function PreviewContent({ siteId }: PreviewContentProps) {
  const [site, setSite] = useState<Tables<'sites'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadSite() {
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('*')
          .eq('id', siteId)
          .single()

        if (error) throw error
        setSite(data)
      } catch (err) {
        console.error('Error loading site:', err)
        setError(err instanceof Error ? err.message : 'Failed to load site')
      } finally {
        setLoading(false)
      }
    }

    loadSite()
  }, [siteId, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
            <Flower className="h-6 w-6 text-white animate-spin" />
          </div>
          <div>
            <h1 className="text-xl font-brand-heading text-gradient-primary">
              Loading Preview...
            </h1>
          </div>
        </div>
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">Error: {error || 'Site not found'}</p>
          <Link href="/dashboard/design">
            <Button>Back to Design</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Provide the site context and render the customer site
  return (
    <SiteProvider initialSiteData={site}>
      <SiteThemeProvider applyToDocument={true}>
        <CartProvider>
          <ThemeWrapper className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="brand-container">
            <div className="text-center space-y-8">
              {/* Welcome Message */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-brand-heading">
                  Welcome to {site.name}
                </h1>
                
                {site.description && (
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                    {site.description}
                  </p>
                )}
              </div>

              {/* Call to Action */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="btn-theme-primary min-w-[160px]">
                  Shop Now
                </Button>
                
                <Button variant="outline" size="lg" className="min-w-[160px]">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Featured Products Section */}
        <section className="py-16">
          <div className="brand-container">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Placeholder product cards */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:scale-105 transition-transform" />
                  </div>
                  <h3 className="font-medium text-sm">Product {i}</h3>
                  <p className="text-sm text-muted-foreground">$29.99</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Categories Section */}
        <section className="py-16 bg-muted/20">
          <div className="brand-container">
            <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 rounded-lg border bg-background hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <Flower className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Flowers</h3>
                <p className="text-sm text-muted-foreground mt-1">Fresh blooms daily</p>
              </div>
              <div className="text-center p-6 rounded-lg border bg-background hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <Flower className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Plants</h3>
                <p className="text-sm text-muted-foreground mt-1">Indoor & outdoor</p>
              </div>
              <div className="text-center p-6 rounded-lg border bg-background hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <Flower className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Gifts</h3>
                <p className="text-sm text-muted-foreground mt-1">Perfect presents</p>
              </div>
              <div className="text-center p-6 rounded-lg border bg-background hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <Flower className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Occasions</h3>
                <p className="text-sm text-muted-foreground mt-1">Special moments</p>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16">
          <div className="brand-container max-w-2xl">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Stay in Bloom</h2>
              <p className="text-muted-foreground">
                Get exclusive offers and be the first to know about new arrivals
              </p>
              <div className="flex gap-2 max-w-md mx-auto mt-6">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border rounded-md"
                />
                <Button className="btn-theme-primary">Subscribe</Button>
              </div>
            </div>
          </div>
        </section>
          
          {/* Site Navigation */}
          <SiteNavigation />
          
          {/* Mobile Navigation - Bottom Bar */}
          <MobileNavigation />
          
          {/* Site Footer */}
          <SiteFooter />
          </ThemeWrapper>
        </CartProvider>
      </SiteThemeProvider>
    </SiteProvider>
  )
}
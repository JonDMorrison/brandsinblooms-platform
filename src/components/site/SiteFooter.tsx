'use client'

import { useSiteContext } from '@/src/contexts/SiteContext'
import { useDesignSettings } from '@/src/hooks/useDesignSettings'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Separator } from '@/src/components/ui/separator'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Truck,
  RefreshCw
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface FooterColumn {
  title: string
  links: Array<{
    label: string
    href: string
  }>
}

interface SocialLink {
  platform: string
  url: string
  icon?: React.ReactNode
}

interface SiteFooterProps {
  className?: string
}

const socialIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  twitter: <Twitter className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
}

function getDefaultFooterColumns(): FooterColumn[] {
  return [
    {
      title: 'Quick Links',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Blog', href: '/blog' },
        { label: 'FAQs', href: '/faqs' },
      ]
    },
    {
      title: 'Customer Service',
      links: [
        { label: 'Track Order', href: '/track-order' },
        { label: 'Returns', href: '/returns' },
        { label: 'Shipping Info', href: '/shipping' },
        { label: 'Size Guide', href: '/size-guide' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Refund Policy', href: '/refunds' },
      ]
    }
  ]
}

function getDefaultSocialLinks(): SocialLink[] {
  return [
    { platform: 'facebook', url: '#' },
    { platform: 'instagram', url: '#' },
    { platform: 'twitter', url: '#' },
  ]
}

export function SiteFooter({ className }: SiteFooterProps) {
  const { currentSite: site } = useSiteContext()
  const { data: designSettings } = useDesignSettings()
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  
  // Get footer configuration from theme settings
  const theme = designSettings
  const footerStyle = theme?.footer?.style || 'comprehensive'
  const columns = theme?.footer?.columns || getDefaultFooterColumns()
  const showNewsletter = theme?.footer?.newsletter !== false
  const socialLinks = theme?.footer?.socialLinks || getDefaultSocialLinks()
  const copyright = theme?.footer?.copyright || `© ${new Date().getFullYear()} ${site?.name || 'Store'}. All rights reserved.`
  const paymentBadges = theme?.footer?.paymentBadges || ['visa', 'mastercard', 'paypal']
  
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setSubscribing(true)
    try {
      // TODO: Implement newsletter subscription
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Successfully subscribed to newsletter!')
      setEmail('')
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setSubscribing(false)
    }
  }
  
  // Render different footer styles
  if (footerStyle === 'minimal') {
    return (
      <footer className={cn('w-full border-t bg-white', className)}>
        <div className="brand-container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">{copyright}</p>
            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <Link
                  key={link.platform}
                  href={link.url}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                  aria-label={link.platform}
                >
                  {socialIcons[link.platform] || <Mail className="w-5 h-5" />}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    )
  }
  
  if (footerStyle === 'centered') {
    return (
      <footer className={cn('w-full border-t bg-white', className)}>
        <div className="brand-container mx-auto px-4 py-12">
          <div className="text-center space-y-6">
            <h3 className="text-2xl font-bold">{site?.name || 'Store'}</h3>
            {site?.description && (
              <p className="text-gray-500 max-w-md mx-auto">
                {site.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-4">
              {socialLinks.map((link) => (
                <Link
                  key={link.platform}
                  href={link.url}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                  aria-label={link.platform}
                >
                  {socialIcons[link.platform] || <Mail className="w-5 h-5" />}
                </Link>
              ))}
            </div>
            <Separator className="my-6" />
            <p className="text-sm text-gray-500">{copyright}</p>
          </div>
        </div>
      </footer>
    )
  }
  
  // Default: comprehensive footer
  return (
    <footer className={cn('w-full border-t bg-white', className)}>
      <div className="brand-container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{site?.name || 'Store'}</h3>
            {site?.description && (
              <p className="text-sm text-gray-500">
                {site.description}
              </p>
            )}
            <div className="space-y-2 text-sm text-gray-500">
              {site?.business_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${site.business_email}`} className="hover:text-gray-900">
                    {site.business_email}
                  </a>
                </div>
              )}
              {site?.business_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${site.business_phone}`} className="hover:text-gray-900">
                    {site.business_phone}
                  </a>
                </div>
              )}
              {site?.business_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{site.business_address}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer Columns */}
          {columns.map((column, index) => (
            <div key={index} className="space-y-4">
              <h4 className="text-sm font-semibold">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Newsletter Section */}
        {showNewsletter && (
          <>
            <Separator className="my-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h4 className="text-lg font-semibold mb-2">Subscribe to our Newsletter</h4>
                <p className="text-sm text-gray-500">
                  Get the latest updates on new products and upcoming sales
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={subscribing}>
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
            </div>
          </>
        )}
        
        {/* Trust Badges & Payment Methods */}
        <Separator className="my-8" />
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Trust Badges */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>Easy Returns</span>
            </div>
          </div>
          
          {/* Payment Badges */}
          <div className="flex items-center gap-3">
            {paymentBadges.map((badge) => (
              <div
                key={badge}
                className="flex items-center justify-center w-12 h-8 border rounded bg-muted/50"
                title={badge}
              >
                <CreditCard className="w-5 h-5 text-gray-500" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom Bar */}
        <Separator className="my-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">{copyright}</p>
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <Link
                key={link.platform}
                href={link.url}
                className="text-gray-500 hover:text-gray-900 transition-colors"
                aria-label={link.platform}
              >
                {socialIcons[link.platform] || <Mail className="w-5 h-5" />}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
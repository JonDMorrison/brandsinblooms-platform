'use client'

import React from 'react'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { useDesignSettings } from '@/src/hooks/useDesignSettings'
import { useAuth } from '@/src/contexts/AuthContext'
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
  RefreshCw,
  Globe,
  LogIn,
  Edit3
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { editSessionUtils } from '@/src/lib/site-editor/edit-session-client'
import { useAuthModal } from '@/src/contexts/AuthModalContext'

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
        { label: 'Home', href: '/home' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Company', href: '/company' },
      ]
    },
    {
      title: 'Care Guides',
      links: [
        { label: 'Watering', href: '/watering' },
        { label: 'Lighting', href: '/lighting' },
        { label: 'Soil', href: '/soil' },
        { label: 'Pests', href: '/pests' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Seasonal Guide', href: '/seasonal-guide' },
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
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Check if we're in edit mode
  React.useEffect(() => {
    setIsEditMode(editSessionUtils.isEditModeEnabled())
  }, [])

  // Handler for opening auth modal for site editing
  const handleOpenAuthForEdit = () => {
    openAuthModal({
      mode: 'signin',
      returnUrl: window.location.pathname,
      enableEdit: true
    })
  }
  
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
                  className="hover:opacity-70 transition-opacity cursor-pointer"
                  style={{ color: 'var(--theme-secondary)' }}
                  aria-label={link.platform}
                >
                  {socialIcons[link.platform] || <Globe className="w-5 h-5" />}
                </Link>
              ))}
            </div>
          </div>

          {/* Site Editor Login/Access Link */}
          {!isEditMode && (
            <div className="mt-4 pt-4 border-t text-center">
              <button
                onClick={handleOpenAuthForEdit}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                {user ? (
                  <>
                    <Edit3 className="w-3 h-3" />
                    Edit this site
                  </>
                ) : (
                  <>
                    <LogIn className="w-3 h-3" />
                    Site owner? Log in
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </footer>
    )
  }
  
  if (footerStyle === 'centered') {
    // Get navigation items from footer settings
    const footerNavItems = theme?.footer?.navigationItems || []

    return (
      <footer className={cn('w-full border-t bg-white', className)}>
        <div className="brand-container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                {/* Navigation Links */}
                {footerNavItems.length > 0 && (
                  <div className="flex justify-center gap-6 text-sm">
                    {footerNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="hover:opacity-70 cursor-pointer transition-opacity capitalize"
                        style={{ color: 'var(--theme-secondary)' }}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
                {/* Social Links */}
                <div className="flex justify-center gap-4">
                  {socialLinks.map((link) => {
                    const IconComponent = socialIcons[link.platform] ?
                      React.cloneElement(socialIcons[link.platform] as React.ReactElement, {
                        className: 'h-4 w-4 hover:opacity-70 cursor-pointer transition-opacity',
                        style: { color: 'var(--theme-primary)' }
                      }) : <Mail className="h-4 w-4 hover:opacity-70 cursor-pointer transition-opacity" style={{ color: 'var(--theme-primary)' }} />
                    return (
                      <Link
                        key={link.platform}
                        href={link.url}
                        aria-label={link.platform}
                      >
                        {IconComponent}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
            {/* Copyright */}
            <div className="border-t pt-3 text-center text-xs" style={{ borderColor: 'rgba(var(--theme-primary-rgb), 0.125)', color: 'rgba(31, 41, 55, 0.5)' }}>
              {copyright}
            </div>

            {/* Site Editor Login/Access Link */}
            {!isEditMode && (
              <div className="text-center">
                <button
                  onClick={handleOpenAuthForEdit}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {user ? (
                    <>
                      <Edit3 className="w-3 h-3" />
                      Edit this site
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3 h-3" />
                      Site owner? Log in
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>
    )
  }
  
  // Default: comprehensive footer
  return (
    <footer className={cn('w-full border-t bg-white', className)}>
      <div className="brand-container mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="space-y-6">
            {/* Footer Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.slice(0, 3).map((column, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--theme-primary)' }}>
                    {column.title}
                  </h4>
                  <ul className="space-y-1">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-xs hover:opacity-70 cursor-pointer transition-opacity"
                          style={{ color: 'var(--theme-secondary)' }}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom section with copyright and social icons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: 'rgba(var(--theme-primary-rgb), 0.125)' }}>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                {copyright}
              </p>
              <div className="flex items-center gap-4">
                {socialLinks.map((link) => (
                  <Link
                    key={link.platform}
                    href={link.url}
                    aria-label={link.platform}
                  >
                    {React.cloneElement(socialIcons[link.platform] as React.ReactElement || <Globe className="w-5 h-5" />, {
                      className: 'w-5 h-5 hover:opacity-70 cursor-pointer transition-opacity',
                      style: { color: 'var(--theme-secondary)' }
                    })}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Site Editor Login/Access Link */}
          {!isEditMode && (
            <div className="pt-4 border-t text-center" style={{ borderColor: 'rgba(var(--theme-primary-rgb), 0.125)' }}>
              <button
                onClick={handleOpenAuthForEdit}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                {user ? (
                  <>
                    <Edit3 className="w-3 h-3" />
                    Edit this site
                  </>
                ) : (
                  <>
                    <LogIn className="w-3 h-3" />
                    Site owner? Log in
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
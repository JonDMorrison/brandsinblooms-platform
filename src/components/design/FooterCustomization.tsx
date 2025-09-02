'use client'

import { Label } from '@/src/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Switch } from '@/src/components/ui/switch'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Textarea } from '@/src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { ThemeSettings, FooterColumn, SocialLink } from '@/src/lib/queries/domains/theme'
import { 
  Layout,
  Plus,
  Trash2,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
  Mail,
  CreditCard,
  Shield,
  Truck
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/src/lib/utils'

interface FooterCustomizationProps {
  value: ThemeSettings
  onChange: (settings: ThemeSettings) => void
}

const FOOTER_STYLES = [
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Simple footer with basic info'
  },
  { 
    value: 'comprehensive', 
    label: 'Comprehensive', 
    description: 'Full footer with multiple columns'
  },
  { 
    value: 'centered', 
    label: 'Centered', 
    description: 'Centered layout with focus on brand'
  },
  { 
    value: 'newsletter', 
    label: 'Newsletter Focus', 
    description: 'Emphasize newsletter signup'
  },
]

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'website', label: 'Website', icon: Globe },
]

const PAYMENT_BADGES = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'apple-pay', label: 'Apple Pay' },
  { value: 'google-pay', label: 'Google Pay' },
]

const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Quick Links',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' },
    ]
  },
  {
    title: 'Customer Service',
    links: [
      { label: 'Track Order', href: '/track-order' },
      { label: 'Returns', href: '/returns' },
      { label: 'Shipping', href: '/shipping' },
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ]
  }
]

export function FooterCustomization({ value, onChange }: FooterCustomizationProps) {
  const [editingColumn, setEditingColumn] = useState<number | null>(null)
  const [newLink, setNewLink] = useState({ label: '', href: '' })
  const [newSocialLink, setNewSocialLink] = useState({ platform: 'facebook', url: '' })

  const footerColumns = value.footer?.columns || DEFAULT_FOOTER_COLUMNS
  const socialLinks = value.footer?.socialLinks || []
  const paymentBadges = value.footer?.paymentBadges || ['visa', 'mastercard', 'paypal']

  const handleFooterChange = (key: string, val: any) => {
    onChange({
      ...value,
      footer: {
        ...value.footer,
        style: value.footer?.style || 'comprehensive',
        columns: footerColumns,
        newsletter: value.footer?.newsletter !== false,
        socialLinks: socialLinks,
        copyright: value.footer?.copyright || '',
        paymentBadges: paymentBadges,
        [key]: val
      }
    })
  }

  const updateColumn = (index: number, column: FooterColumn) => {
    const newColumns = [...footerColumns]
    newColumns[index] = column
    handleFooterChange('columns', newColumns)
  }

  const addColumn = () => {
    const newColumns = [...footerColumns, { title: 'New Column', links: [] }]
    handleFooterChange('columns', newColumns)
    setEditingColumn(newColumns.length - 1)
  }

  const removeColumn = (index: number) => {
    const newColumns = footerColumns.filter((_, i) => i !== index)
    handleFooterChange('columns', newColumns)
  }

  const addLinkToColumn = (columnIndex: number) => {
    if (!newLink.label || !newLink.href) return
    
    const column = footerColumns[columnIndex]
    const updatedColumn = {
      ...column,
      links: [...column.links, newLink]
    }
    updateColumn(columnIndex, updatedColumn)
    setNewLink({ label: '', href: '' })
  }

  const removeLinkFromColumn = (columnIndex: number, linkIndex: number) => {
    const column = footerColumns[columnIndex]
    const updatedColumn = {
      ...column,
      links: column.links.filter((_, i) => i !== linkIndex)
    }
    updateColumn(columnIndex, updatedColumn)
  }

  const addSocialLink = () => {
    if (!newSocialLink.url) return
    
    const newLinks = [...socialLinks, newSocialLink]
    handleFooterChange('socialLinks', newLinks)
    setNewSocialLink({ platform: 'facebook', url: '' })
  }

  const removeSocialLink = (index: number) => {
    const newLinks = socialLinks.filter((_, i) => i !== index)
    handleFooterChange('socialLinks', newLinks)
  }

  const togglePaymentBadge = (badge: string) => {
    const newBadges = paymentBadges.includes(badge)
      ? paymentBadges.filter(b => b !== badge)
      : [...paymentBadges, badge]
    handleFooterChange('paymentBadges', newBadges)
  }

  return (
    <div className="space-y-8">
      {/* Footer Style */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base font-semibold">Footer Style</Label>
        </div>
        <RadioGroup
          value={value.footer?.style || 'comprehensive'}
          onValueChange={(val) => handleFooterChange('style', val)}
        >
          <div className="grid grid-cols-2 gap-4">
            {FOOTER_STYLES.map((style) => (
              <label
                key={style.value}
                className={cn(
                  "relative flex flex-col gap-2 rounded-lg border-2 p-4 cursor-pointer hover:bg-accent/50 transition-colors",
                  value.footer?.style === style.value ? "border-primary bg-accent/20" : "border-border"
                )}
              >
                <RadioGroupItem value={style.value} className="sr-only" />
                <span className="font-medium">{style.label}</span>
                <span className="text-xs text-muted-foreground">{style.description}</span>
              </label>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Newsletter Signup */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Newsletter Signup</Label>
          <Switch
            checked={value.footer?.newsletter !== false}
            onCheckedChange={(checked) => handleFooterChange('newsletter', checked)}
          />
        </div>
      </div>

      {/* Footer Columns (for comprehensive style) */}
      {value.footer?.style !== 'minimal' && value.footer?.style !== 'centered' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Footer Columns</Label>
            <Button size="sm" onClick={addColumn}>
              <Plus className="h-4 w-4 mr-1" />
              Add Column
            </Button>
          </div>
          
          <div className="space-y-4">
            {footerColumns.map((column, columnIndex) => (
              <div key={columnIndex} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  {editingColumn === columnIndex ? (
                    <Input
                      value={column.title}
                      onChange={(e) => updateColumn(columnIndex, { ...column, title: e.target.value })}
                      className="flex-1 mr-2"
                    />
                  ) : (
                    <h4 className="font-medium">{column.title}</h4>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingColumn(editingColumn === columnIndex ? null : columnIndex)}
                    >
                      {editingColumn === columnIndex ? 'Done' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeColumn(columnIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Column Links */}
                <div className="space-y-2">
                  {column.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex items-center justify-between text-sm">
                      <span>{link.label} - {link.href}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeLinkFromColumn(columnIndex, linkIndex)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Add new link */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Link label"
                      value={editingColumn === columnIndex ? newLink.label : ''}
                      onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      placeholder="URL"
                      value={editingColumn === columnIndex ? newLink.href : ''}
                      onChange={(e) => setNewLink({ ...newLink, href: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => addLinkToColumn(columnIndex)}
                      disabled={!newLink.label || !newLink.href}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Media Links */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Social Media Links</Label>
        <div className="space-y-3">
          {socialLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select value={link.platform} disabled>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center gap-2">
                        <platform.icon className="h-4 w-4" />
                        {platform.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={link.url} disabled className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeSocialLink(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {/* Add new social link */}
          <div className="flex gap-2">
            <Select
              value={newSocialLink.platform}
              onValueChange={(val) => setNewSocialLink({ ...newSocialLink, platform: val })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map((platform) => (
                  <SelectItem key={platform.value} value={platform.value}>
                    <div className="flex items-center gap-2">
                      <platform.icon className="h-4 w-4" />
                      {platform.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="URL (e.g., https://facebook.com/yourpage)"
              value={newSocialLink.url}
              onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={addSocialLink}
              disabled={!newSocialLink.url}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Copyright Text */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Copyright Text</Label>
        <Textarea
          placeholder="© 2024 Your Company. All rights reserved."
          value={value.footer?.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`}
          onChange={(e) => handleFooterChange('copyright', e.target.value)}
          rows={2}
        />
      </div>

      {/* Payment Badges */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Payment Methods</Label>
        <div className="grid grid-cols-3 gap-3">
          {PAYMENT_BADGES.map((badge) => (
            <label
              key={badge.value}
              className={cn(
                "flex items-center justify-center p-3 rounded-md border-2 cursor-pointer hover:bg-accent transition-colors",
                paymentBadges.includes(badge.value) ? "border-primary bg-accent" : "border-border"
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={paymentBadges.includes(badge.value)}
                onChange={() => togglePaymentBadge(badge.value)}
              />
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">{badge.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Trust Badges</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Secure Checkout</span>
            </div>
            <Switch
              checked={value.footer?.trustBadges?.secure !== false}
              onCheckedChange={(checked) => handleFooterChange('trustBadges', {
                ...value.footer?.trustBadges,
                secure: checked
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Free Shipping</span>
            </div>
            <Switch
              checked={value.footer?.trustBadges?.shipping !== false}
              onCheckedChange={(checked) => handleFooterChange('trustBadges', {
                ...value.footer?.trustBadges,
                shipping: checked
              })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
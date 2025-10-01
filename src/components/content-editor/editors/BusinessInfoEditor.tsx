/**
 * Business Information section editor component
 * Manages contact information: phone, email, address, hours, social media
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Plus, X } from 'lucide-react'
import {
  FormField,
  FormSection
} from './shared/form-utils'
import { BackgroundToggle } from './shared/background-toggle'

interface BusinessInfoEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

export function BusinessInfoEditor({ section, sectionKey, onUpdate }: BusinessInfoEditorProps) {
  const { data } = section

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  const handleAddHours = () => {
    const hours = Array.isArray(data.hours) ? data.hours : []
    handleDataChange({ hours: [...hours, { days: '', time: '' }] as any })
  }

  const handleUpdateHours = (index: number, field: string, value: string) => {
    const hours = Array.isArray(data.hours) ? [...data.hours] : []
    hours[index] = { ...(hours[index] as any), [field]: value }
    handleDataChange({ hours: hours as any })
  }

  const handleRemoveHours = (index: number) => {
    const hours = Array.isArray(data.hours) ? data.hours : []
    handleDataChange({ hours: hours.filter((_: any, i: number) => i !== index) as any })
  }

  const address = (data.address || {}) as any
  const socials = (data.socials || {}) as any
  const hours = Array.isArray(data.hours) ? data.hours : []

  return (
    <>
      {/* Section Headline */}
      <FormSection>
        <FormField
          id="businessinfo-headline"
          label="Section Title"
          value={String(data.headline || '')}
          onChange={(value) => handleDataChange({ headline: value })}
          placeholder="e.g., Contact Information"
        />
      </FormSection>

      {/* Background Color Toggle */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
        availableOptions={['default', 'alternate']}
      />

      {/* Phone */}
      <FormSection>
        <FormField
          id="businessinfo-phone"
          label="Phone Number (optional)"
          value={String(data.phone || '')}
          onChange={(value) => handleDataChange({ phone: value })}
          placeholder="(555) 123-4567"
        />
      </FormSection>

      {/* Email */}
      <FormSection>
        <FormField
          id="businessinfo-email"
          label="Email Address (optional)"
          value={String(data.email || '')}
          onChange={(value) => handleDataChange({ email: value })}
          placeholder="contact@example.com"
        />
      </FormSection>

      {/* Address */}
      <div className="space-y-3 mb-4">
        <Label className="text-xs font-medium">Address (optional)</Label>
        <div className="space-y-2">
          <FormField
            id="businessinfo-address-street"
            label="Street Address"
            value={String(address.street || '')}
            onChange={(value) => handleDataChange({ address: { ...address, street: value } as any })}
            placeholder="123 Main Street"
          />
          <div className="grid grid-cols-2 gap-2">
            <FormField
              id="businessinfo-address-city"
              label="City"
              value={String(address.city || '')}
              onChange={(value) => handleDataChange({ address: { ...address, city: value } as any })}
              placeholder="City"
            />
            <FormField
              id="businessinfo-address-state"
              label="State"
              value={String(address.state || '')}
              onChange={(value) => handleDataChange({ address: { ...address, state: value } as any })}
              placeholder="State"
            />
          </div>
          <FormField
            id="businessinfo-address-zip"
            label="ZIP Code"
            value={String(address.zip || '')}
            onChange={(value) => handleDataChange({ address: { ...address, zip: value } as any })}
            placeholder="12345"
          />
        </div>
      </div>

      {/* Hours */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Business Hours (optional)</Label>
          <Button
            onClick={handleAddHours}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Hours
          </Button>
        </div>
        <div className="space-y-2">
          {hours.map((hour: any, index: number) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <FormField
                  id={`hour-days-${index}`}
                  label=""
                  value={String(hour.days || '')}
                  onChange={(value) => handleUpdateHours(index, 'days', value)}
                  placeholder="Monday - Friday"
                />
              </div>
              <div className="flex-1">
                <FormField
                  id={`hour-time-${index}`}
                  label=""
                  value={String(hour.time || '')}
                  onChange={(value) => handleUpdateHours(index, 'time', value)}
                  placeholder="9:00 AM - 5:00 PM"
                />
              </div>
              <Button
                onClick={() => handleRemoveHours(index)}
                size="sm"
                variant="outline"
                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        {hours.length === 0 && (
          <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg">
            <p className="text-xs">No hours added yet</p>
          </div>
        )}
      </div>

      {/* Social Media */}
      <div className="space-y-3 mb-4">
        <Label className="text-xs font-medium">Social Media (optional)</Label>
        <div className="space-y-2">
          <FormField
            id="businessinfo-social-facebook"
            label="Facebook URL"
            value={String(socials.facebook || '')}
            onChange={(value) => handleDataChange({ socials: { ...socials, facebook: value } as any })}
            placeholder="https://facebook.com/yourpage"
          />
          <FormField
            id="businessinfo-social-instagram"
            label="Instagram URL"
            value={String(socials.instagram || '')}
            onChange={(value) => handleDataChange({ socials: { ...socials, instagram: value } as any })}
            placeholder="https://instagram.com/yourpage"
          />
          <FormField
            id="businessinfo-social-twitter"
            label="Twitter URL"
            value={String(socials.twitter || '')}
            onChange={(value) => handleDataChange({ socials: { ...socials, twitter: value } as any })}
            placeholder="https://twitter.com/yourpage"
          />
          <FormField
            id="businessinfo-social-linkedin"
            label="LinkedIn URL"
            value={String(socials.linkedin || '')}
            onChange={(value) => handleDataChange({ socials: { ...socials, linkedin: value } as any })}
            placeholder="https://linkedin.com/company/yourcompany"
          />
        </div>
      </div>
    </>
  )
}
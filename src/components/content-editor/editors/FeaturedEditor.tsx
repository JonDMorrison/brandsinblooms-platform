/**
 * Featured section editor component
 * Handles featured section configuration including headline, subtitle, background, and view all button
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import {
  FormField,
  ButtonConfigField,
  FormSection
} from './shared/form-utils'
import { BackgroundToggle } from './shared/background-toggle'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { Input } from '@/src/components/ui/input'
import { Info } from 'lucide-react'

interface FeaturedEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

export function FeaturedEditor({ section, sectionKey, onUpdate }: FeaturedEditorProps) {
  const { data } = section
  const useProductDatabase = data.useProductDatabase ?? false
  const productLimit = data.productLimit ?? 4

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  return (
    <>
      {/* Featured Section Title and Subtitle fields */}
      <FormSection>
        <FormField
          id="featured-headline"
          label="Title"
          value={data.headline || ''}
          onChange={(value) => handleDataChange({ headline: value })}
          placeholder="Featured Plants This Season"
        />

        <div className="space-y-2">
          <Label htmlFor="featured-subheadline" className="text-xs font-medium">
            Subtitle
          </Label>
          <textarea
            id="featured-subheadline"
            value={htmlToText(data.subheadline || '')}
            onChange={(e) => handleDataChange({ subheadline: textToHtml(e.target.value) })}
            placeholder="Supporting subtitle or description"
            className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[60px]"
            rows={3}
          />
        </div>
      </FormSection>

      {/* Database Product Integration */}
      <FormSection>
        <div className="space-y-4">
          {/* Toggle for using database products */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="use-product-database" className="text-xs font-medium">
                Use Featured Products from Database
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically display products marked as featured in your inventory
              </p>
            </div>
            <Switch
              id="use-product-database"
              checked={useProductDatabase}
              onCheckedChange={(checked) => handleDataChange({ useProductDatabase: checked })}
            />
          </div>

          {/* Product limit input - only shown when database mode is enabled */}
          {useProductDatabase && (
            <div className="space-y-2">
              <Label htmlFor="product-limit" className="text-xs font-medium">
                Number of Products to Display
              </Label>
              <Input
                id="product-limit"
                type="number"
                min={1}
                max={4}
                value={productLimit}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  if (!isNaN(value) && value >= 1 && value <= 4) {
                    handleDataChange({ productLimit: value })
                  }
                }}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">
                Choose between 1 and 4 products
              </p>
            </div>
          )}

          {/* Info message when database mode is enabled */}
          {useProductDatabase && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-900 dark:text-blue-100">
                Featured items will be pulled from products marked as featured in your Products dashboard.
                Manual featured items will be hidden while this mode is active.
              </p>
            </div>
          )}
        </div>
      </FormSection>

      {/* Background Color Toggle */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
        availableOptions={['default', 'alternate']}
      />

      {/* View All Button Configuration */}
      <ButtonConfigField
        label="View All Button"
        textValue={data.viewAllText || ''}
        linkValue={data.viewAllLink || ''}
        onTextChange={(value) => handleDataChange({ viewAllText: value })}
        onLinkChange={(value) => handleDataChange({ viewAllLink: value })}
        textPlaceholder="View All Plants"
        linkPlaceholder="/plants"
      />
    </>
  )
}
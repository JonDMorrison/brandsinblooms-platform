/**
 * Values section editor component
 * Handles values section configuration matching customer site structure:
 * headline, description, and values array with icons
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Plus, X } from 'lucide-react'
import { IconPicker } from '@/src/components/content-editor'
import {
  FormField,
  TextareaField,
  FormSection
} from '@/src/components/content-editor/editors/shared/form-utils'
import { BackgroundToggle } from '@/src/components/content-editor/editors/shared/background-toggle'

interface ValuesEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

interface ValueItem {
  id: string
  title: string
  description: string
  icon: string
}

export function ValuesEditor({ section, sectionKey, onUpdate }: ValuesEditorProps) {
  const { data } = section
  const items = (data.items as ValueItem[]) || []

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  const handleAddValue = () => {
    const newValue: ValueItem = {
      id: `value-${Date.now()}`,
      title: 'New Value',
      description: 'Describe this value...',
      icon: 'Star'
    }
    const newItems = [...items, newValue]
    handleDataChange({ items: newItems })
  }

  const handleUpdateValue = (index: number, field: keyof ValueItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    handleDataChange({ items: newItems })
  }

  const handleRemoveValue = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    handleDataChange({ items: newItems })
  }

  return (
    <>
      {/* Values Section Title and Description fields */}
      <FormSection>
        <FormField
          id="values-headline"
          label="Title"
          value={data.headline || ''}
          onChange={(value) => handleDataChange({ headline: value })}
          placeholder="Our Core Values"
        />

        <TextareaField
          id="values-description"
          label="Description"
          value={data.description || ''}
          onChange={(value) => handleDataChange({ description: value })}
          placeholder="The principles that guide everything we do"
          rows={3}
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

      {/* Values List Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Values</Label>
          <Button
            onClick={handleAddValue}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Value
          </Button>
        </div>

        <div className="space-y-2">
          {items.map((valueItem, index) => (
            <div key={valueItem.id || index} className="border border-input rounded-md p-3 space-y-2">
              {/* Header with Value # and Remove button */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600">Value {index + 1}</Label>
                <Button
                  onClick={() => handleRemoveValue(index)}
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Compact horizontal layout for Icon and Title */}
              <div className="flex gap-3 items-start">
                <div className="w-20 flex-shrink-0">
                  <Label className="text-xs text-gray-500 mb-1 block">Icon</Label>
                  <IconPicker
                    value={valueItem.icon || 'Star'}
                    onChange={(icon) => handleUpdateValue(index, 'icon', icon)}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 mb-1 block">Title</Label>
                  <Input
                    value={valueItem.title || ''}
                    onChange={(e) => handleUpdateValue(index, 'title', e.target.value)}
                    placeholder="Value title"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Description</Label>
                <Textarea
                  value={valueItem.description || ''}
                  onChange={(e) => handleUpdateValue(index, 'description', e.target.value)}
                  placeholder="Describe this value..."
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg">
            <p className="text-sm">No values added yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Value" to get started</p>
          </div>
        )}
      </div>
    </>
  )
}
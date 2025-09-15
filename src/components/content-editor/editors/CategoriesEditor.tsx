/**
 * Categories section editor component
 * Handles categories section configuration including headline, subtitle, background, and category selection
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import { 
  FormField, 
  FormSection 
} from './shared/form-utils'
import { BackgroundToggle } from './shared/background-toggle'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface CategoriesEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

// Default categories that match the schema definition
const DEFAULT_CATEGORIES = [
  {
    id: 'beginner-friendly',
    name: 'Beginner-Friendly',
    image: '/images/golden-pothos.jpg',
    link: '/plants?care-level=beginner',
    plantCount: 12,
    description: 'Perfect for new plant parents - low maintenance, forgiving varieties'
  },
  {
    id: 'houseplants',
    name: 'Houseplants',
    image: '/images/snake-plant.jpg',
    link: '/plants?category=houseplants',
    plantCount: 25,
    description: 'Transform indoor spaces with air-purifying and decorative plants'
  },
  {
    id: 'outdoor',
    name: 'Outdoor Specimens',
    image: '/images/japanese-maple.jpg',
    link: '/plants?category=outdoor',
    plantCount: 18,
    description: 'Hardy outdoor plants for landscaping and garden design'
  },
  {
    id: 'succulents',
    name: 'Succulents & Cacti',
    image: '/images/fiddle-leaf-fig.jpg',
    link: '/plants?category=succulents',
    plantCount: 15,
    description: 'Drought-tolerant beauties perfect for sunny spots and xeriscaping'
  }
]

export function CategoriesEditor({ section, sectionKey, onUpdate }: CategoriesEditorProps) {
  const { data } = section

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  // Get selected categories from data, or default to all categories
  const selectedCategories = data.categories || DEFAULT_CATEGORIES
  const selectedCategoryIds = new Set(selectedCategories.map((cat: any) => cat.id))

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      // Add category
      const categoryToAdd = DEFAULT_CATEGORIES.find(cat => cat.id === categoryId)
      if (categoryToAdd) {
        const newCategories = [...selectedCategories, categoryToAdd]
        handleDataChange({ categories: newCategories })
      }
    } else {
      // Remove category
      const newCategories = selectedCategories.filter((cat: any) => cat.id !== categoryId)
      handleDataChange({ categories: newCategories })
    }
  }

  const handleCategoryReorder = (fromIndex: number, toIndex: number) => {
    const newCategories = [...selectedCategories]
    const [movedCategory] = newCategories.splice(fromIndex, 1)
    newCategories.splice(toIndex, 0, movedCategory)
    handleDataChange({ categories: newCategories })
  }

  return (
    <>
      {/* Categories Section Title and Subtitle fields */}
      <FormSection>
        <FormField
          id="categories-headline"
          label="Title"
          value={data.headline || ''}
          onChange={(value) => handleDataChange({ headline: value })}
          placeholder="Shop By Category"
        />
        
        <div className="space-y-2">
          <Label htmlFor="categories-description" className="text-xs font-medium">
            Subtitle
          </Label>
          <textarea
            id="categories-description"
            value={htmlToText(data.description || '')}
            onChange={(e) => handleDataChange({ description: textToHtml(e.target.value) })}
            placeholder="Find Your Perfect Plant Match"
            className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[60px]"
            rows={3}
          />
        </div>
      </FormSection>

      {/* Background Color Toggle */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
      />

      {/* Category Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Categories to Display</Label>
          <span className="text-xs text-muted-foreground">
            {selectedCategories.length} of {DEFAULT_CATEGORIES.length} selected
          </span>
        </div>

        {/* Available Categories */}
        <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
          {DEFAULT_CATEGORIES.map((category) => {
            const isSelected = selectedCategoryIds.has(category.id)
            return (
              <div key={category.id} className="flex items-start gap-3">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <Label 
                    htmlFor={`category-${category.id}`} 
                    className="text-sm font-medium cursor-pointer"
                  >
                    {category.name}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {category.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {category.plantCount} plants • {category.link}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Categories Order */}
        {selectedCategories.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Display Order</Label>
            <div className="space-y-2 p-3 border rounded-lg">
              {selectedCategories.map((category: any, index: number) => (
                <div key={category.id} className="flex items-center gap-3 p-2 bg-background rounded border">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCategoryReorder(index, index - 1)}
                        className="h-6 w-6 p-0"
                      >
                        ↑
                      </Button>
                    )}
                    {index < selectedCategories.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCategoryReorder(index, index + 1)}
                        className="h-6 w-6 p-0"
                      >
                        ↓
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
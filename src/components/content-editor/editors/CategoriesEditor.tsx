/**
 * Categories section editor component
 * Handles dynamic category creation with custom images, names, and links
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { htmlToText, textToHtml } from '@/src/lib/utils/html-text'
import {
  FormField,
  FormSection
} from './shared/form-utils'
import { BackgroundToggle } from './shared/background-toggle'
import { ButtonLinkField } from './shared/ButtonLinkField'
import { CategoryImageUpload } from './shared/CategoryImageUpload'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { useSiteContext } from '@/src/contexts/SiteContext'

interface CategoriesEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

export function CategoriesEditor({ section, sectionKey, onUpdate }: CategoriesEditorProps) {
  const { data } = section
  const { currentSite } = useSiteContext()

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  // Get categories from data, or empty array
  const categories = (data.categories as any[]) || []

  const handleAddCategory = () => {
    const newCategory = {
      id: `category_${Date.now()}`,
      name: 'New Category',
      image: '',
      link: '/'
    }
    const newCategories = [...categories, newCategory]
    handleDataChange({ categories: newCategories })
  }

  const handleDeleteCategory = (categoryId: string) => {
    const newCategories = categories.filter((cat: any) => cat.id !== categoryId)
    handleDataChange({ categories: newCategories })
  }

  const handleCategoryNameChange = (categoryId: string, newName: string) => {
    const newCategories = categories.map((cat: any) =>
      cat.id === categoryId ? { ...cat, name: newName } : cat
    )
    handleDataChange({ categories: newCategories })
  }

  const handleCategoryImageChange = (categoryId: string, imageUrl: string, s3Key?: string) => {
    const newCategories = categories.map((cat: any) =>
      cat.id === categoryId
        ? { ...cat, image: imageUrl, s3_key: s3Key, storage_type: 's3' }
        : cat
    )
    handleDataChange({ categories: newCategories })
  }

  const handleCategoryLinkChange = (categoryId: string, newLink: string) => {
    const newCategories = categories.map((cat: any) =>
      cat.id === categoryId ? { ...cat, link: newLink } : cat
    )
    handleDataChange({ categories: newCategories })
  }

  const handleCategoryReorder = (fromIndex: number, toIndex: number) => {
    const newCategories = [...categories]
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
        availableOptions={['default', 'alternate']}
      />

      {/* Categories Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Categories</Label>
          <Button
            type="button"
            size="sm"
            onClick={handleAddCategory}
            className="h-7 gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Category
          </Button>
        </div>

        {/* Empty state */}
        {categories.length === 0 && (
          <div className="p-8 border-2 border-dashed rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No categories yet. Add your first category to get started.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCategory}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Category
            </Button>
          </div>
        )}

        {/* Category List */}
        {categories.length > 0 && (
          <div className="space-y-3">
            {categories.map((category: any, index: number) => (
              <div
                key={category.id}
                className="p-4 bg-background rounded-lg border space-y-3"
              >
                {/* Header with drag handle and delete */}
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Category {index + 1}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {/* Reorder buttons */}
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCategoryReorder(index, index - 1)}
                        className="h-7 w-7 p-0"
                        title="Move up"
                      >
                        ↑
                      </Button>
                    )}
                    {index < categories.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCategoryReorder(index, index + 1)}
                        className="h-7 w-7 p-0"
                        title="Move down"
                      >
                        ↓
                      </Button>
                    )}

                    {/* Delete button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      title="Delete category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Image</Label>
                  <CategoryImageUpload
                    imageUrl={category.image || null}
                    onImageChange={(url, s3Key) =>
                      handleCategoryImageChange(category.id, url, s3Key)
                    }
                    siteId={currentSite?.id || ''}
                    categoryId={category.id}
                  />
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor={`category-name-${category.id}`} className="text-xs font-medium">
                    Name
                  </Label>
                  <Input
                    id={`category-name-${category.id}`}
                    value={category.name || ''}
                    onChange={(e) => handleCategoryNameChange(category.id, e.target.value)}
                    placeholder="Category name"
                    className="h-8"
                  />
                </div>

                {/* Link Field */}
                <ButtonLinkField
                  value={category.link || ''}
                  onChange={(newLink) => handleCategoryLinkChange(category.id, newLink)}
                  label="Link"
                  placeholder="Select page or enter URL"
                />
              </div>
            ))}
          </div>
        )}

        {/* Helper text */}
        {categories.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} •
            Drag to reorder • Images stored in S3
          </p>
        )}
      </div>
    </>
  )
}

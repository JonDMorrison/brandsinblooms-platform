'use client'

/**
 * Add Section Modal
 * Modal for selecting and adding new sections at specific positions
 */

import React, { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Search, X } from 'lucide-react'
import { ContentSectionType, LAYOUT_SECTIONS, LayoutType } from '@/src/lib/content/schema'
import { cn } from '@/src/lib/utils'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

/** Section metadata for display and categorization */
interface SectionMetadata {
  type: ContentSectionType
  name: string
  description: string
  icon: keyof typeof LucideIcons
  category: 'Core' | 'Marketing' | 'Business' | 'Plant Shop'
}

/** Section metadata database */
const SECTION_METADATA: SectionMetadata[] = [
  // Core sections
  { type: 'text', name: 'Text', description: 'Simple plain text content', icon: 'Type', category: 'Core' },
  { type: 'richText', name: 'Rich Text', description: 'Formatted content with headings and paragraphs', icon: 'FileText', category: 'Core' },
  { type: 'image', name: 'Image', description: 'Single image with caption', icon: 'Image', category: 'Core' },
  { type: 'icon', name: 'Icon', description: 'Decorative icon element', icon: 'Star', category: 'Core' },
  { type: 'gallery', name: 'Gallery', description: 'Image gallery grid', icon: 'Grid3x3', category: 'Core' },

  // Marketing sections
  { type: 'hero', name: 'Hero', description: 'Large header section with headline and CTA', icon: 'Sparkles', category: 'Marketing' },
  { type: 'header', name: 'Header', description: 'Simple title and subtitle header', icon: 'Heading', category: 'Marketing' },
  { type: 'features', name: 'Features', description: 'List of features with icons', icon: 'List', category: 'Marketing' },
  { type: 'featured', name: 'Featured Products', description: 'Showcase featured products or items', icon: 'ShoppingBag', category: 'Marketing' },
  { type: 'categories', name: 'Categories', description: 'Product or content category cards', icon: 'LayoutGrid', category: 'Marketing' },
  { type: 'cta', name: 'Call to Action', description: 'Prominent call-to-action section', icon: 'MousePointerClick', category: 'Marketing' },
  { type: 'testimonials', name: 'Testimonials', description: 'Customer reviews and testimonials', icon: 'MessageSquare', category: 'Marketing' },

  // Business sections
  { type: 'businessInfo', name: 'Business Info', description: 'Contact information and hours', icon: 'Building2', category: 'Business' },
  { type: 'faq', name: 'FAQ', description: 'Frequently asked questions', icon: 'HelpCircle', category: 'Business' },
  { type: 'values', name: 'Values', description: 'Company values and principles', icon: 'Heart', category: 'Business' },
  { type: 'mission', name: 'Mission', description: 'Mission statement section', icon: 'Target', category: 'Business' },
  { type: 'specifications', name: 'Specifications', description: 'Product or service specifications', icon: 'FileCheck', category: 'Business' },
  { type: 'pricing', name: 'Pricing', description: 'Pricing tiers and plans', icon: 'DollarSign', category: 'Business' },
  { type: 'team', name: 'Team', description: 'Team member profiles', icon: 'Users', category: 'Business' },
  { type: 'form', name: 'Form', description: 'Contact or inquiry form', icon: 'Mail', category: 'Business' },

  // Plant Shop sections
  { type: 'plant_showcase', name: 'Plant Showcase', description: 'Featured plants display', icon: 'Flower', category: 'Plant Shop' },
  { type: 'plant_grid', name: 'Plant Grid', description: 'Grid of plant products', icon: 'LayoutGrid', category: 'Plant Shop' },
  { type: 'plant_care_guide', name: 'Care Guide', description: 'Plant care instructions', icon: 'BookOpen', category: 'Plant Shop' },
  { type: 'seasonal_tips', name: 'Seasonal Tips', description: 'Seasonal care recommendations', icon: 'Calendar', category: 'Plant Shop' },
  { type: 'plant_categories', name: 'Plant Categories', description: 'Plant type categories', icon: 'FolderTree', category: 'Plant Shop' },
  { type: 'growing_conditions', name: 'Growing Conditions', description: 'Ideal growing environment', icon: 'Sprout', category: 'Plant Shop' },
  { type: 'plant_comparison', name: 'Plant Comparison', description: 'Compare different plants', icon: 'ArrowLeftRight', category: 'Plant Shop' },
  { type: 'care_calendar', name: 'Care Calendar', description: 'Year-round care schedule', icon: 'CalendarDays', category: 'Plant Shop' },
  { type: 'plant_benefits', name: 'Plant Benefits', description: 'Benefits of plant ownership', icon: 'Award', category: 'Plant Shop' },
  { type: 'soil_guide', name: 'Soil Guide', description: 'Soil types and recommendations', icon: 'Layers', category: 'Plant Shop' }
]

interface AddSectionModalProps {
  isOpen: boolean
  onClose: () => void
  currentLayout: LayoutType
  existingSections: string[]
  onAddSection: (sectionType: ContentSectionType, variant?: string) => void
}

export function AddSectionModal({
  isOpen,
  onClose,
  currentLayout,
  existingSections,
  onAddSection
}: AddSectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Get available sections for current layout
  const layoutConfig = LAYOUT_SECTIONS[currentLayout]
  const availableSectionTypes = [
    ...layoutConfig.required,
    ...layoutConfig.optional
  ]

  // Filter sections based on layout and search query
  const filteredSections = useMemo(() => {
    return SECTION_METADATA.filter(section => {
      // Check if section type is available for this layout
      const isAvailable = availableSectionTypes.includes(section.type)
      if (!isAvailable) return false

      // Check if matches search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          section.name.toLowerCase().includes(query) ||
          section.description.toLowerCase().includes(query) ||
          section.category.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [currentLayout, searchQuery, availableSectionTypes])

  // Group sections by category
  const groupedSections = useMemo(() => {
    const groups: Record<string, SectionMetadata[]> = {}

    filteredSections.forEach(section => {
      if (!groups[section.category]) {
        groups[section.category] = []
      }
      groups[section.category].push(section)
    })

    return groups
  }, [filteredSections])

  const handleSelectSection = (sectionType: ContentSectionType) => {
    // For richText, show variant selection (could be enhanced later)
    // For now, just add with default variant
    const variant = sectionType === 'richText' ? 'other' : undefined

    // Add the section
    onAddSection(sectionType, variant)

    // Show success notification
    const sectionMeta = SECTION_METADATA.find(s => s.type === sectionType)
    toast.success(`${sectionMeta?.name || 'Section'} added`)

    // Close modal and reset
    onClose()
    setSearchQuery('')
  }

  const handleClose = () => {
    onClose()
    setSearchQuery('') // Reset search on close
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Add Section
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search input */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {Object.keys(groupedSections).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No sections found</p>
              <p className="text-sm mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSections).map(([category, sections]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    {category === 'Core' && <LucideIcons.Layers className="w-4 h-4" />}
                    {category === 'Marketing' && <LucideIcons.Megaphone className="w-4 h-4" />}
                    {category === 'Business' && <LucideIcons.Briefcase className="w-4 h-4" />}
                    {category === 'Plant Shop' && <LucideIcons.Leaf className="w-4 h-4" />}
                    {category}
                  </h3>
                  <div className="grid gap-2">
                    {sections.map((section) => {
                      const IconComponent = LucideIcons[section.icon] as React.ComponentType<{ className?: string }>
                      const isAlreadyAdded = existingSections.includes(section.type)

                      return (
                        <button
                          key={section.type}
                          onClick={() => !isAlreadyAdded && handleSelectSection(section.type)}
                          disabled={isAlreadyAdded}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                            isAlreadyAdded
                              ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                              : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                          )}
                        >
                          <div className={cn(
                            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                            isAlreadyAdded ? 'bg-gray-200' : 'bg-blue-100'
                          )}>
                            <IconComponent className={cn(
                              'w-5 h-5',
                              isAlreadyAdded ? 'text-gray-500' : 'text-blue-600'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm text-gray-900">
                                {section.name}
                              </h4>
                              {isAlreadyAdded && (
                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                                  Added
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {section.description}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

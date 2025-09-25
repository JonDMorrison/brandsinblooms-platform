'use client'

/**
 * Section Delete Confirmation Dialog
 * Provides a confirmation dialog when deleting sections to prevent accidental deletions
 */

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ContentSection, ContentSectionType } from '@/lib/content/schema'
import { Trash2, AlertTriangle } from 'lucide-react'

interface SectionDeleteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  sectionKey: string
  section?: ContentSection
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Get human-readable section name with proper Rich Text numbering
 */
function getSectionDisplayName(sectionKey: string, type: ContentSectionType): string {
  // Special handling for Rich Text sections with numbering
  if (sectionKey.startsWith('richText')) {
    if (sectionKey === 'richText') {
      return 'Rich Text'
    } else {
      // Handle richText_1, richText_2, etc. -> Rich Text 02, Rich Text 03, etc.
      const match = sectionKey.match(/^richText_(\d+)$/)
      if (match) {
        const number = parseInt(match[1], 10) + 1 // Start from 02 (1+1)
        return `Rich Text ${number.toString().padStart(2, '0')}`
      }
    }
  }

  // Default type names for other sections
  const typeNames: Record<ContentSectionType, string> = {
    text: 'Text Block',
    richText: 'Rich Text',
    image: 'Image',
    icon: 'Icon',
    gallery: 'Gallery',
    features: 'Features',
    hero: 'Hero Section',
    cta: 'Call to Action',
    testimonials: 'Testimonials',
    form: 'Form',
    pricing: 'Pricing',
    team: 'Team',
    mission: 'Mission',
    values: 'Values',
    specifications: 'Specifications',
    plant_showcase: 'Plant Showcase',
    plant_grid: 'Plant Grid',
    plant_care_guide: 'Care Guide',
    seasonal_tips: 'Seasonal Tips',
    plant_categories: 'Plant Categories',
    growing_conditions: 'Growing Conditions',
    plant_comparison: 'Plant Comparison',
    care_calendar: 'Care Calendar',
    plant_benefits: 'Plant Benefits',
    soil_guide: 'Soil Guide'
  }

  return typeNames[type] || type
}

/**
 * Check if section has content that might be important to preserve
 */
function hasImportantContent(section?: ContentSection): boolean {
  if (!section) return false
  
  const { data } = section
  
  // Check for text content
  if (data.content && data.content.trim().length > 0) {
    return true
  }
  
  // Check for items
  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    return true
  }
  
  // Check for form fields
  if (data.fields && Array.isArray(data.fields) && data.fields.length > 0) {
    return true
  }
  
  // Check for media URLs
  if (data.url && data.url.trim().length > 0) {
    return true
  }
  
  return false
}

export function SectionDeleteDialog({
  isOpen,
  onOpenChange,
  sectionKey,
  section,
  onConfirm,
  onCancel
}: SectionDeleteDialogProps) {
  const sectionTypeName = section ? getSectionDisplayName(sectionKey, section.type) : 'Section'
  const hasContent = hasImportantContent(section)
  
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }
  
  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-full">
              {hasContent ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Trash2 className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                Delete {sectionTypeName}?
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-left space-y-2">
          {hasContent ? (
            <>
              <p>
                This section contains content that will be permanently deleted. 
                This action cannot be undone.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800 font-medium">
                  ⚠️ Section has content that will be lost
                </p>
              </div>
            </>
          ) : (
            <p>
              Are you sure you want to delete this {sectionTypeName.toLowerCase()}? 
              This action cannot be undone.
            </p>
          )}
        </AlertDialogDescription>
        
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Section
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default SectionDeleteDialog
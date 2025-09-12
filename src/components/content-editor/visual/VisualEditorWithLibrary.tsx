'use client'

/**
 * Visual Editor with Component Library Integration
 * Main component that combines the visual editor with the component library system
 */

import React, { useState, useCallback, useMemo } from 'react'
import { PageContent, ContentSection, LayoutType } from '@/lib/content/schema'
import { VisualEditorProvider } from '@/contexts/VisualEditorContext'
import { VisualEditorToolbar } from './VisualEditorToolbar'
import { ComponentLibrary } from '../panels/ComponentLibrary'
import { EditableSection } from './EditableSection'
import { SectionDragDrop } from './SectionDragDrop'
import { SectionActions } from '../panels/SectionActions'
import { createSectionFromTemplate } from '@/lib/content/section-templates'
import { toast } from '@/components/ui/use-toast'

interface VisualEditorWithLibraryProps {
  content: PageContent
  layout: LayoutType
  onContentChange: (content: PageContent) => void
  onContentUpdate?: (fieldPath: string, value: string) => void
  className?: string
  readonly?: boolean
}

export function VisualEditorWithLibrary({
  content,
  layout,
  onContentChange,
  onContentUpdate,
  className = '',
  readonly = false
}: VisualEditorWithLibraryProps) {
  const [isComponentLibraryOpen, setIsComponentLibraryOpen] = useState(false)
  
  // Calculate next section order
  const getNextSectionOrder = useCallback(() => {
    const orders = Object.values(content.sections).map(section => section.order || 0)
    return Math.max(...orders, 0) + 1
  }, [content.sections])
  
  // Handle adding new sections
  const handleAddSection = useCallback((templateId: string, insertAfter?: string) => {
    const result = createSectionFromTemplate(templateId, getNextSectionOrder())
    
    if (!result) {
      toast({
        title: 'Error',
        description: 'Failed to create section from template',
        variant: 'destructive'
      })
      return
    }
    
    const updatedContent: PageContent = {
      ...content,
      sections: {
        ...content.sections,
        [result.key]: result.section
      }
    }
    
    onContentChange(updatedContent)
    
    toast({
      title: 'Section Added',
      description: `New ${result.section.type} section has been added`,
    })
    
    // Close the component library after adding
    setIsComponentLibraryOpen(false)
  }, [content, onContentChange, getNextSectionOrder])
  
  // Handle section deletion
  const handleDeleteSection = useCallback((sectionKey: string) => {
    const { [sectionKey]: deletedSection, ...remainingSections } = content.sections
    
    const updatedContent: PageContent = {
      ...content,
      sections: remainingSections
    }
    
    onContentChange(updatedContent)
    
    toast({
      title: 'Section Deleted',
      description: 'Section has been permanently removed',
    })
  }, [content, onContentChange])
  
  // Handle section visibility toggle
  const handleToggleSectionVisibility = useCallback((sectionKey: string) => {
    const section = content.sections[sectionKey]
    if (!section) return
    
    const updatedContent: PageContent = {
      ...content,
      sections: {
        ...content.sections,
        [sectionKey]: {
          ...section,
          visible: !section.visible
        }
      }
    }
    
    onContentChange(updatedContent)
  }, [content, onContentChange])
  
  // Handle section duplication
  const handleDuplicateSection = useCallback((sectionKey: string) => {
    const section = content.sections[sectionKey]
    if (!section) return
    
    const newSectionKey = `${sectionKey}_copy_${Date.now()}`
    const duplicatedSection: ContentSection = {
      ...section,
      order: getNextSectionOrder()
    }
    
    const updatedContent: PageContent = {
      ...content,
      sections: {
        ...content.sections,
        [newSectionKey]: duplicatedSection
      }
    }
    
    onContentChange(updatedContent)
    
    toast({
      title: 'Section Duplicated',
      description: 'Section has been copied successfully',
    })
  }, [content, onContentChange, getNextSectionOrder])
  
  // Handle section reordering from drag & drop
  const handleSectionReorder = useCallback((sections: Array<{ key: string; section: ContentSection }>) => {
    const updatedSections: Record<string, ContentSection> = {}
    
    sections.forEach(({ key, section }) => {
      updatedSections[key] = section
    })
    
    const updatedContent: PageContent = {
      ...content,
      sections: updatedSections
    }
    
    onContentChange(updatedContent)
  }, [content, onContentChange])
  
  // Get sorted sections for rendering
  const sortedSections = useMemo(() => {
    return Object.entries(content.sections).sort((a, b) => {
      const orderA = a[1].order || 0
      const orderB = b[1].order || 0
      return orderA - orderB
    })
  }, [content.sections])
  
  // Component library toggle handler
  const handleToggleComponentLibrary = useCallback(() => {
    setIsComponentLibraryOpen(!isComponentLibraryOpen)
  }, [isComponentLibraryOpen])
  
  return (
    <VisualEditorProvider
      onContentUpdate={onContentUpdate}
      onSectionAdd={handleAddSection}
      onSectionDelete={handleDeleteSection}
    >
      <div className={`visual-editor-container relative ${className}`}>
        {/* Visual Editor Toolbar */}
        <VisualEditorToolbar
          content={content}
          layout={layout}
          onContentChange={onContentChange}
          onToggleComponentLibrary={!readonly ? handleToggleComponentLibrary : undefined}
          isComponentLibraryOpen={isComponentLibraryOpen}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 relative">
          {/* Sections with Drag & Drop */}
          <SectionDragDrop
            content={content}
            onReorder={handleSectionReorder}
            disabled={readonly}
          >
            {({ isDragging, dragHandle }) => (
              <div className="space-y-4 p-4">
                {sortedSections.length === 0 ? (
                  // Empty state
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No sections yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Add your first section to get started with building your content.
                    </p>
                    {!readonly && (
                      <button
                        onClick={handleToggleComponentLibrary}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Section
                      </button>
                    )}
                  </div>
                ) : (
                  sortedSections.map(([sectionKey, section]) => (
                    <div
                      key={sectionKey}
                      className={`group relative border border-transparent hover:border-gray-200 rounded-lg transition-all ${
                        isDragging ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Section Actions Overlay */}
                      {!readonly && (
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white border shadow-sm rounded-md p-1">
                            <SectionActions
                              sectionKey={sectionKey}
                              section={section}
                              onDelete={handleDeleteSection}
                              onToggleVisibility={handleToggleSectionVisibility}
                              onDuplicate={handleDuplicateSection}
                              dragHandle={dragHandle}
                              compact
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Editable Section Content */}
                      <EditableSection
                        sectionKey={sectionKey}
                        section={section}
                        content={content}
                        onContentChange={onContentChange}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </SectionDragDrop>
        </div>
        
        {/* Component Library Side Panel */}
        {!readonly && (
          <ComponentLibrary
            isOpen={isComponentLibraryOpen}
            onClose={() => setIsComponentLibraryOpen(false)}
            onAddSection={handleAddSection}
          />
        )}
        
        {/* Overlay for when component library is open */}
        {isComponentLibraryOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsComponentLibraryOpen(false)}
          />
        )}
      </div>
    </VisualEditorProvider>
  )
}

export default VisualEditorWithLibrary
'use client'

/**
 * Component Library Usage Example
 * Demonstrates how to use the new component library system
 */

import React, { useState } from 'react'
import { PageContent, LayoutType } from '@/lib/content/schema'
import { VisualEditorWithLibrary } from '../visual/VisualEditorWithLibrary'
import { 
  SECTION_TEMPLATES, 
  createSectionFromTemplate,
  getTemplatesByCategory,
  getAllCategories
} from '@/lib/content/section-templates'

export function ComponentLibraryExample() {
  // Example content
  const [content, setContent] = useState<PageContent>({
    version: '1.0',
    layout: 'other' as LayoutType,
    sections: {},
    settings: {}
  })
  
  const handleContentChange = (newContent: PageContent) => {
    setContent(newContent)
  }
  
  const handleContentUpdate = (fieldPath: string, value: string) => {
    console.log('Content field updated:', fieldPath, value)
  }
  
  // Example of programmatic section creation
  const addExampleSection = () => {
    const result = createSectionFromTemplate('hero', 1)
    if (result) {
      const updatedContent: PageContent = {
        ...content,
        sections: {
          ...content.sections,
          [result.key]: result.section
        }
      }
      setContent(updatedContent)
    }
  }
  
  const categories = getAllCategories()
  const contentTemplates = getTemplatesByCategory('content')
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Component Library Status</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{SECTION_TEMPLATES.length}</div>
            <div className="text-sm text-gray-600">Total Templates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{categories.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{contentTemplates.length}</div>
            <div className="text-sm text-gray-600">Content Templates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{Object.keys(content.sections).length}</div>
            <div className="text-sm text-gray-600">Active Sections</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">Available Categories:</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <span key={category} className="px-2 py-1 bg-gray-100 rounded text-sm">
                {category} ({getTemplatesByCategory(category).length})
              </span>
            ))}
          </div>
        </div>
        
        <button
          onClick={addExampleSection}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Example Hero Section
        </button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <VisualEditorWithLibrary
          content={content}
          layout="other"
          onContentChange={handleContentChange}
          onContentUpdate={handleContentUpdate}
        />
      </div>
    </div>
  )
}

export default ComponentLibraryExample
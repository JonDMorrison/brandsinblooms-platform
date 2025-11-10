'use client'

/**
 * Component Library Demo
 * A demo component to test the component library integration
 */

import React, { useState } from 'react'
import { PageContent, LayoutType } from '@/src/lib/content/schema'
import { VisualEditorWithLibrary } from './VisualEditorWithLibrary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Sample content for testing
const DEMO_CONTENT: PageContent = {
  version: '1.0',
  layout: 'other' as LayoutType,
  sections: {
    hero_sample: {
      type: 'hero',
      data: {
        content: '<h1>Welcome to Component Library Demo</h1><p>This demonstrates the new section insertion and deletion functionality.</p>',
        alignment: 'center'
      },
      visible: true,
      order: 1
    },
    text_sample: {
      type: 'text',
      data: {
        content: 'This is a sample text section. You can edit this content inline or add new sections using the component library.'
      },
      visible: true,
      order: 2
    }
  },
  settings: {
    seo: {
      title: 'Component Library Demo',
      description: 'Testing component library integration'
    }
  }
}

export function ComponentLibraryDemo() {
  const [content, setContent] = useState<PageContent>(DEMO_CONTENT)
  const [isReadonly, setIsReadonly] = useState(false)
  
  const handleContentChange = (newContent: PageContent) => {
    setContent(newContent)
    console.log('Content updated:', newContent)
  }
  
  const handleContentUpdate = (fieldPath: string, value: string) => {
    console.log('Field updated:', fieldPath, value)
  }
  
  const handleReset = () => {
    setContent(DEMO_CONTENT)
  }
  
  const sectionCount = Object.keys(content.sections).length
  const visibleSections = Object.values(content.sections).filter(section => section.visible !== false).length
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Controls */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Library Demo</CardTitle>
              <CardDescription>
                Test the visual editor with component library integration (Milestone 4)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Sections: <strong>{sectionCount}</strong> total, <strong>{visibleSections}</strong> visible
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReadonly(!isReadonly)}
                  >
                    {isReadonly ? 'Enable Editing' : 'Make Readonly'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    Reset Content
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Features to test:</strong></p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Click "Add Section" in the toolbar to open the component library</li>
                  <li>Browse different section categories and templates</li>
                  <li>Add new sections to see them appear with proper ordering</li>
                  <li>Hover over sections to see action buttons (drag, hide, duplicate, delete)</li>
                  <li>Test drag & drop reordering of sections</li>
                  <li>Test section deletion with confirmation dialog</li>
                  <li>Toggle section visibility</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Visual Editor */}
      <VisualEditorWithLibrary
        content={content}
        layout="other"
        onContentChange={handleContentChange}
        onContentUpdate={handleContentUpdate}
        readonly={isReadonly}
        className="min-h-screen"
      />
    </div>
  )
}

export default ComponentLibraryDemo
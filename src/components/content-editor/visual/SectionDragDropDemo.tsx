'use client'

import { useState } from 'react'
import { SectionManager } from '@/src/components/content-editor/SectionManager'
import { PageContent, LayoutType } from '@/src/lib/content/schema'

/**
 * Demo component to test drag-and-drop functionality
 * This can be used for manual testing and demonstrations
 */
export function SectionDragDropDemo() {
  const [content] = useState<PageContent>({
    version: '1.0',
    layout: 'landing',
    sections: {
      hero: {
        type: 'hero',
        data: { content: 'Hero Content' },
        visible: true,
        order: 1
      },
      features: {
        type: 'features',
        data: { items: [] },
        visible: true,
        order: 2
      },
      testimonials: {
        type: 'testimonials',
        data: { items: [] },
        visible: true,
        order: 3
      },
      cta: {
        type: 'cta',
        data: { content: 'Call to Action' },
        visible: true,
        order: 4
      }
    }
  })

  const [layout] = useState<LayoutType>('landing')

  const handleToggleVisibility = (sectionKey: string) => {
    console.log('Toggle visibility:', sectionKey)
  }

  const handleMoveUp = (sectionKey: string) => {
    console.log('Move up:', sectionKey)
  }

  const handleMoveDown = (sectionKey: string) => {
    console.log('Move down:', sectionKey)
  }

  const handleReorderSections = (sections: Array<{ key: string; section: any }>) => {
    console.log('Reorder sections:', sections.map(s => ({ key: s.key, order: s.section.order })))
  }

  const handleSectionClick = (sectionKey: string) => {
    console.log('Section click:', sectionKey)
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-lg font-bold mb-4">Drag & Drop Section Manager Demo</h2>
      
      <div className="border rounded-lg overflow-hidden">
        <SectionManager
          content={content}
          layout={layout}
          onToggleVisibility={handleToggleVisibility}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onReorderSections={handleReorderSections}
          onSectionClick={handleSectionClick}
          isDraggingEnabled={true}
        />
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <h3 className="font-medium mb-2">Test Instructions:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Drag sections by the grip handle to reorder them</li>
          <li>Touch devices: Long press to start dragging</li>
          <li>Smooth animations should occur during dragging</li>
          <li>Check console for reorder events</li>
          <li>Toggle visibility switches should work</li>
        </ul>
      </div>
    </div>
  )
}

export default SectionDragDropDemo
'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers'
import { GripVertical } from 'lucide-react'
import { PageContent, ContentSection } from '@/src/lib/content/schema'

interface SectionDragDropProps {
  content: PageContent
  onReorder: (sections: Array<{ key: string; section: ContentSection }>) => void
  children: (dragHandleProps: { isDragging: boolean; dragHandle: React.ReactNode }) => React.ReactNode
  disabled?: boolean
}

interface DraggableSectionProps {
  id: string
  children: React.ReactNode
  isDragOverlay?: boolean
}

function DraggableSection({ id, children, isDragOverlay = false }: DraggableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
    opacity: isDragging && !isDragOverlay ? 0.5 : 1
  }

  const dragHandle = (
    <div 
      className={`
        cursor-grab active:cursor-grabbing transition-colors p-1 rounded
        ${isDragging ? 'text-primary' : 'text-gray-500 hover:text-primary'}
      `}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </div>
  )

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      {typeof children === 'function' 
        ? (children as any)({ isDragging, dragHandle })
        : children
      }
    </div>
  )
}

export function SectionDragDrop({ 
  content, 
  onReorder, 
  children, 
  disabled = false 
}: SectionDragDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedSection, setDraggedSection] = useState<{
    key: string
    section: ContentSection
  } | null>(null)

  // Configure sensors for touch and pointer devices with optimized constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5
      }
    })
  )

  const sortedSections = Object.entries(content.sections).sort((a, b) => {
    const orderA = a[1].order || 0
    const orderB = b[1].order || 0
    return orderA - orderB
  })

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    // Store the dragged section for overlay rendering
    const draggedEntry = sortedSections.find(([key]) => key === active.id)
    if (draggedEntry) {
      setDraggedSection({
        key: draggedEntry[0],
        section: draggedEntry[1]
      })
    }
  }, [sortedSections])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setDraggedSection(null)
    
    if (!over || active.id === over.id || disabled) return
    
    const oldIndex = sortedSections.findIndex(([key]) => key === active.id)
    const newIndex = sortedSections.findIndex(([key]) => key === over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      // Reorder sections array
      const reorderedSections = arrayMove(sortedSections, oldIndex, newIndex)
      
      // Update order values to match new positions
      const updatedSections = reorderedSections.map(([key, section], index) => ({
        key,
        section: {
          ...section,
          order: index + 1
        }
      }))
      
      onReorder(updatedSections)
    }
  }, [sortedSections, onReorder, disabled])

  if (disabled) {
    return <>{children({ isDragging: false, dragHandle: null })}</>
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
    >
      <SortableContext 
        items={sortedSections.map(([key]) => key)}
        strategy={verticalListSortingStrategy}
      >
        <div className="relative">
          {sortedSections.map(([sectionKey]) => (
            <DraggableSection key={sectionKey} id={sectionKey}>
              {(dragProps: { isDragging: boolean; dragHandle: React.ReactNode }) => 
                children(dragProps)
              }
            </DraggableSection>
          ))}
        </div>
      </SortableContext>
      
      {/* Drag Overlay with enhanced animation */}
      <DragOverlay 
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)'
        }}
      >
        {draggedSection && (
          <div className="transform rotate-3 shadow-2xl">
            {children({
              isDragging: true,
              dragHandle: (
                <div className="cursor-grabbing text-primary p-1 rounded">
                  <GripVertical className="h-4 w-4" />
                </div>
              )
            })}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default SectionDragDrop
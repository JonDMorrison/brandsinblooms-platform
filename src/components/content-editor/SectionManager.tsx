'use client'

import { useMemo, useState, useCallback } from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Switch } from '@/src/components/ui/switch'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown,
  GripVertical,
  CheckCircle,
  AlertCircle,
  Circle
} from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  MeasuringStrategy
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers'

import { 
  PageContent, 
  ContentSection, 
  ContentSectionType,
  LayoutType,
  LAYOUT_SECTIONS 
} from '@/src/lib/content/schema'

interface SectionManagerProps {
  content: PageContent
  layout: LayoutType
  onToggleVisibility: (sectionKey: string) => void
  onMoveUp: (sectionKey: string) => void
  onMoveDown: (sectionKey: string) => void
  onReorderSections?: (sections: Array<{ key: string; section: ContentSection }>) => void
  onSectionClick?: (sectionKey: string) => void
  activeSectionKey?: string
  isDraggingEnabled?: boolean
}

interface SectionItemProps {
  sectionKey: string
  section: ContentSection
  isRequired: boolean
  isActive: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onToggleVisibility: (sectionKey: string) => void
  onMoveUp: (sectionKey: string) => void
  onMoveDown: (sectionKey: string) => void
  onClick: (sectionKey: string) => void
  isDraggingEnabled?: boolean
  isDragging?: boolean
  isOverlay?: boolean
}

interface SortableSectionItemProps extends SectionItemProps {
  id: string
}

function SectionItem({
  sectionKey,
  section,
  isRequired,
  isActive,
  canMoveUp,
  canMoveDown,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onClick,
  isDraggingEnabled = false,
  isDragging = false,
  isOverlay = false
}: SectionItemProps) {
  const getSectionIcon = (type: ContentSectionType) => {
    const iconMap = {
      hero: '🦸',
      richText: '📝',
      text: '📄',
      image: '🖼️',
      icon: '⭐',
      gallery: '🖼️',
      features: '⚡',
      cta: '📢',
      testimonials: '💬',
      form: '📝',
      pricing: '💰',
      team: '👥',
      mission: '🎯',
      values: '💎',
      specifications: '📋'
    }
    return iconMap[type] || '📄'
  }

  const getSectionStatus = () => {
    const hasContent = section.data.content || section.data.url || section.data.icon || 
                      (section.data.items && Array.isArray(section.data.items) && section.data.items.length > 0)
    
    if (!section.visible) {
      return { icon: EyeOff, label: 'Hidden', className: 'text-gray-500' }
    }
    
    if (hasContent) {
      return { icon: CheckCircle, label: 'Complete', className: 'text-green-600' }
    }
    
    if (isRequired) {
      return { icon: AlertCircle, label: 'Required', className: 'text-amber-600' }
    }
    
    return { icon: Circle, label: 'Empty', className: 'text-gray-500' }
  }

  const status = getSectionStatus()
  const StatusIcon = status.icon

  const formatSectionName = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
        ${isActive 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:bg-gradient-primary-50/50'
        }
        ${isDragging ? 'opacity-50 shadow-lg transform rotate-2 scale-105' : ''}
        ${isOverlay ? 'shadow-2xl border-primary bg-primary/10' : ''}
      `}
      onClick={() => onClick(sectionKey)}
    >
      {/* Drag Handle */}
      <div className={`flex items-center ${
        isDraggingEnabled ? 'text-primary cursor-grab active:cursor-grabbing' : 'text-gray-500'
      } transition-colors`}>
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Section Info */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-base">{getSectionIcon(section.type)}</span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium truncate">
              {formatSectionName(sectionKey)}
            </h4>
            {isRequired && (
              <Badge variant="secondary" className="text-xs h-4 px-1.5 shrink-0">
                Required
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 mt-0.5">
            <StatusIcon className={`h-3 w-3 ${status.className}`} />
            <span className={`text-xs ${status.className}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Move buttons - hidden when drag is enabled */}
        {!isDraggingEnabled && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onMoveUp(sectionKey)
              }}
              disabled={!canMoveUp}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onMoveDown(sectionKey)
              }}
              disabled={!canMoveDown}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </>
        )}

        {/* Visibility toggle */}
        <Switch
          checked={section.visible}
          onCheckedChange={() => onToggleVisibility(sectionKey)}
          disabled={isRequired}
          size="sm"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}

// Sortable wrapper for drag-and-drop functionality
function SortableSectionItem({
  id,
  ...props
}: SortableSectionItemProps) {
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
    zIndex: isDragging ? 1000 : 'auto'
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="touch-none"
    >
      <SectionItem 
        {...props} 
        isDragging={isDragging}
        isDraggingEnabled={true}
      />
    </div>
  )
}

export function SectionManager({
  content,
  layout,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onReorderSections,
  onSectionClick,
  activeSectionKey,
  isDraggingEnabled = true
}: SectionManagerProps) {
  const layoutConfig = LAYOUT_SECTIONS[layout]
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedSection, setDraggedSection] = useState<{
    key: string
    section: ContentSection
  } | null>(null)
  
  const sortedSections = useMemo(() => {
    return Object.entries(content.sections).sort((a, b) => {
      const orderA = a[1].order || 0
      const orderB = b[1].order || 0
      return orderA - orderB
    })
  }, [content.sections])

  // Configure sensors for touch and pointer devices
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

  const sectionStats = useMemo(() => {
    const total = sortedSections.length
    const visible = sortedSections.filter(([, section]) => section.visible).length
    const completed = sortedSections.filter(([, section]) => {
      const hasContent = section.data.content || section.data.url || section.data.icon ||
                        (section.data.items && Array.isArray(section.data.items) && section.data.items.length > 0)
      return section.visible && hasContent
    }).length
    
    return { total, visible, completed }
  }, [sortedSections])

  const canMoveUp = (index: number) => index > 0
  const canMoveDown = (index: number) => index < sortedSections.length - 1

  const handleSectionClick = (sectionKey: string) => {
    onSectionClick?.(sectionKey)
  }

  // Drag and drop handlers
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
    
    if (!over || active.id === over.id) return
    
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
      
      // Call the reorder handler if provided (for optimistic updates)
      if (onReorderSections) {
        onReorderSections(updatedSections)
      } else {
        // Fallback to individual moves for backward compatibility
        if (newIndex > oldIndex) {
          // Moving down
          for (let i = 0; i < newIndex - oldIndex; i++) {
            onMoveDown(active.id as string)
          }
        } else {
          // Moving up
          for (let i = 0; i < oldIndex - newIndex; i++) {
            onMoveUp(active.id as string)
          }
        }
      }
    }
  }, [sortedSections, onReorderSections, onMoveUp, onMoveDown])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium">Section Manager</h3>
            <p className="text-xs text-gray-500">
              {layout.charAt(0).toUpperCase() + layout.slice(1)} Layout
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="text-lg font-medium">{sectionStats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-medium text-blue-600">
              {sectionStats.visible}
            </div>
            <div className="text-xs text-blue-600">Visible</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-lg font-medium text-green-600">
              {sectionStats.completed}
            </div>
            <div className="text-xs text-green-600">Complete</div>
          </div>
        </div>
      </div>

      {/* Section List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isDraggingEnabled ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              measuring={{
                droppable: {
                  strategy: MeasuringStrategy.Always
                }
              }}
              modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
            >
              <SortableContext 
                items={sortedSections.map(([key]) => key)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 relative">
                  {sortedSections.map(([sectionKey, section], index) => {
                    const isRequired = layoutConfig.required.includes(sectionKey)
                    const isActive = activeSectionKey === sectionKey
                    
                    return (
                      <SortableSectionItem
                        key={sectionKey}
                        id={sectionKey}
                        sectionKey={sectionKey}
                        section={section}
                        isRequired={isRequired}
                        isActive={isActive}
                        canMoveUp={canMoveUp(index)}
                        canMoveDown={canMoveDown(index)}
                        onToggleVisibility={onToggleVisibility}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        onClick={handleSectionClick}
                      />
                    )
                  })}
                </div>
              </SortableContext>
              
              {/* Drag Overlay */}
              <DragOverlay 
                dropAnimation={{
                  duration: 200,
                  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)'
                }}
              >
                {draggedSection && (
                  <div className="transform rotate-3">
                    <SectionItem
                      sectionKey={draggedSection.key}
                      section={draggedSection.section}
                      isRequired={layoutConfig.required.includes(draggedSection.key)}
                      isActive={activeSectionKey === draggedSection.key}
                      canMoveUp={false}
                      canMoveDown={false}
                      onToggleVisibility={onToggleVisibility}
                      onMoveUp={onMoveUp}
                      onMoveDown={onMoveDown}
                      onClick={handleSectionClick}
                      isOverlay={true}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            // Fallback to non-draggable version
            <div className="space-y-2">
              {sortedSections.map(([sectionKey, section], index) => {
                const isRequired = layoutConfig.required.includes(sectionKey)
                const isActive = activeSectionKey === sectionKey
                
                return (
                  <SectionItem
                    key={sectionKey}
                    sectionKey={sectionKey}
                    section={section}
                    isRequired={isRequired}
                    isActive={isActive}
                    canMoveUp={canMoveUp(index)}
                    canMoveDown={canMoveDown(index)}
                    onToggleVisibility={onToggleVisibility}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    onClick={handleSectionClick}
                    isDraggingEnabled={false}
                  />
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-xs text-gray-500 text-center">
          {isDraggingEnabled 
            ? 'Drag sections to reorder • Toggle visibility with switches'
            : 'Use arrows to reorder • Toggle visibility with switches'
          }
        </p>
      </div>
    </div>
  )
}

export default SectionManager
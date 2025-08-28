'use client'

import React, { ReactNode } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card } from '@/src/components/ui/card'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ItemListEditorProps<T extends { id: string }> {
  items: T[]
  onAdd: () => void
  onUpdate: (index: number, item: T) => void
  onRemove: (index: number) => void
  onReorder?: (items: T[]) => void
  renderItem: (item: T, index: number, dragHandle: ReactNode) => ReactNode
  emptyMessage?: string
  maxItems?: number
  addButtonLabel?: string
}

interface SortableItemProps {
  id: string
  children: (dragHandle: ReactNode) => ReactNode
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const dragHandle = (
    <div
      className="cursor-move p-1 hover:bg-accent rounded"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
    </div>
  )

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  )
}

export function ItemListEditor<T extends { id: string }>({
  items,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  renderItem,
  emptyMessage = 'No items yet',
  maxItems,
  addButtonLabel = 'Add Item'
}: ItemListEditorProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex)
        onReorder?.(newItems)
      }
    }
  }

  const canAddMore = !maxItems || items.length < maxItems

  if (items.length === 0) {
    return (
      <div className="border-2 border-dashed border-muted rounded-lg p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">{emptyMessage}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            disabled={!canAddMore}
          >
            <Plus className="h-4 w-4 mr-2" />
            {addButtonLabel}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {onReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((item, index) => (
                <SortableItem key={item.id} id={item.id}>
                  {(dragHandle) => (
                    <Card className="p-4">
                      <div className="flex gap-3">
                        {dragHandle}
                        <div className="flex-1">
                          {renderItem(item, index, dragHandle)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => onRemove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  )}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  {renderItem(item, index, null)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {canAddMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {addButtonLabel}
        </Button>
      )}

      {maxItems && items.length >= maxItems && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum of {maxItems} items reached
        </p>
      )}
    </div>
  )
}
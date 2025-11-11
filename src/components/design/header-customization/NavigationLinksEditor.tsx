/**
 * NavigationLinksEditor component for managing navigation menu items
 * Supports CRUD operations, reordering, visibility toggle
 */

import React, { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { ButtonLinkField } from '@/src/components/content-editor/editors/shared/ButtonLinkField'
import { NavigationItem } from '@/src/lib/queries/domains/theme'
import { generateUUID } from '@/src/lib/utils/uuid'

interface NavigationLinksEditorProps {
  items: NavigationItem[]
  onChange: (items: NavigationItem[]) => void
}

export function NavigationLinksEditor({ items, onChange }: NavigationLinksEditorProps) {
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Add new navigation item
  const handleAddItem = () => {
    const newItem: NavigationItem = {
      id: generateUUID(),
      label: 'New Link',
      href: '/',
      type: 'internal',
      visible: true,
      order: items.length,
    }
    onChange([...items, newItem])
  }

  // Update a specific item
  const handleUpdateItem = (id: string, updates: Partial<NavigationItem>) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
    onChange(updatedItems)
  }

  // Remove an item
  const handleRemoveItem = (id: string) => {
    const filteredItems = items.filter(item => item.id !== id)
    // Reorder remaining items
    const reorderedItems = filteredItems.map((item, index) => ({
      ...item,
      order: index
    }))
    onChange(reorderedItems)
  }

  // Toggle visibility
  const handleToggleVisibility = (id: string) => {
    handleUpdateItem(id, { visible: !items.find(item => item.id === id)?.visible })
  }

  // Move item up
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index - 1]
    newItems[index - 1] = temp
    // Update order property
    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx
    }))
    onChange(reorderedItems)
  }

  // Move item down
  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return
    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index + 1]
    newItems[index + 1] = temp
    // Update order property
    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx
    }))
    onChange(reorderedItems)
  }

  // Open edit modal
  const handleEditItem = (item: NavigationItem) => {
    setEditingItem({ ...item })
    setIsModalOpen(true)
  }

  // Save edited item
  const handleSaveEdit = () => {
    if (!editingItem) return
    handleUpdateItem(editingItem.id, editingItem)
    setIsModalOpen(false)
    setEditingItem(null)
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  // Sort items by order
  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-2">
      {/* Navigation Items List */}
      {sortedItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No navigation links yet. Click "Add Navigation Link" to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 border rounded-lg bg-card hover:bg-accent/5 transition-colors cursor-pointer group"
              onClick={() => handleEditItem(item)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />

              <div className="flex-1 text-sm min-w-0">
                <span className="font-medium">{item.label || 'Untitled Link'}</span>
                <span className="text-muted-foreground mx-2">•</span>
                <span className="text-muted-foreground truncate">{item.href}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleVisibility(item.id)
                  }}
                  className="h-7 w-7 p-0"
                  title={item.visible ? 'Hide link' : 'Show link'}
                >
                  {item.visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveUp(index)
                  }}
                  disabled={index === 0}
                  className="h-7 w-7 p-0"
                  title="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveDown(index)
                  }}
                  disabled={index === sortedItems.length - 1}
                  className="h-7 w-7 p-0"
                  title="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveItem(item.id)
                  }}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  title="Delete link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Navigation Link Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Navigation Link
      </Button>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Add, remove, and reorder navigation links. Click a link to edit it. Use the eye icon to hide links without deleting them.
      </p>

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Navigation Link</DialogTitle>
            <DialogDescription>
              Update the label and destination for this navigation link.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-4">
              {/* Label input */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Link Label
                </Label>
                <Input
                  type="text"
                  value={editingItem.label}
                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                  placeholder="e.g., Home, About, Contact"
                />
              </div>

              {/* Link field */}
              <div>
                <ButtonLinkField
                  value={editingItem.href}
                  onChange={(value) => {
                    const type = value.startsWith('http://') || value.startsWith('https://')
                      ? 'external'
                      : 'internal'
                    setEditingItem({ ...editingItem, href: value, type })
                  }}
                  label="Link Destination"
                  placeholder="Select page or enter URL"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

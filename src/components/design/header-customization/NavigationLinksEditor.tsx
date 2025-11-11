/**
 * NavigationLinksEditor component for managing navigation menu items
 * Supports CRUD operations, reordering, visibility toggle, and nested dropdowns
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
  ChevronRight
} from 'lucide-react'
import { ButtonLinkField } from '@/src/components/content-editor/editors/shared/ButtonLinkField'
import { NavigationItem } from '@/src/lib/queries/domains/theme'
import { generateUUID } from '@/src/lib/utils/uuid'

interface NavigationLinksEditorProps {
  items: NavigationItem[]
  onChange: (items: NavigationItem[]) => void
}

export function NavigationLinksEditor({ items, onChange }: NavigationLinksEditorProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

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

  // Toggle expanded state for dropdowns
  const handleToggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  // Add child item to dropdown
  const handleAddChildItem = (parentId: string) => {
    const parentItem = items.find(item => item.id === parentId)
    if (!parentItem) return

    const newChild: NavigationItem = {
      id: generateUUID(),
      label: 'Sub Link',
      href: '/',
      type: 'internal',
      visible: true,
      order: parentItem.children?.length || 0,
    }

    handleUpdateItem(parentId, {
      children: [...(parentItem.children || []), newChild]
    })
  }

  // Update child item
  const handleUpdateChildItem = (parentId: string, childId: string, updates: Partial<NavigationItem>) => {
    const parentItem = items.find(item => item.id === parentId)
    if (!parentItem || !parentItem.children) return

    const updatedChildren = parentItem.children.map(child =>
      child.id === childId ? { ...child, ...updates } : child
    )

    handleUpdateItem(parentId, { children: updatedChildren })
  }

  // Remove child item
  const handleRemoveChildItem = (parentId: string, childId: string) => {
    const parentItem = items.find(item => item.id === parentId)
    if (!parentItem || !parentItem.children) return

    const filteredChildren = parentItem.children.filter(child => child.id !== childId)
    const reorderedChildren = filteredChildren.map((child, index) => ({
      ...child,
      order: index
    }))

    handleUpdateItem(parentId, { children: reorderedChildren })
  }

  // Sort items by order
  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-3">
      {/* Navigation Items List */}
      {sortedItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No navigation links yet. Click "Add Navigation Link" to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item, index) => (
            <div key={item.id} className="border rounded-lg bg-card">
              {/* Main Item */}
              <div className="p-4 space-y-3">
                {/* Header with controls */}
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                  <div className="flex-1 font-medium text-sm">
                    {item.label || 'Untitled Link'}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    {/* Visibility toggle */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(item.id)}
                      className="h-8 w-8 p-0"
                      title={item.visible ? 'Hide link' : 'Show link'}
                    >
                      {item.visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>

                    {/* Move up */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                      title="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>

                    {/* Move down */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === sortedItems.length - 1}
                      className="h-8 w-8 p-0"
                      title="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Delete link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Expand/collapse (for future dropdown support) */}
                    {item.children && item.children.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleExpanded(item.id)}
                        className="h-8 w-8 p-0"
                        title={expandedItems.has(item.id) ? 'Collapse' : 'Expand'}
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedItems.has(item.id) ? 'rotate-90' : ''
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Label input */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Link Label
                  </Label>
                  <Input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateItem(item.id, { label: e.target.value })}
                    className="h-8"
                    placeholder="e.g., Home, About, Contact"
                  />
                </div>

                {/* Link field */}
                <ButtonLinkField
                  value={item.href}
                  onChange={(value) => {
                    const type = value.startsWith('http://') || value.startsWith('https://')
                      ? 'external'
                      : 'internal'
                    handleUpdateItem(item.id, { href: value, type })
                  }}
                  label="Link Destination"
                  placeholder="Select page or enter URL"
                />

                {/* Add dropdown menu button (future feature) */}
                <div className="pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddChildItem(item.id)}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Dropdown Item
                  </Button>
                </div>
              </div>

              {/* Child items (dropdown menu) */}
              {item.children && item.children.length > 0 && expandedItems.has(item.id) && (
                <div className="border-t bg-muted/30 p-4 space-y-2">
                  <Label className="text-xs text-muted-foreground">Dropdown Menu Items</Label>
                  {item.children
                    .sort((a, b) => a.order - b.order)
                    .map((child) => (
                      <div key={child.id} className="border rounded bg-card p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input
                              type="text"
                              value={child.label}
                              onChange={(e) =>
                                handleUpdateChildItem(item.id, child.id, { label: e.target.value })
                              }
                              className="h-8 text-sm"
                              placeholder="Dropdown item label"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveChildItem(item.id, child.id)}
                            className="h-8 w-8 p-0 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <ButtonLinkField
                          value={child.href}
                          onChange={(value) => {
                            const type = value.startsWith('http://') || value.startsWith('https://')
                              ? 'external'
                              : 'internal'
                            handleUpdateChildItem(item.id, child.id, { href: value, type })
                          }}
                          placeholder="Select page or enter URL"
                        />
                      </div>
                    ))}
                </div>
              )}
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
        Add, remove, and reorder navigation links. Use the eye icon to hide links without deleting them.
        Click "Add Dropdown Item" to create a nested menu.
      </p>
    </div>
  )
}

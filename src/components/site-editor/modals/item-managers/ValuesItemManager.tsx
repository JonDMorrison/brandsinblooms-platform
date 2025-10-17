'use client'

/**
 * Values Item Manager
 * Manages add/delete operations for Values section items
 * Used within Section Settings Modal
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { getIcon } from '@/src/components/content-sections/shared/icon-utils'

interface ValueItem {
  id: string
  icon: string
  title: string
  description: string
}

interface ValuesItemManagerProps {
  section: ContentSection
  sectionKey: string
  onAdd: () => void
  onDelete: (itemIndex: number) => void
}

export function ValuesItemManager({
  section,
  sectionKey,
  onAdd,
  onDelete
}: ValuesItemManagerProps) {
  const { data } = section
  const items = (data.items as ValueItem[]) || []

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Values</Label>
          <p className="text-xs text-gray-500 mt-1">
            Manage the value items displayed in this section
          </p>
        </div>
        <Button
          onClick={onAdd}
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Value
        </Button>
      </div>

      {/* Values List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {items.map((value, index) => {
          const IconComponent = getIcon(value.icon)

          return (
            <div
              key={value.id || index}
              className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Icon Preview */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                {IconComponent && (
                  <IconComponent className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Value Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {value.title || 'Untitled Value'}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {value.description || 'No description'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Icon: {value.icon}
                </p>
              </div>

              {/* Delete Button */}
              <Button
                onClick={() => onDelete(index)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">No values added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "Add Value" to get started
          </p>
        </div>
      )}

      {/* Info Note */}
      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> After adding or deleting values, you can edit their content (title, description, icon)
          by clicking on them in Edit mode.
        </p>
      </div>
    </div>
  )
}

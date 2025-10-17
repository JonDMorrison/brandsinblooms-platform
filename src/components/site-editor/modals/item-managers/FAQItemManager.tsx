'use client'

/**
 * FAQ Item Manager
 * Manages add/delete operations for FAQ section items
 * Used within Section Settings Modal
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Plus, Trash2, HelpCircle } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  order?: number
}

interface FAQItemManagerProps {
  section: ContentSection
  sectionKey: string
  onAdd: () => void
  onDelete: (itemIndex: number) => void
}

export function FAQItemManager({
  section,
  sectionKey,
  onAdd,
  onDelete
}: FAQItemManagerProps) {
  const { data } = section

  // Ensure FAQs is an array
  const faqs: FAQItem[] = Array.isArray(data.faqs)
    ? (data.faqs as unknown as FAQItem[])
    : []

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">FAQs</Label>
          <p className="text-xs text-gray-500 mt-1">
            Manage the FAQ items displayed in this section
          </p>
        </div>
        <Button
          onClick={onAdd}
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add FAQ
        </Button>
      </div>

      {/* FAQs List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {faqs.map((faq, index) => {
          return (
            <div
              key={faq.id || index}
              className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Question Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-blue-600" />
              </div>

              {/* FAQ Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {faq.question || 'Untitled Question'}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {faq.answer || 'No answer provided'}
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
      {faqs.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">No FAQs added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Click "Add FAQ" to get started
          </p>
        </div>
      )}

      {/* Info Note */}
      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> After adding or deleting FAQs, you can edit their content (question, answer)
          by clicking on them in Edit mode.
        </p>
      </div>
    </div>
  )
}

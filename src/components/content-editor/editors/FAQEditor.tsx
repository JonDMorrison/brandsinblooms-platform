/**
 * FAQ section editor component
 * Manages FAQ items with questions and answers
 */

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Button } from '@/src/components/ui/button'
import { Plus, X } from 'lucide-react'
import {
  FormField,
  TextareaField,
  FormSection
} from './shared/form-utils'
import { BackgroundToggle } from './shared/background-toggle'

interface FAQEditorProps {
  section: ContentSection
  sectionKey: string
  onUpdate: (sectionKey: string, section: ContentSection) => void
}

interface FAQItem {
  id: string
  question: string
  answer: string
  order?: number
}

/**
 * Parse FAQ data with backward compatibility for stringified JSON
 * Handles legacy data that was incorrectly saved as JSON strings
 */
function parseFAQData(data: unknown): FAQItem[] {
  // Case 1: Already an array (correct format)
  if (Array.isArray(data)) {
    return data as FAQItem[]
  }

  // Case 2: Stringified JSON (corrupted format from bug)
  if (typeof data === 'string' && data.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        console.warn('[FAQEditor] Auto-migrating stringified FAQ data to array format')
        return parsed as FAQItem[]
      }
    } catch (error) {
      console.error('[FAQEditor] Failed to parse stringified FAQ data:', error)
    }
  }

  // Case 3: Invalid or missing data
  return []
}

export function FAQEditor({ section, sectionKey, onUpdate }: FAQEditorProps) {
  const { data } = section

  // Parse FAQ data with backward compatibility for stringified JSON
  const faqs: FAQItem[] = parseFAQData(data.faqs)

  const handleDataChange = (newData: Partial<ContentSection['data']>) => {
    onUpdate(sectionKey, {
      ...section,
      data: { ...section.data, ...newData }
    })
  }

  const handleAddFAQ = () => {
    const newFAQ: FAQItem = {
      id: `faq-${Date.now()}`,
      question: '',
      answer: '',
      order: faqs.length
    }
    const newFAQs = [...faqs, newFAQ]
    handleDataChange({ faqs: newFAQs as any })
  }

  const handleUpdateFAQ = (index: number, field: keyof FAQItem, value: string) => {
    const newFAQs = [...faqs]
    newFAQs[index] = { ...newFAQs[index], [field]: value as any }
    handleDataChange({ faqs: newFAQs as any })
  }

  const handleRemoveFAQ = (index: number) => {
    const newFAQs = faqs.filter((_, i) => i !== index)
    handleDataChange({ faqs: newFAQs as any })
  }

  return (
    <>
      {/* FAQ Section Title and Description */}
      <FormSection>
        <FormField
          id="faq-headline"
          label="Section Title"
          value={String(data.headline || '')}
          onChange={(value) => handleDataChange({ headline: value })}
          placeholder="Frequently Asked Questions"
        />

        <TextareaField
          id="faq-description"
          label="Description (optional)"
          value={String(data.description || '')}
          onChange={(value) => handleDataChange({ description: value })}
          placeholder="Additional description for the FAQ section"
          rows={2}
        />
      </FormSection>

      {/* Background Color Toggle */}
      <BackgroundToggle
        sectionKey={sectionKey}
        section={section}
        onUpdate={onUpdate}
        className="mb-4"
        availableOptions={['default', 'alternate']}
      />

      {/* FAQ Items Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">FAQ Items</Label>
          <Button
            onClick={handleAddFAQ}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add FAQ
          </Button>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={faq.id || index} className="border border-input rounded-md p-3 space-y-2">
              {/* Header with FAQ # and Remove button */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600">FAQ {index + 1}</Label>
                <Button
                  onClick={() => handleRemoveFAQ(index)}
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Question and Answer Fields */}
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Question</Label>
                  <TextareaField
                    id={`faq-question-${index}`}
                    label=""
                    value={faq.question || ''}
                    onChange={(value) => handleUpdateFAQ(index, 'question', value)}
                    placeholder="Enter FAQ question"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Answer</Label>
                  <TextareaField
                    id={`faq-answer-${index}`}
                    label=""
                    value={faq.answer || ''}
                    onChange={(value) => handleUpdateFAQ(index, 'answer', value)}
                    placeholder="Enter FAQ answer"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {faqs.length === 0 && (
          <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
            <p className="text-sm">No FAQs added yet</p>
            <p className="text-xs text-gray-400 mt-1">Click &ldquo;Add FAQ&rdquo; to get started</p>
          </div>
        )}
      </div>
    </>
  )
}
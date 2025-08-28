'use client'

import React, { useCallback } from 'react'
import { ContentSection, ContentItem } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { ColumnsSelector } from '../shared/ColumnsSelector'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

interface TestimonialItem extends ContentItem {
  metadata?: {
    rating?: number
    company?: string
    role?: string
  }
}

export function TestimonialsEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as TestimonialItem[]) || []
  const columns = section.data.columns || 2

  const handleAddTestimonial = useCallback(() => {
    const newTestimonial: TestimonialItem = {
      id: `testimonial-${Date.now()}`,
      title: 'Customer Name',
      content: 'Their testimonial goes here...',
      image: '',
      order: items.length + 1,
      metadata: {
        rating: 5,
        company: '',
        role: ''
      }
    }
    onUpdate({ items: [...items, newTestimonial] })
  }, [items, onUpdate])

  const handleUpdateTestimonial = useCallback((index: number, updatedTestimonial: TestimonialItem) => {
    const newItems = [...items]
    newItems[index] = updatedTestimonial
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleRemoveTestimonial = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleReorder = useCallback((reorderedItems: TestimonialItem[]) => {
    const itemsWithOrder = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }))
    onUpdate({ items: itemsWithOrder })
  }, [onUpdate])

  const renderTestimonialItem = useCallback((testimonial: TestimonialItem, index: number) => {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">Testimonial Content</Label>
          <Textarea
            value={testimonial.content || ''}
            onChange={(e) => {
              handleUpdateTestimonial(index, { ...testimonial, content: e.target.value })
            }}
            placeholder="Enter the testimonial..."
            rows={4}
            className="resize-none"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Author Name</Label>
            <Input
              value={testimonial.title || ''}
              onChange={(e) => {
                handleUpdateTestimonial(index, { ...testimonial, title: e.target.value })
              }}
              placeholder="John Doe"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Role/Title</Label>
            <Input
              value={(testimonial.metadata?.role as string) || ''}
              onChange={(e) => {
                handleUpdateTestimonial(index, {
                  ...testimonial,
                  metadata: { ...testimonial.metadata, role: e.target.value }
                })
              }}
              placeholder="CEO"
              className="h-8"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Company</Label>
            <Input
              value={(testimonial.metadata?.company as string) || ''}
              onChange={(e) => {
                handleUpdateTestimonial(index, {
                  ...testimonial,
                  metadata: { ...testimonial.metadata, company: e.target.value }
                })
              }}
              placeholder="Acme Corp"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Rating</Label>
            <Select
              value={(testimonial.metadata?.rating as number)?.toString() || '5'}
              onValueChange={(value) => {
                handleUpdateTestimonial(index, {
                  ...testimonial,
                  metadata: { ...testimonial.metadata, rating: parseInt(value, 10) }
                })
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Avatar URL (Optional)</Label>
          <Input
            value={testimonial.image || ''}
            onChange={(e) => {
              handleUpdateTestimonial(index, { ...testimonial, image: e.target.value })
            }}
            placeholder="https://example.com/avatar.jpg"
            className="h-8"
          />
        </div>
      </div>
    )
  }, [handleUpdateTestimonial])

  return (
    <div className="space-y-4">
      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={1}
        max={3}
        label="Display Columns"
      />
      
      <ItemListEditor
        items={items}
        onAdd={handleAddTestimonial}
        onUpdate={handleUpdateTestimonial}
        onRemove={handleRemoveTestimonial}
        onReorder={handleReorder}
        renderItem={renderTestimonialItem}
        emptyMessage="No testimonials added yet"
        addButtonLabel="Add Testimonial"
      />
    </div>
  )
}
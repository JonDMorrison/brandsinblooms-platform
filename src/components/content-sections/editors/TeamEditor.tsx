'use client'

import React, { useCallback } from 'react'
import { ContentSection, ContentItem } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { ColumnsSelector } from '../shared/ColumnsSelector'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

interface TeamMember extends ContentItem {
  metadata?: {
    social?: {
      linkedin?: string
      twitter?: string
      email?: string
    }
  }
}

export function TeamEditor({ section, onUpdate }: SectionEditorProps) {
  const items = (section.data.items as TeamMember[]) || []
  const columns = section.data.columns || 3

  const handleAddMember = useCallback(() => {
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      title: 'Team Member',
      subtitle: 'Role',
      content: 'Brief bio...',
      image: '',
      order: items.length + 1,
      metadata: {
        social: {
          linkedin: '',
          twitter: '',
          email: ''
        }
      }
    }
    onUpdate({ items: [...items, newMember] })
  }, [items, onUpdate])

  const handleUpdateMember = useCallback((index: number, updatedMember: TeamMember) => {
    const newItems = [...items]
    newItems[index] = updatedMember
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleRemoveMember = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onUpdate({ items: newItems })
  }, [items, onUpdate])

  const handleReorder = useCallback((reorderedItems: TeamMember[]) => {
    const itemsWithOrder = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }))
    onUpdate({ items: itemsWithOrder })
  }, [onUpdate])

  const renderMemberItem = useCallback((member: TeamMember, index: number) => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Name</Label>
            <Input
              value={member.title || ''}
              onChange={(e) => {
                handleUpdateMember(index, { ...member, title: e.target.value })
              }}
              placeholder="John Doe"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Role</Label>
            <Input
              value={member.subtitle || ''}
              onChange={(e) => {
                handleUpdateMember(index, { ...member, subtitle: e.target.value })
              }}
              placeholder="CEO & Founder"
              className="h-8"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Bio</Label>
          <Textarea
            value={member.content || ''}
            onChange={(e) => {
              handleUpdateMember(index, { ...member, content: e.target.value })
            }}
            placeholder="Brief description of this team member..."
            rows={3}
            className="resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Photo URL</Label>
          <Input
            value={member.image || ''}
            onChange={(e) => {
              handleUpdateMember(index, { ...member, image: e.target.value })
            }}
            placeholder="https://example.com/photo.jpg"
            className="h-8"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-medium">Social Links (Optional)</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={(member.metadata?.social as Record<string, unknown>)?.linkedin as string || ''}
              onChange={(e) => {
                handleUpdateMember(index, {
                  ...member,
                  metadata: {
                    ...member.metadata,
                    social: {
                      ...(member.metadata?.social as Record<string, unknown>),
                      linkedin: e.target.value
                    }
                  }
                })
              }}
              placeholder="LinkedIn URL"
              className="h-8"
            />
            <Input
              value={(member.metadata?.social as Record<string, unknown>)?.twitter as string || ''}
              onChange={(e) => {
                handleUpdateMember(index, {
                  ...member,
                  metadata: {
                    ...member.metadata,
                    social: {
                      ...(member.metadata?.social as Record<string, unknown>),
                      twitter: e.target.value
                    }
                  }
                })
              }}
              placeholder="Twitter URL"
              className="h-8"
            />
            <Input
              value={(member.metadata?.social as Record<string, unknown>)?.email as string || ''}
              onChange={(e) => {
                handleUpdateMember(index, {
                  ...member,
                  metadata: {
                    ...member.metadata,
                    social: {
                      ...(member.metadata?.social as Record<string, unknown>),
                      email: e.target.value
                    }
                  }
                })
              }}
              placeholder="Email"
              className="h-8"
            />
          </div>
        </div>
      </div>
    )
  }, [handleUpdateMember])

  return (
    <div className="space-y-4">
      <ColumnsSelector
        value={columns}
        onChange={(newColumns) => onUpdate({ columns: newColumns })}
        min={1}
        max={4}
        label="Display Columns"
      />
      
      <ItemListEditor
        items={items}
        onAdd={handleAddMember}
        onUpdate={handleUpdateMember}
        onRemove={handleRemoveMember}
        onReorder={handleReorder}
        renderItem={renderMemberItem}
        emptyMessage="No team members added yet"
        addButtonLabel="Add Team Member"
      />
    </div>
  )
}
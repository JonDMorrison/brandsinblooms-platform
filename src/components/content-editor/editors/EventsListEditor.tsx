import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'

interface EventsListEditorProps {
    section: ContentSection
    onUpdate: (data: Partial<ContentSection['data']>) => void
}

export function EventsListEditor({ section, onUpdate }: EventsListEditorProps) {
    const { title, subtitle, limit, layout, programId } = section.data

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Section Title</Label>
                <Input
                    id="title"
                    value={title || ''}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="e.g. Upcoming Events"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                    id="subtitle"
                    value={subtitle || ''}
                    onChange={(e) => onUpdate({ subtitle: e.target.value })}
                    placeholder="e.g. Join us for these upcoming events"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="limit">Max Items</Label>
                    <Input
                        id="limit"
                        type="number"
                        min={1}
                        max={12}
                        value={limit || 3}
                        onChange={(e) => onUpdate({ limit: parseInt(e.target.value) || 3 })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="layout">Layout</Label>
                    <Select
                        value={layout || 'list'}
                        onValueChange={(value) => onUpdate({ layout: value })}
                    >
                        <SelectTrigger id="layout">
                            <SelectValue placeholder="Select layout" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="list">List View</SelectItem>
                            <SelectItem value="grid">Grid View</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="programId">Program ID (Optional)</Label>
                <Input
                    id="programId"
                    value={programId || ''}
                    onChange={(e) => onUpdate({ programId: e.target.value || null })}
                    placeholder="Filter by Program ID"
                />
            </div>
        </div>
    )
}

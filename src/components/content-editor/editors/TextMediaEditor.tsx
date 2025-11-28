'use client'

import React from 'react'
import { ContentSection, TextMediaData } from '@/src/lib/content/sections'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Button } from '@/src/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { AlignLeft, AlignCenter, AlignRight, LayoutTemplate, Columns, Rows } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'

interface TextMediaEditorProps {
    section: ContentSection
    onUpdate: (data: Partial<TextMediaData>) => void
}

export function TextMediaEditor({ section, onUpdate }: TextMediaEditorProps) {
    const data = section.data as TextMediaData

    const updateField = (field: keyof TextMediaData, value: any) => {
        onUpdate({ [field]: value })
    }

    const updateNestedField = (parent: 'image' | 'button', field: string, value: any) => {
        onUpdate({
            [parent]: {
                ...data[parent],
                [field]: value
            }
        })
    }

    return (
        <div className="space-y-6 p-4">
            <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="style">Style & Layout</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={data.title || ''}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="Section Title"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Subtitle</Label>
                        <Input
                            value={data.subtitle || ''}
                            onChange={(e) => updateField('subtitle', e.target.value)}
                            placeholder="Optional Subtitle"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Body Content</Label>
                        <Textarea
                            value={data.body || ''}
                            onChange={(e) => updateField('body', e.target.value)}
                            className="min-h-[150px]"
                            placeholder="Enter your content here (HTML supported)"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input
                            value={data.image?.url || ''}
                            onChange={(e) => updateNestedField('image', 'url', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                        />
                        {data.image?.url && (
                            <div className="mt-2 relative aspect-video rounded-md overflow-hidden border bg-muted">
                                <img src={data.image.url} alt="Preview" className="object-cover w-full h-full" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium text-sm">Call to Action</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Button Label</Label>
                                <Input
                                    value={data.button?.label || ''}
                                    onChange={(e) => updateNestedField('button', 'label', e.target.value)}
                                    placeholder="Learn More"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Button URL</Label>
                                <Input
                                    value={data.button?.url || ''}
                                    onChange={(e) => updateNestedField('button', 'url', e.target.value)}
                                    placeholder="/about"
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="style" className="space-y-6 pt-4">
                    <div className="space-y-3">
                        <Label>Layout</Label>
                        <RadioGroup
                            value={data.layout || 'imageRight'}
                            onValueChange={(v) => updateField('layout', v)}
                            className="grid grid-cols-3 gap-2"
                        >
                            <div>
                                <RadioGroupItem value="imageLeft" id="layout-left" className="peer sr-only" />
                                <Label
                                    htmlFor="layout-left"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    <Columns className="mb-2 h-6 w-6" />
                                    <span className="text-xs">Left</span>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="imageRight" id="layout-right" className="peer sr-only" />
                                <Label
                                    htmlFor="layout-right"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    <Columns className="mb-2 h-6 w-6 rotate-180" />
                                    <span className="text-xs">Right</span>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="stacked" id="layout-stacked" className="peer sr-only" />
                                <Label
                                    htmlFor="layout-stacked"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    <Rows className="mb-2 h-6 w-6" />
                                    <span className="text-xs">Stacked</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-3">
                        <Label>Text Alignment</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={data.align === 'start' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateField('align', 'start')}
                                className="flex-1"
                            >
                                <AlignLeft className="h-4 w-4 mr-2" /> Left
                            </Button>
                            <Button
                                variant={data.align === 'center' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateField('align', 'center')}
                                className="flex-1"
                            >
                                <AlignCenter className="h-4 w-4 mr-2" /> Center
                            </Button>
                            <Button
                                variant={data.align === 'end' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateField('align', 'end')}
                                className="flex-1"
                            >
                                <AlignRight className="h-4 w-4 mr-2" /> Right
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Background Style</Label>
                        <Select
                            value={data.background || 'default'}
                            onValueChange={(v) => updateField('background', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select background" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default (White)</SelectItem>
                                <SelectItem value="muted">Muted (Gray)</SelectItem>
                                <SelectItem value="highlight">Highlight (Brand)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Button Style</Label>
                        <Select
                            value={data.button?.style || 'primary'}
                            onValueChange={(v) => updateNestedField('button', 'style', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="primary">Primary</SelectItem>
                                <SelectItem value="secondary">Secondary</SelectItem>
                                <SelectItem value="link">Link</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Button } from '@/src/components/ui/button'
import { Search, Plus } from 'lucide-react'
import { SECTION_CATALOG, SectionType } from '@/src/lib/content/sections'
import { cn } from '@/src/lib/utils'

interface BlockPickerModalProps {
    open: boolean
    onClose: () => void
    onSelect: (type: SectionType) => void
}

export function BlockPickerModal({ open, onClose, onSelect }: BlockPickerModalProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('all')

    // Filter sections based on search and tab
    const filteredSections = SECTION_CATALOG.filter(section => {
        const matchesSearch =
            section.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            section.description.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesTab = activeTab === 'all' || section.category === activeTab

        return matchesSearch && matchesTab
    })

    const categories = [
        { id: 'all', label: 'All' },
        { id: 'content', label: 'Content' },
        { id: 'media', label: 'Media' },
        { id: 'marketing', label: 'Marketing' },
        { id: 'advanced', label: 'Advanced' }
    ]

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="text-xl">Add a Block</DialogTitle>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search blocks..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                            <TabsList>
                                {categories.map(cat => (
                                    <TabsTrigger key={cat.id} value={cat.id}>{cat.label}</TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSections.map((section) => {
                            const Icon = section.icon
                            return (
                                <button
                                    key={section.type}
                                    className={cn(
                                        "flex flex-col items-start p-4 rounded-xl border bg-white text-left transition-all",
                                        "hover:border-primary hover:shadow-md hover:-translate-y-0.5",
                                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                    )}
                                    onClick={() => onSelect(section.type)}
                                >
                                    <div className="p-2.5 rounded-lg bg-primary/5 text-primary mb-3">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 mb-1">{section.label}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2">{section.description}</p>
                                </button>
                            )
                        })}

                        {filteredSections.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <Search className="w-12 h-12 mb-4 opacity-20" />
                                <p>No blocks found matching "{searchQuery}"</p>
                                <Button variant="link" onClick={() => { setSearchQuery(''); setActiveTab('all') }}>
                                    Clear filters
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

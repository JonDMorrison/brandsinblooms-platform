'use client'

import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { cn } from '@/src/lib/utils'
import { SECTION_REGISTRY } from '@/src/lib/content/sections'

interface GenericPreviewProps {
    section: ContentSection
    sectionKey: string
    className?: string
    title?: string
}

export function GenericPreview({ section, className }: GenericPreviewProps) {
    const metadata = SECTION_REGISTRY[section.type]
    const Icon = metadata?.icon

    return (
        <div className={cn("w-full py-16 px-4 bg-slate-50 border-y border-slate-100", className)}>
            <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-6">
                    {Icon && <Icon className="w-8 h-8 text-slate-400" />}
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {section.data.headline || section.data.title || metadata?.label || 'New Section'}
                </h2>

                {section.data.subheadline && (
                    <p className="text-lg text-slate-600 mb-4">{section.data.subheadline}</p>
                )}

                {section.data.content && (
                    <div className="prose prose-slate mx-auto mb-6" dangerouslySetInnerHTML={{ __html: section.data.content }} />
                )}

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {metadata?.label} Section Preview
                </div>
            </div>
        </div>
    )
}

'use client'

import React from 'react'
import { ContentSection } from '@/src/lib/content/sections'
import { TextMediaData } from '@/src/lib/content/sections'
import { cn } from '@/src/lib/utils'
import { Button } from '@/src/components/ui/button'
import Link from 'next/link'

interface TextMediaSectionProps {
    section: ContentSection
    className?: string
}

export function TextMediaSection({ section, className }: TextMediaSectionProps) {
    const data = section.data as TextMediaData

    // Safe defaults
    const layout = data.layout || 'imageRight'
    const align = data.align || 'start'
    const background = data.background || 'default'

    // Alignment classes
    const alignClasses = {
        start: 'text-left items-start',
        center: 'text-center items-center',
        end: 'text-right items-end'
    }

    // Background classes
    const bgClasses = {
        default: 'bg-background',
        muted: 'bg-muted/50',
        highlight: 'bg-primary/5'
    }

    return (
        <section className={cn(
            "w-full py-12 md:py-24 lg:py-32",
            bgClasses[background],
            className
        )}>
            <div className="container px-4 md:px-6">
                <div className={cn(
                    "flex flex-col gap-8 lg:gap-12",
                    layout === 'imageLeft' && "lg:flex-row",
                    layout === 'imageRight' && "lg:flex-row-reverse",
                    layout === 'stacked' && "flex-col"
                )}>

                    {/* Image Column */}
                    {data.image?.url && (
                        <div className={cn(
                            "flex-1 relative min-h-[300px] rounded-xl overflow-hidden bg-muted",
                            layout === 'stacked' ? "w-full aspect-video" : "lg:w-1/2"
                        )}>
                            <img
                                src={data.image.url}
                                alt={data.image.alt || data.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                            />
                        </div>
                    )}

                    {/* Content Column */}
                    <div className={cn(
                        "flex flex-col justify-center flex-1 space-y-4",
                        alignClasses[align]
                    )}>
                        <div className="space-y-2">
                            {data.subtitle && (
                                <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                    {data.subtitle}
                                </p>
                            )}
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                {data.title}
                            </h2>
                        </div>

                        <div
                            className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed"
                            dangerouslySetInnerHTML={{ __html: data.body }}
                        />

                        {data.button?.label && data.button?.url && (
                            <div className="pt-4">
                                <Button
                                    asChild
                                    variant={data.button.style === 'link' ? 'link' : (data.button.style === 'secondary' ? 'secondary' : 'default')}
                                    size="lg"
                                >
                                    <Link href={data.button.url}>
                                        {data.button.label}
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

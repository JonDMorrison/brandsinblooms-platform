'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MenuItem, CreateMenuItemInput, UpdateMenuItemInput, LinkType } from '@/src/lib/nav/types'
import { createClient } from '@/src/lib/supabase/client'

const formSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    link_type: z.enum(['internal_page', 'blog_index', 'external']),
    target_content_id: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    is_primary_button: z.boolean().default(false),
})

interface MenuItemFormProps {
    menuId: string
    item?: MenuItem
    siteId: string
    onSave: (data: CreateMenuItemInput | UpdateMenuItemInput) => Promise<void>
    onCancel: () => void
}

export function MenuItemForm({ menuId, item, siteId, onSave, onCancel }: MenuItemFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [pages, setPages] = useState<{ id: string; title: string }[]>([])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            label: item?.label || '',
            link_type: item?.link_type || 'internal_page',
            target_content_id: item?.target_content_id || null,
            url: item?.url || '',
            is_primary_button: item?.is_primary_button || false,
        },
    })

    const linkType = form.watch('link_type')

    useEffect(() => {
        async function fetchPages() {
            const supabase = createClient()
            const { data } = await supabase
                .from('content')
                .select('id, title')
                .eq('site_id', siteId)
                .eq('content_type', 'page')
                .eq('is_published', true)
                .order('title')

            if (data) {
                setPages(data)
            }
        }

        if (linkType === 'internal_page') {
            fetchPages()
        }
    }, [siteId, linkType])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            const input: any = {
                ...values,
                position: item?.position ?? 0, // Position will be handled by parent if new
            }

            if (!item) {
                input.menu_id = menuId
            }

            await onSave(input)
        } catch (error) {
            console.error('Failed to save menu item:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md bg-card">
                <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                                <Input placeholder="Menu Item Label" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="link_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Link Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a link type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="internal_page">Internal Page</SelectItem>
                                    <SelectItem value="blog_index">Blog Index</SelectItem>
                                    <SelectItem value="external">External URL</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {linkType === 'internal_page' && (
                    <FormField
                        control={form.control}
                        name="target_content_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Page</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || undefined}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a page" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {pages.map((page) => (
                                            <SelectItem key={page.id} value={page.id}>
                                                {page.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {linkType === 'external' && (
                    <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="is_primary_button"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Primary Button
                                </FormLabel>
                                <FormDescription>
                                    Style this item as a primary call-to-action button.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </form>
        </Form>
    )
}

'use client'

import { useState, useEffect } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Menu, MenuItem, CreateMenuItemInput, UpdateMenuItemInput } from '@/src/lib/nav/types'
import { MenuItemForm } from './MenuItemForm'
import { createMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems } from '@/src/lib/nav/queries'
import { toast } from 'sonner'

interface SortableMenuItemProps {
    item: MenuItem
    onEdit: (item: MenuItem) => void
    onDelete: (id: string) => void
}

function SortableMenuItem({ item, onEdit, onDelete }: SortableMenuItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-3 bg-card border rounded-md mb-2 group"
        >
            <div className="flex items-center gap-3">
                <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                </button>
                <div>
                    <div className="font-medium flex items-center gap-2">
                        {item.label}
                        {item.is_primary_button && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Button
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {item.link_type === 'internal_page' && 'Internal Page'}
                        {item.link_type === 'blog_index' && 'Blog Index'}
                        {item.link_type === 'external' && item.url}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

interface MenuEditorProps {
    menu: Menu
    siteId: string
    onUpdate: () => void
}

export function MenuEditor({ menu, siteId, onUpdate }: MenuEditorProps) {
    const [items, setItems] = useState<MenuItem[]>(menu.items || [])
    const [isEditing, setIsEditing] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined)

    useEffect(() => {
        setItems(menu.items || [])
    }, [menu.items])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)

                const newItems = arrayMove(items, oldIndex, newIndex)

                // Update positions in DB
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    position: index,
                }))

                reorderMenuItems(updates).catch((error) => {
                    console.error('Failed to reorder items:', error)
                    toast.error('Failed to save new order')
                })

                return newItems
            })
        }
    }

    async function handleSaveItem(data: CreateMenuItemInput | UpdateMenuItemInput) {
        try {
            if (editingItem) {
                await updateMenuItem(editingItem.id, data)
                toast.success('Menu item updated')
            } else {
                await createMenuItem({
                    ...data,
                    menu_id: menu.id,
                    position: items.length,
                } as CreateMenuItemInput)
                toast.success('Menu item created')
            }
            setIsEditing(false)
            setEditingItem(undefined)
            onUpdate()
        } catch (error) {
            console.error('Failed to save item:', error)
            toast.error('Failed to save menu item')
        }
    }

    async function handleDeleteItem(id: string) {
        if (!confirm('Are you sure you want to delete this item?')) return

        try {
            await deleteMenuItem(id)
            toast.success('Menu item deleted')
            onUpdate()
        } catch (error) {
            console.error('Failed to delete item:', error)
            toast.error('Failed to delete menu item')
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="capitalize">{menu.name} Menu</CardTitle>
                    <CardDescription>Manage the items in your {menu.name} menu.</CardDescription>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <MenuItemForm
                        menuId={menu.id}
                        item={editingItem}
                        siteId={siteId}
                        onSave={handleSaveItem}
                        onCancel={() => {
                            setIsEditing(false)
                            setEditingItem(undefined)
                        }}
                    />
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {items.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                                        No items in this menu yet.
                                    </div>
                                )}
                                {items.map((item) => (
                                    <SortableMenuItem
                                        key={item.id}
                                        item={item}
                                        onEdit={(item) => {
                                            setEditingItem(item)
                                            setIsEditing(true)
                                        }}
                                        onDelete={handleDeleteItem}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </CardContent>
        </Card>
    )
}

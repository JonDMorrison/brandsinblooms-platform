import { createClient } from '@/src/lib/supabase/client'
import { Menu, MenuItem, CreateMenuItemInput, UpdateMenuItemInput } from './types'

export async function getMenusForSite(siteId: string): Promise<Menu[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('site_id', siteId)
        .order('name')

    if (error) throw error
    return data as Menu[]
}

export async function getMenuWithItems(siteId: string, menuName: string): Promise<Menu | null> {
    const supabase = createClient()

    // First get the menu
    const { data: menu, error: menuError } = await supabase
        .from('menus')
        .select('*')
        .eq('site_id', siteId)
        .eq('name', menuName)
        .single()

    if (menuError) {
        if (menuError.code === 'PGRST116') return null // Not found
        throw menuError
    }

    // Then get items
    const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menu.id)
        .order('position')

    if (itemsError) throw itemsError

    return {
        ...menu,
        items: items as MenuItem[]
    } as Menu
}

export async function createMenu(siteId: string, name: string): Promise<Menu> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('menus')
        .insert({ site_id: siteId, name })
        .select()
        .single()

    if (error) throw error
    return data as Menu
}

export async function createMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('menu_items')
        .insert(input)
        .select()
        .single()

    if (error) throw error
    return data as MenuItem
}

export async function updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<MenuItem> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('menu_items')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data as MenuItem
}

export async function deleteMenuItem(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

    if (error) throw error
}

export async function reorderMenuItems(items: { id: string; position: number }[]): Promise<void> {
    const supabase = createClient()

    // Update each item's position
    // Note: In a real app, we might want to do this in a transaction or batch
    // But for now, parallel requests are fine for this scale
    await Promise.all(
        items.map(item =>
            supabase
                .from('menu_items')
                .update({ position: item.position, updated_at: new Date().toISOString() })
                .eq('id', item.id)
        )
    )
}

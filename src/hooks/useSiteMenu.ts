'use client'

import { useState, useEffect } from 'react'
import { Menu, MenuItem } from '@/src/lib/nav/types'
import { getMenuWithItems } from '@/src/lib/nav/queries'

export function useSiteMenu(siteId?: string, menuName: string = 'main') {
    const [menu, setMenu] = useState<Menu | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        if (!siteId) {
            setLoading(false)
            return
        }

        async function fetchMenu() {
            try {
                const data = await getMenuWithItems(siteId!, menuName)
                setMenu(data)
            } catch (err) {
                console.error(`Failed to fetch menu ${menuName}:`, err)
                setError(err as Error)
            } finally {
                setLoading(false)
            }
        }

        fetchMenu()
    }, [siteId, menuName])

    return { menu, loading, error }
}

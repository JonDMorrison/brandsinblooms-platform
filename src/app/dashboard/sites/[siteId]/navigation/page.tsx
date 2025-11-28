'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { MenuEditor } from '@/src/components/dashboard/navigation/MenuEditor'
import { getMenuWithItems, createMenu } from '@/src/lib/nav/queries'
import { Menu } from '@/src/lib/nav/types'

export default function NavigationPage() {
    const params = useParams()
    const siteId = params.siteId as string
    const [menu, setMenu] = useState<Menu | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    async function loadMenu() {
        try {
            let mainMenu = await getMenuWithItems(siteId, 'main')

            if (!mainMenu) {
                // Create main menu if it doesn't exist
                await createMenu(siteId, 'main')
                mainMenu = await getMenuWithItems(siteId, 'main')
            }

            setMenu(mainMenu)
        } catch (error) {
            console.error('Failed to load menu:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadMenu()
    }, [siteId])

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!menu) {
        return <div>Failed to load menu.</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Navigation</h2>
                <p className="text-muted-foreground">
                    Manage your site's navigation menus.
                </p>
            </div>

            <MenuEditor menu={menu} siteId={siteId} onUpdate={loadMenu} />
        </div>
    )
}

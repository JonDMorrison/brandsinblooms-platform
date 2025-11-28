import { createClient } from '@supabase/supabase-js'
import { createAgSitesHomeContent } from '@/src/lib/content/templates/agSitesHomeTemplate'

// Usage:
// This script is intended to be run via a dedicated runner or manually if environment variables are set.
// Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are available.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedAgSitesHome() {
    console.log('Starting AG Sites seed...')

    // 1. Create or Get Site
    const siteName = 'AG Sites Demo'
    const subdomain = 'agsites-demo'

    // Check if site exists
    let { data: site, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('subdomain', subdomain)
        .single()

    if (!site) {
        console.log('Creating new site...')
        const { data: newSite, error: createError } = await supabase
            .from('sites')
            .insert({
                name: siteName,
                subdomain: subdomain,
                custom_domain: null,
                logo: null,
                settings: {
                    theme: 'light',
                    primaryColor: '#0f172a'
                }
            })
            .select()
            .single()

        if (createError) {
            console.error('Error creating site:', createError)
            return
        }
        site = newSite
    } else {
        console.log('Site already exists:', site.id)
    }

    if (!site) return

    // 2. Create Homepage Content
    console.log('Generating homepage content...')
    const homeContent = createAgSitesHomeContent({
        siteName: site.name,
        scheduleCallUrl: '/schedule'
    })

    // Upsert 'home' page
    const { error: contentError } = await supabase
        .from('content')
        .upsert({
            site_id: site.id,
            slug: 'home',
            type: 'page',
            title: 'Home',
            content: homeContent,
            status: 'published',
            published_at: new Date().toISOString()
        }, { onConflict: 'site_id, slug' })

    if (contentError) {
        console.error('Error creating homepage content:', contentError)
    } else {
        console.log('Homepage content created/updated.')
    }

    // 3. Create Navigation Menu
    console.log('Creating navigation menu...')

    // Create 'main' menu if not exists
    let { data: menu } = await supabase
        .from('menus')
        .select('*')
        .eq('site_id', site.id)
        .eq('slug', 'main')
        .single()

    if (!menu) {
        const { data: newMenu, error: menuError } = await supabase
            .from('menus')
            .insert({
                site_id: site.id,
                name: 'Main Menu',
                slug: 'main'
            })
            .select()
            .single()

        if (menuError) {
            console.error('Error creating menu:', menuError)
        } else {
            menu = newMenu
        }
    }

    if (menu) {
        // Clear existing items
        await supabase.from('menu_items').delete().eq('menu_id', menu.id)

        // Add new items
        const menuItems = [
            { label: 'Home', url: '/', order: 0 },
            { label: 'Features', url: '#features', order: 1 },
            { label: 'Pricing', url: '/pricing', order: 2 },
            { label: 'Blog', url: '/blog', order: 3 },
            { label: 'Schedule a Call', url: '/schedule', order: 4, target: '_self' } // Assuming schema supports target
        ]

        for (const item of menuItems) {
            await supabase.from('menu_items').insert({
                menu_id: menu.id,
                label: item.label,
                url: item.url,
                order_index: item.order
            })
        }
        console.log('Navigation menu items created.')
    }

    console.log('Seed completed successfully!')
    console.log(`Visit: http://${subdomain}.localhost:3000 (or configured domain)`)
}

// Execute
seedAgSitesHome().catch(console.error)

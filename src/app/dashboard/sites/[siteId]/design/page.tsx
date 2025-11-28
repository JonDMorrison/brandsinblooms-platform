'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { getSiteTheme, updateSiteTheme, getDefaultTheme, ThemeSettings } from '@/src/lib/queries/domains/theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Palette, Type, Layout, Save, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

export default function DesignPage() {
    const params = useParams()
    const router = useRouter()
    const siteId = params.siteId as string

    const [theme, setTheme] = useState<ThemeSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Load current theme
    useEffect(() => {
        async function loadTheme() {
            try {
                const supabase = createClient()
                const currentTheme = await getSiteTheme(supabase, siteId)
                setTheme(currentTheme)
            } catch (error) {
                console.error('Error loading theme:', error)
                toast.error('Failed to load theme settings')
                setTheme(getDefaultTheme())
            } finally {
                setLoading(false)
            }
        }

        loadTheme()
    }, [siteId])

    // Save theme
    const handleSave = async () => {
        if (!theme) return

        setSaving(true)
        try {
            const supabase = createClient()
            await updateSiteTheme(supabase, siteId, theme)
            toast.success('Theme settings saved successfully')
        } catch (error) {
            console.error('Error saving theme:', error)
            toast.error('Failed to save theme settings')
        } finally {
            setSaving(false)
        }
    }

    // Reset to defaults
    const handleReset = () => {
        setTheme(getDefaultTheme())
        toast.info('Theme reset to defaults (not saved yet)')
    }

    if (loading || !theme) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container max-w-5xl py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Design Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Customize your site's appearance and branding
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Theme Editor Tabs */}
            <Tabs defaultValue="colors" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="colors">
                        <Palette className="h-4 w-4 mr-2" />
                        Colors
                    </TabsTrigger>
                    <TabsTrigger value="typography">
                        <Type className="h-4 w-4 mr-2" />
                        Typography
                    </TabsTrigger>
                    <TabsTrigger value="layout">
                        <Layout className="h-4 w-4 mr-2" />
                        Layout
                    </TabsTrigger>
                </TabsList>

                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Brand Colors</CardTitle>
                            <CardDescription>
                                Define your site's color palette
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="primary-color">Primary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="primary-color"
                                        type="color"
                                        value={theme.colors.primary}
                                        onChange={(e) => setTheme({
                                            ...theme,
                                            colors: { ...theme.colors, primary: e.target.value }
                                        })}
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        type="text"
                                        value={theme.colors.primary}
                                        onChange={(e) => setTheme({
                                            ...theme,
                                            colors: { ...theme.colors, primary: e.target.value }
                                        })}
                                        placeholder="#000000"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="secondary-color">Secondary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="secondary-color"
                                        type="color"
                                        value={theme.colors.secondary}
                                        onChange={(e) => setTheme({
                                            ...theme,
                                            colors: { ...theme.colors, secondary: e.target.value }
                                        })}
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        type="text"
                                        value={theme.colors.secondary}
                                        onChange={(e) => setTheme({
                                            ...theme,
                                            colors: { ...theme.colors, secondary: e.target.value }
                                        })}
                                        placeholder="#000000"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accent-color">Accent Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="accent-color"
                                        type="color"
                                        value={theme.colors.accent}
                                        onChange={(e) => setTheme({
                                            ...theme,
                                            colors: { ...theme.colors, accent: e.target.value }
                                        })}
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        type="text"
                                        value={theme.colors.accent}
                                        onChange={(e) => setTheme({
                                            ...theme,
                                            colors: { ...theme.colors, accent: e.target.value }
                                        })}
                                        placeholder="#000000"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="background-color">Background Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="background-color"
                                        type="color"
                                        value={theme.colors.background}
                                        onChange={(e) => setTheme({
                                            ...theme,
                                            colors: { ...theme.colors, background: e.target.value }
                                        })}
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        type="text"
                                        value={theme.colors.background}
                                        onChange={(e) => setTheme({
                                            ...theme,
                                            colors: { ...theme.colors, background: e.target.value }
                                        })}
                                        placeholder="#FFFFFF"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            {theme.colors.text && (
                                <div className="space-y-2">
                                    <Label htmlFor="text-color">Text Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="text-color"
                                            type="color"
                                            value={theme.colors.text}
                                            onChange={(e) => setTheme({
                                                ...theme,
                                                colors: { ...theme.colors, text: e.target.value }
                                            })}
                                            className="w-20 h-10"
                                        />
                                        <Input
                                            type="text"
                                            value={theme.colors.text}
                                            onChange={(e) => setTheme({
                                                ...theme,
                                                colors: { ...theme.colors, text: e.target.value }
                                            })}
                                            placeholder="#000000"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Color Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                            <CardDescription>See how your colors look together</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div
                                    className="p-6 rounded-lg border-2"
                                    style={{
                                        backgroundColor: theme.colors.background,
                                        borderColor: theme.colors.primary
                                    }}
                                >
                                    <h3
                                        className="text-xl font-bold mb-2"
                                        style={{ color: theme.colors.primary }}
                                    >
                                        Primary Color
                                    </h3>
                                    <p style={{ color: theme.colors.text || '#000' }}>
                                        This is how your primary color looks with text
                                    </p>
                                </div>

                                <div
                                    className="p-6 rounded-lg"
                                    style={{ backgroundColor: theme.colors.primary }}
                                >
                                    <h3 className="text-xl font-bold mb-2 text-white">
                                        Button Preview
                                    </h3>
                                    <button
                                        className="px-4 py-2 rounded font-medium"
                                        style={{
                                            backgroundColor: theme.colors.accent,
                                            color: 'white'
                                        }}
                                    >
                                        Call to Action
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Typography Tab */}
                <TabsContent value="typography" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Typography Settings</CardTitle>
                            <CardDescription>
                                Choose fonts and text sizing for your site
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="heading-font">Heading Font</Label>
                                <Select
                                    value={theme.typography.headingFont}
                                    onValueChange={(value) => setTheme({
                                        ...theme,
                                        typography: { ...theme.typography, headingFont: value }
                                    })}
                                >
                                    <SelectTrigger id="heading-font">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Inter">Inter</SelectItem>
                                        <SelectItem value="Roboto">Roboto</SelectItem>
                                        <SelectItem value="Poppins">Poppins</SelectItem>
                                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                                        <SelectItem value="Merriweather">Merriweather</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="body-font">Body Font</Label>
                                <Select
                                    value={theme.typography.bodyFont}
                                    onValueChange={(value) => setTheme({
                                        ...theme,
                                        typography: { ...theme.typography, bodyFont: value }
                                    })}
                                >
                                    <SelectTrigger id="body-font">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Inter">Inter</SelectItem>
                                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                                        <SelectItem value="Lato">Lato</SelectItem>
                                        <SelectItem value="Nunito">Nunito</SelectItem>
                                        <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="font-size">Base Font Size</Label>
                                <Select
                                    value={theme.typography.fontSize}
                                    onValueChange={(value: 'small' | 'medium' | 'large') => setTheme({
                                        ...theme,
                                        typography: { ...theme.typography, fontSize: value }
                                    })}
                                >
                                    <SelectTrigger id="font-size">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="small">Small</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="large">Large</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Layout Tab */}
                <TabsContent value="layout" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Layout Settings</CardTitle>
                            <CardDescription>
                                Configure header, footer, and navigation styles
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="header-style">Header Style</Label>
                                <Select
                                    value={theme.layout.headerStyle}
                                    onValueChange={(value: 'modern' | 'classic' | 'minimal') => setTheme({
                                        ...theme,
                                        layout: { ...theme.layout, headerStyle: value }
                                    })}
                                >
                                    <SelectTrigger id="header-style">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="modern">Modern</SelectItem>
                                        <SelectItem value="classic">Classic</SelectItem>
                                        <SelectItem value="minimal">Minimal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="footer-style">Footer Style</Label>
                                <Select
                                    value={theme.layout.footerStyle}
                                    onValueChange={(value: 'minimal' | 'comprehensive' | 'centered' | 'newsletter') => setTheme({
                                        ...theme,
                                        layout: { ...theme.layout, footerStyle: value }
                                    })}
                                >
                                    <SelectTrigger id="footer-style">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="minimal">Minimal</SelectItem>
                                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                                        <SelectItem value="centered">Centered</SelectItem>
                                        <SelectItem value="newsletter">Newsletter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="menu-style">Menu Style</Label>
                                <Select
                                    value={theme.layout.menuStyle}
                                    onValueChange={(value: 'horizontal' | 'sidebar' | 'hamburger' | 'mega') => setTheme({
                                        ...theme,
                                        layout: { ...theme.layout, menuStyle: value }
                                    })}
                                >
                                    <SelectTrigger id="menu-style">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="horizontal">Horizontal</SelectItem>
                                        <SelectItem value="sidebar">Sidebar</SelectItem>
                                        <SelectItem value="hamburger">Hamburger</SelectItem>
                                        <SelectItem value="mega">Mega Menu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

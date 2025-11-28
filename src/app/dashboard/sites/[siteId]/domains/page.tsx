'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { getDomainsForSite, createDomain, deleteDomain, setPrimaryDomain } from '@/src/lib/domains/queries'
import { Domain, isValidHostname, normalizeHostname, getDomainStatusVariant } from '@/src/lib/domains/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loader2, Plus, MoreVertical, Check, Globe, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function DomainsPage() {
    const params = useParams()
    const siteId = params.siteId as string

    const [domains, setDomains] = useState<Domain[]>([])
    const [loading, setLoading] = useState(true)
    const [newDomain, setNewDomain] = useState('')
    const [adding, setAdding] = useState(false)

    useEffect(() => {
        loadDomains()
    }, [siteId])

    async function loadDomains() {
        try {
            const supabase = createClient()
            const data = await getDomainsForSite(supabase, siteId)
            setDomains(data)
        } catch (error) {
            console.error('Error loading domains:', error)
            toast.error('Failed to load domains')
        } finally {
            setLoading(false)
        }
    }

    async function handleAddDomain(e: React.FormEvent) {
        e.preventDefault()

        const hostname = normalizeHostname(newDomain)

        if (!hostname) {
            toast.error('Please enter a domain')
            return
        }

        if (!isValidHostname(hostname)) {
            toast.error('Please enter a valid domain (e.g., example.com)')
            return
        }

        setAdding(true)
        try {
            const supabase = createClient()
            await createDomain(supabase, {
                site_id: siteId,
                hostname,
                is_primary: domains.length === 0 // First domain is primary
            })

            toast.success('Domain added successfully')
            setNewDomain('')
            loadDomains()
        } catch (error: any) {
            console.error('Error adding domain:', error)
            toast.error(error.message || 'Failed to add domain')
        } finally {
            setAdding(false)
        }
    }

    async function handleSetPrimary(domainId: string) {
        try {
            const supabase = createClient()
            await setPrimaryDomain(supabase, domainId)
            toast.success('Primary domain updated')
            loadDomains()
        } catch (error) {
            console.error('Error setting primary domain:', error)
            toast.error('Failed to set primary domain')
        }
    }

    async function handleDelete(domainId: string, hostname: string) {
        if (!confirm(`Are you sure you want to delete ${hostname}?`)) {
            return
        }

        try {
            const supabase = createClient()
            await deleteDomain(supabase, domainId)
            toast.success('Domain deleted')
            loadDomains()
        } catch (error) {
            console.error('Error deleting domain:', error)
            toast.error('Failed to delete domain')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container max-w-5xl py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
                <p className="text-muted-foreground mt-1">
                    Manage custom domains for your site
                </p>
            </div>

            {/* Domains List */}
            <Card>
                <CardHeader>
                    <CardTitle>Custom Domains</CardTitle>
                    <CardDescription>
                        Add and manage custom domains that point to your site
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {domains.length > 0 ? (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Domain</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Primary</TableHead>
                                        <TableHead className="w-[70px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {domains.map((domain) => (
                                        <TableRow key={domain.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{domain.hostname}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getDomainStatusVariant(domain.status)}>
                                                    {domain.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {domain.is_primary && (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {!domain.is_primary && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleSetPrimary(domain.id)}
                                                            >
                                                                Set as Primary
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(domain.id, domain.hostname)}
                                                            className="text-destructive"
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>No custom domains</AlertTitle>
                            <AlertDescription>
                                Add your first custom domain to get started
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Add Domain Form */}
                    <form onSubmit={handleAddDomain} className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder="example.com"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                disabled={adding}
                            />
                        </div>
                        <Button type="submit" disabled={adding}>
                            {adding ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Domain
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* DNS Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>DNS Setup Instructions</CardTitle>
                    <CardDescription>
                        Configure your DNS records to point your domain to this site
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>A Record (Recommended)</AlertTitle>
                        <AlertDescription>
                            <div className="mt-2 space-y-1">
                                <p>Add an A record with the following settings:</p>
                                <div className="font-mono text-sm bg-muted p-2 rounded mt-2">
                                    <div>Type: <strong>A</strong></div>
                                    <div>Name: <strong>@</strong> (or leave blank)</div>
                                    <div>Value: <strong>Your server IP</strong></div>
                                    <div>TTL: <strong>3600</strong></div>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>CNAME Record (Alternative)</AlertTitle>
                        <AlertDescription>
                            <div className="mt-2 space-y-1">
                                <p>Add a CNAME record for www subdomain:</p>
                                <div className="font-mono text-sm bg-muted p-2 rounded mt-2">
                                    <div>Type: <strong>CNAME</strong></div>
                                    <div>Name: <strong>www</strong></div>
                                    <div>Value: <strong>your-platform.com</strong></div>
                                    <div>TTL: <strong>3600</strong></div>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>

                    <Alert variant="default">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Verification</AlertTitle>
                        <AlertDescription>
                            After configuring your DNS records, it may take up to 48 hours for changes to propagate.
                            Your domain status will automatically update to "active" once verified.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    )
}

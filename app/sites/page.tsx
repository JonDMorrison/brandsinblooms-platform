'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Globe, Calendar, Settings, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { useAuth } from '@/src/contexts/AuthContext'
import { getUserSites } from '@/src/lib/site/queries'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { toast } from 'sonner'
import { supabase } from '@/src/lib/supabase/client'

interface Site {
  id: string
  name: string
  business_name: string | null
  subdomain: string
  custom_domain: string | null
  created_at: string
  is_active: boolean | null
  role: string
}

export default function SitesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newSite, setNewSite] = useState({
    name: '',
    business_name: '',
    subdomain: '',
    description: ''
  })

  // Fetch sites using React Query
  const { 
    data: sitesData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['user-sites', user?.id],
    queryFn: async () => {
      if (!user) return []
      const result = await getUserSites(user.id)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data || []
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  })

  // Create site mutation (must be before conditionals for hooks rules)
  const createSiteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated')

      // Validate inputs
      if (!newSite.name || !newSite.subdomain) {
        throw new Error('Please fill in all required fields')
      }

      // Check if subdomain is available
      const { data: existingSite } = await supabase
        .from('sites')
        .select('id')
        .eq('subdomain', newSite.subdomain.toLowerCase())
        .single()

      if (existingSite) {
        throw new Error('This subdomain is already taken')
      }

      // Create the site
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .insert({
          name: newSite.name,
          business_name: newSite.business_name || newSite.name,
          subdomain: newSite.subdomain.toLowerCase(),
          description: newSite.description,
          owner_id: user.id,
          is_active: true
        })
        .select()
        .single()

      if (siteError) throw siteError

      // Create owner membership
      const { error: memberError } = await supabase
        .from('site_memberships')
        .insert({
          site_id: site.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) throw memberError

      return site
    },
    onSuccess: (site) => {
      toast.success('Site created successfully!')
      setIsCreateModalOpen(false)
      setNewSite({ name: '', business_name: '', subdomain: '', description: '' })
      
      // Invalidate and refetch sites
      queryClient.invalidateQueries({ queryKey: ['user-sites', user?.id] })
      
      // Redirect to the new site's dashboard
      router.push(`/dashboard?site=${site.id}`)
    },
    onError: (error: Error) => {
      console.error('Error creating site:', error)
      toast.error(error.message || 'Failed to create site')
    }
  })

  const handleCreateSite = () => {
    createSiteMutation.mutate()
  }

  // Transform sites data
  const sites: Site[] = (sitesData || []).map(access => ({
    id: access.site.id,
    name: access.site.name,
    business_name: access.site.business_name || null,
    subdomain: access.site.subdomain,
    custom_domain: access.site.custom_domain,
    created_at: access.site.created_at,
    is_active: access.site.is_active ?? true,
    role: access.role
  }))

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/')
    return null
  }

  const getSiteUrl = (site: Site) => {
    if (site.custom_domain) {
      return `https://${site.custom_domain}`
    }
    // Extract domain from NEXT_PUBLIC_APP_DOMAIN or use current host
    const appDomain = typeof window !== 'undefined' 
      ? window.location.host 
      : 'localhost:3001'
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' 
      ? 'https' 
      : 'http'
    return `${protocol}://${site.subdomain}.${appDomain}`
  }

  // Show loading spinner
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg">Loading sites...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load sites</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="relative z-10 border-b bg-background/95 backdrop-blur">
        <nav className="brand-container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <button onClick={() => router.push('/')} className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg">
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h1 className="text-base sm:text-xl font-brand-heading text-gradient-primary">
                  My Sites
                </h1>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
              >
                Home
              </Button>
              <Button
                size="sm"
                className="btn-gradient-primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Site
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="brand-container py-12">
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">Your Sites</h1>
            <p className="text-muted-foreground mt-2">
              Manage all your websites in one place
            </p>
          </div>

          {/* Sites Grid */}
          {sites.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first site to get started
                </p>
                <Button
                  className="btn-gradient-primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Site
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site) => (
                <Card key={site.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{site.name}</CardTitle>
                        {site.business_name && (
                          <CardDescription className="mt-1">
                            {site.business_name}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={site.is_active ? "default" : "secondary"}>
                        {site.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Globe className="h-4 w-4 mr-2" />
                        <a 
                          href={getSiteUrl(site)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center"
                        >
                          {site.custom_domain || `${site.subdomain}.${typeof window !== 'undefined' ? window.location.host : 'localhost:3001'}`}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Created {new Date(site.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Settings className="h-4 w-4 mr-2" />
                        Role: {site.role}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard?site=${site.id}`)}
                      >
                        Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(getSiteUrl(site), '_blank')}
                      >
                        View Site
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Site Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Site</DialogTitle>
            <DialogDescription>
              Add a new website to your account
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Site Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome Site"
                value={newSite.name}
                onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                placeholder="Acme Corporation"
                value={newSite.business_name}
                onChange={(e) => setNewSite({ ...newSite, business_name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain *</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="subdomain"
                  placeholder="mysite"
                  value={newSite.subdomain}
                  onChange={(e) => setNewSite({ ...newSite, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                />
                <span className="text-sm text-muted-foreground">
                  .{typeof window !== 'undefined' ? window.location.host : 'localhost:3001'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Letters, numbers, and hyphens only
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your site..."
                value={newSite.description}
                onChange={(e) => setNewSite({ ...newSite, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={createSiteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="btn-gradient-primary"
              onClick={handleCreateSite}
              disabled={createSiteMutation.isPending || !newSite.name || !newSite.subdomain}
            >
              {createSiteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Site'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
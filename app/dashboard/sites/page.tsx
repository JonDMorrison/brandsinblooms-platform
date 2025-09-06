'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Globe, Calendar, Settings, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { useAuth } from '@/src/contexts/AuthContext'
import { useSiteSwitcher, useUserSites } from '@/src/hooks/useSite'
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

export default function DashboardSitesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { switchSite } = useSiteSwitcher()
  const { sites: userSites, loading: sitesLoading, error: sitesError, refresh: refreshSites } = useUserSites()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newSite, setNewSite] = useState({
    name: '',
    business_name: '',
    subdomain: '',
    description: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  // Transform sites data to match the interface
  const sites: Site[] = (userSites || []).map(access => ({
    id: access.site.id,
    name: access.site.name,
    business_name: access.site.business_name || null,
    subdomain: access.site.subdomain,
    custom_domain: access.site.custom_domain,
    created_at: access.site.created_at,
    is_active: access.site.is_active ?? true,
    role: access.role
  }))

  // Create site function
  const createSite = async () => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    // Validate inputs
    if (!newSite.name || !newSite.subdomain) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    
    try {
      // Check if subdomain is available
      const { data: existingSite } = await supabase
        .from('sites')
        .select('id')
        .eq('subdomain', newSite.subdomain.toLowerCase())
        .single()

      if (existingSite) {
        toast.error('This subdomain is already taken')
        return
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

      toast.success('Site created successfully!')
      setIsCreateModalOpen(false)
      setNewSite({ name: '', business_name: '', subdomain: '', description: '' })
      
      // Refresh the sites list
      await refreshSites()
      
      // Switch to the new site and redirect to dashboard
      await switchSite(site.id)
      router.push('/dashboard')
    } catch (error: unknown) {
      const err = error as Error
      console.error('Error creating site:', err)
      toast.error(err.message || 'Failed to create site')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSiteSwitch = async (siteId: string) => {
    try {
      await switchSite(siteId)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to switch site:', error)
      toast.error('Failed to switch to selected site')
    }
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

  // Show error state
  if (sitesError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load sites</p>
          <Button onClick={() => refreshSites()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Sites</h1>
          <p className="text-gray-500 mt-2">
            Manage all your websites from one place
          </p>
        </div>
        <Button
          className="btn-gradient-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Site
        </Button>
      </div>

      {/* Sites Grid */}
      {sitesLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Globe className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
            <p className="text-gray-500 mb-6">
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
                  <div className="flex items-center text-gray-500">
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
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created {new Date(site.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Settings className="h-4 w-4 mr-2" />
                    Role: {site.role}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSiteSwitch(site.id)}
                  >
                    Open Dashboard
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
                <span className="text-sm text-gray-500">
                  .{typeof window !== 'undefined' ? window.location.host : 'localhost:3001'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
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
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              className="btn-gradient-primary"
              onClick={createSite}
              disabled={isCreating || !newSite.name || !newSite.subdomain}
            >
              {isCreating ? (
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
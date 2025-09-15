'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'
import { 
  Eye,
  EyeOff,
  Globe,
  Home,
  AlertTriangle,
  Check,
  X,
  ExternalLink
} from 'lucide-react'
import { LayoutType } from '@/src/lib/content/schema'
import { useSlugValidator } from '@/src/lib/content/slug-validator'

interface PageTabProps {
  slug: string
  isPublished: boolean
  onSlugChange: (slug: string) => void
  onPublishedChange: (published: boolean) => void
  pageTitle: string
  onPageTitleChange: (title: string) => void
  layout: LayoutType
  siteUrl?: string
  siteId?: string
  contentId?: string
}

export function PageTab({ 
  slug,
  isPublished,
  onSlugChange,
  onPublishedChange,
  pageTitle, 
  onPageTitleChange,
  layout,
  siteUrl = 'example.com',
  siteId,
  contentId
}: PageTabProps) {
  const [slugInput, setSlugInput] = useState(slug || '')
  const [slugStatus, setSlugStatus] = useState<'available' | 'taken' | 'checking' | 'invalid'>('available')
  const [slugMessage, setSlugMessage] = useState('')
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([])
  const [showHomePageDialog, setShowHomePageDialog] = useState(false)
  
  const slugValidator = useSlugValidator(siteId || '', contentId)
  
  // Handle slug changes with validation
  useEffect(() => {
    if (slugInput !== slug) {
      // Debounce slug validation
      const timer = setTimeout(() => {
        validateSlug(slugInput)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [slugInput])

  const validateSlug = async (slug: string) => {
    if (!slug.trim()) {
      setSlugStatus('invalid')
      setSlugMessage('Slug cannot be empty')
      setSlugSuggestions([])
      return
    }

    setSlugStatus('checking')
    setSlugMessage('Checking availability...')
    setSlugSuggestions([])
    
    try {
      const result = await slugValidator.validateSlug(slug)
      
      setSlugStatus(result.status)
      setSlugMessage(result.message)
      setSlugSuggestions(result.suggestions || [])
      
      // Only update slug if valid and available
      if (result.isValid && result.isAvailable) {
        onSlugChange(slug)
      }
    } catch (error) {
      console.error('Error validating slug:', error)
      setSlugStatus('invalid')
      setSlugMessage('Error checking slug availability')
      setSlugSuggestions([])
    }
  }

  const generateSlugFromTitle = () => {
    const generatedSlug = slugValidator.generateFromTitle(pageTitle)
    setSlugInput(generatedSlug)
  }

  const applySuggestion = (suggestion: string) => {
    setSlugInput(suggestion)
  }

  const handlePublishedToggle = (published: boolean) => {
    onPublishedChange(published)
  }

  const handleHomePageToggle = (isHome: boolean) => {
    if (isHome && slugInput !== 'home') {
      setShowHomePageDialog(true)
    } else if (isHome) {
      // Already has home slug, just publish it
      onPublishedChange(true)
    }
    // If setting to false, do nothing special - user can manually unpublish
  }

  const confirmHomePageChange = () => {
    // Set slug to 'home' and publish the page
    setSlugInput('home')
    onSlugChange('home')
    onPublishedChange(true)
    setShowHomePageDialog(false)
  }

  const getSlugStatusIcon = () => {
    switch (slugStatus) {
      case 'available':
        return <Check className="h-4 w-4 text-green-600" />
      case 'taken':
        return <X className="h-4 w-4 text-red-600" />
      case 'checking':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      case 'invalid':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getSlugStatusMessage = () => {
    return slugMessage || 'Enter a URL slug'
  }

  return (
    <div className="p-4 space-y-6">
      {/* Page Identity Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Page Identity</h3>
        
        {/* Page Title */}
        <div className="space-y-2">
          <Label htmlFor="page-title" className="text-xs font-medium">
            Page Title
          </Label>
          <Input
            id="page-title"
            type="text"
            value={pageTitle || ''}
            onChange={(e) => onPageTitleChange(e.target.value)}
            className="h-8"
            placeholder="Enter page title"
          />
          <p className="text-xs text-gray-500">
            This is the internal page name and title used for navigation
          </p>
        </div>

        {/* Page URL/Slug */}
        <div className="space-y-2">
          <Label htmlFor="page-slug" className="text-xs font-medium">
            Page URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="page-slug"
              type="text"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value.toLowerCase())}
              className="h-8 flex-1"
              placeholder="page-url"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={generateSlugFromTitle}
              disabled={!pageTitle}
              className="h-8"
            >
              Auto
            </Button>
          </div>
          
          {/* URL Preview */}
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
            <Globe className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {siteUrl}/{slugInput || 'page-url'}
            </span>
            <ExternalLink className="h-3 w-3 text-gray-400" />
          </div>

          {/* Slug Status */}
          {slugInput && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getSlugStatusIcon()}
                <span className={`text-xs ${
                  slugStatus === 'available' ? 'text-green-600' :
                  slugStatus === 'taken' || slugStatus === 'invalid' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {getSlugStatusMessage()}
                </span>
              </div>
              
              {/* Suggestions */}
              {slugStatus === 'taken' && slugSuggestions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">Try these alternatives:</p>
                  <div className="flex flex-wrap gap-1">
                    {slugSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applySuggestion(suggestion)}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            URL-friendly version of your page title (lowercase, hyphens only)
          </p>
        </div>
      </div>

      {/* Publication Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Publication Settings</h3>
        
        {/* Published Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${
              isPublished 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-medium">Published</p>
              <p className="text-xs text-gray-500">
                {isPublished 
                  ? 'Page is live and visible to visitors' 
                  : 'Page is hidden from visitors'
                }
              </p>
            </div>
          </div>
          <Switch
            checked={isPublished || false}
            onCheckedChange={handlePublishedToggle}
          />
        </div>


        {/* Home Page Setting (Landing Pages Only) */}
        {layout === 'landing' && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${
                slug === 'home' && isPublished
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <Home className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Set as Home Page</p>
                <p className="text-xs text-gray-500">
                  {slug === 'home' && isPublished
                    ? 'This is your site\'s home page' 
                    : 'Make this your site\'s home page'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={slug === 'home' && isPublished}
              onCheckedChange={handleHomePageToggle}
            />
          </div>
        )}
      </div>

      {/* Current Layout Display */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Current Layout</Label>
        <div className="p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-primary text-primary-foreground">
              <Globe className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {layout.charAt(0).toUpperCase() + layout.slice(1)} Page
              </p>
              <p className="text-xs text-gray-500">
                Optimized for {layout} content and layouts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Home Page Confirmation Dialog */}
      <AlertDialog open={showHomePageDialog} onOpenChange={setShowHomePageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Set as Home Page
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to make this page your site's home page?
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Only one home page is allowed per site. 
                  If another page is currently set as home, it will be automatically 
                  renamed and this page will become the new home page.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                This action will:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Set this page's URL to your site's root URL</li>
                <li>Automatically publish this page</li>
                <li>Rename any existing home page</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmHomePageChange}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Make Home Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
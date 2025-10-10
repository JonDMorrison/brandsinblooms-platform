'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/src/components/ui/tooltip'
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
import { supabase } from '@/src/lib/supabase/client'

interface PageTabProps {
  slug: string
  isPublished: boolean
  onSlugChange: (slug: string) => void
  onPublishedChange: (published: boolean) => void
  onSetAsHomePage?: () => Promise<void>
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
  onSetAsHomePage,
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
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [pendingPublishState, setPendingPublishState] = useState(false)
  const [showPrivacyPageDialog, setShowPrivacyPageDialog] = useState(false)
  const [showTermsPageDialog, setShowTermsPageDialog] = useState(false)

  const slugValidator = useSlugValidator(supabase, siteId || '', contentId)

  // Sync local slugInput with parent slug prop
  useEffect(() => {
    setSlugInput(slug || '')
  }, [slug])

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
    // For about/contact pages, show confirmation dialog when publishing
    if (published && (layout === 'about' || layout === 'contact')) {
      setPendingPublishState(true)
      setShowPublishDialog(true)
    } else {
      // Regular pages or unpublishing - no confirmation needed
      onPublishedChange(published)
    }
  }

  const confirmPublish = () => {
    onPublishedChange(true)
    setShowPublishDialog(false)
    setPendingPublishState(false)
  }

  const cancelPublish = () => {
    setShowPublishDialog(false)
    setPendingPublishState(false)
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

  const confirmHomePageChange = async () => {
    try {
      if (onSetAsHomePage) {
        // Use the atomic handler to set as home page
        // The useEffect will sync slugInput when parent state updates
        await onSetAsHomePage()
      } else {
        // Fallback to old behavior if handler not provided
        onSlugChange('home')
        onPublishedChange(true)
      }
      setShowHomePageDialog(false)
    } catch (error) {
      // Error is already handled in the handler with toast
      // Just keep the dialog open so user can try again or cancel
      console.error('Failed to set as home page:', error)
    }
  }

  const handlePrivacyPageToggle = (isPrivacy: boolean) => {
    if (isPrivacy && slugInput !== 'privacy') {
      setShowPrivacyPageDialog(true)
    } else if (isPrivacy) {
      // Already has privacy slug, just publish it
      onPublishedChange(true)
    }
    // If setting to false, do nothing special - user can manually unpublish
  }

  const confirmPrivacyPageChange = () => {
    // Set slug to 'privacy' and publish the page
    // The useEffect will sync slugInput when parent state updates
    onSlugChange('privacy')
    onPublishedChange(true)
    setShowPrivacyPageDialog(false)
  }

  const handleTermsPageToggle = (isTerms: boolean) => {
    if (isTerms && slugInput !== 'terms') {
      setShowTermsPageDialog(true)
    } else if (isTerms) {
      // Already has terms slug, just publish it
      onPublishedChange(true)
    }
    // If setting to false, do nothing special - user can manually unpublish
  }

  const confirmTermsPageChange = () => {
    // Set slug to 'terms' and publish the page
    // The useEffect will sync slugInput when parent state updates
    onSlugChange('terms')
    onPublishedChange(true)
    setShowTermsPageDialog(false)
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

  const handleOpenPreview = () => {
    if (!isPublished) return

    const previewUrl = `http://${siteUrl}/${slugInput || slug}`
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
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

        {/* Page URL/Slug - Hidden for About and Contact pages */}
        {layout !== 'about' && layout !== 'contact' && (
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
              <span className="text-sm text-gray-600 flex-1">
                {siteUrl}/{slugInput || 'page-url'}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenPreview}
                    disabled={!isPublished}
                    className={`h-6 w-6 p-0 ${
                      isPublished
                        ? 'hover:bg-accent text-blue-600 hover:text-blue-700'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isPublished
                    ? 'Open live page in new window'
                    : 'Publish page to enable preview'
                  }
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Publish Status Info */}
            {!isPublished && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  This page URL will only be accessible to visitors after you publish it.
                </p>
              </div>
            )}

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
        )}
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

        {/* Privacy Policy Setting (Other Layout Pages Only) */}
        {layout === 'other' && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${
                slug === 'privacy' && isPublished
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Set as Privacy Policy</p>
                <p className="text-xs text-gray-500">
                  {slug === 'privacy' && isPublished
                    ? 'This is your site\'s privacy policy'
                    : 'Make this your site\'s privacy policy'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={slug === 'privacy' && isPublished}
              onCheckedChange={handlePrivacyPageToggle}
            />
          </div>
        )}

        {/* Terms of Service Setting (Other Layout Pages Only) */}
        {layout === 'other' && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${
                slug === 'terms' && isPublished
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Set as Terms of Service</p>
                <p className="text-xs text-gray-500">
                  {slug === 'terms' && isPublished
                    ? 'This is your site\'s terms of service'
                    : 'Make this your site\'s terms of service'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={slug === 'terms' && isPublished}
              onCheckedChange={handleTermsPageToggle}
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
            <AlertDialogDescription>
              Are you sure you want to make this page your site's home page?
            </AlertDialogDescription>
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Only one home page is allowed per site.
                  If another page is currently set as home, it will be automatically
                  renamed and this page will become the new home page.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  This action will:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Set this page's URL (slug) to /home</li>
                  <li>Automatically publish this page</li>
                  <li>Rename any existing home page slug if it exists</li>
                </ul>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmHomePageChange}
              className="bg-gradient-primary hover:opacity-90"
            >
              Make Home Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation Dialog (About/Contact Pages) */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Publish {layout === 'about' ? 'About' : 'Contact'} Page
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Are you sure you want to publish this {layout} page?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Only one {layout} page can be published at a time.
                If another {layout} page is currently published, it will be automatically
                unpublished and archived.
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                This action will:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Set this page's URL to /{layout}</li>
                <li>Publish this page</li>
                <li>Unpublish and archive any existing {layout} page</li>
              </ul>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPublish}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPublish}
              className="bg-gradient-primary hover:opacity-90"
            >
              Publish Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Privacy Policy Confirmation Dialog */}
      <AlertDialog open={showPrivacyPageDialog} onOpenChange={setShowPrivacyPageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Set as Privacy Policy
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make this page your site's privacy policy?
            </AlertDialogDescription>
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Only one privacy policy page is allowed per site.
                  If another page is currently set as privacy policy, it will be automatically
                  renamed and this page will become the new privacy policy.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  This action will:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Set this page's URL to /privacy</li>
                  <li>Automatically publish this page</li>
                  <li>Rename any existing privacy policy page slug if it exists</li>
                </ul>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPrivacyPageChange}
              className="bg-gradient-primary hover:opacity-90"
            >
              Make Privacy Policy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terms of Service Confirmation Dialog */}
      <AlertDialog open={showTermsPageDialog} onOpenChange={setShowTermsPageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Set as Terms of Service
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make this page your site's terms of service?
            </AlertDialogDescription>
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Only one terms of service page is allowed per site.
                  If another page is currently set as terms of service, it will be automatically
                  renamed and this page will become the new terms of service.
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  This action will:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Set this page's URL to /terms</li>
                  <li>Automatically publish this page</li>
                  <li>Rename any existing terms of service page slug if it exists</li>
                </ul>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTermsPageChange}
              className="bg-gradient-primary hover:opacity-90"
            >
              Make Terms of Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
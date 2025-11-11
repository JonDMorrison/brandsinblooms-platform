'use client'

/**
 * Full Site Editor Top Bar
 * Fixed navigation bar that appears when editing customer sites
 */

import React, { useState } from 'react'
import { useFullSiteEditor } from '@/src/contexts/FullSiteEditorContext'
import { useSiteEditorAutoSave } from '@/src/hooks/useSiteEditorAutoSave'
import { useAuth } from '@/src/contexts/AuthContext'
import { Button } from '@/src/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  Monitor,
  Tablet,
  Smartphone,
  Edit3,
  MousePointer,
  Clock,
  FileText,
  Plus,
  Home,
  LogOut,
  ChevronDown,
  AlertCircle,
  Settings,
  Check
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { QuickPageSwitcher } from './QuickPageSwitcher'
import { PageSettingsModal } from './modals/PageSettingsModal'
import { CreateContentModal } from '@/src/components/content/CreateContentModal'

export function FullSiteEditorBar() {
  const {
    isEditMode,
    editorMode,
    viewportSize,
    hasUnsavedChanges,
    isSaving,
    lastSaved,
    currentPageSlug,
    isPublished,
    siteId,
    siteUrl,
    toggleEditorMode,
    setViewportSize,
    savePage,
    exitEditor
  } = useFullSiteEditor()

  const { user, signOut } = useAuth()

  // Enable autosave with 2-second debounce
  useSiteEditorAutoSave({
    enabled: true,
    delay: 2000
  })

  // State for page settings modal
  const [showPageSettingsModal, setShowPageSettingsModal] = useState(false)

  // State for create page modal
  const [showCreatePageModal, setShowCreatePageModal] = useState(false)

  // Don't render if not in edit mode
  if (!isEditMode) {
    return null
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U'
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      // First clear edit mode session cookie
      await fetch('/api/site-editor/exit', { method: 'POST' })
      // Then sign out the user
      await signOut()
      toast.success('Successfully signed out!')
      // Stay on current page, just logged out
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  // Handle navigation after creating new page - stay on customer site in edit mode
  const handleNavigateToNewPage = (newContent: { id: string; slug: string; title: string }) => {
    // Navigate to the newly created page on the customer site
    // Edit mode session is already active, so it will persist
    const newPagePath = newContent.slug === 'home' ? '/' : `/${newContent.slug}`
    window.location.href = newPagePath
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[60]',
        'bg-white border-b shadow-sm',
        'transition-all duration-300'
      )}
    >
      <div className="h-14 px-4 flex items-center justify-between gap-4">
        {/* Left: Page Switcher */}
        <div className="flex items-center gap-3">
          <QuickPageSwitcher
            currentSlug={currentPageSlug}
            hasUnsavedChanges={hasUnsavedChanges}
            onSavePage={savePage}
          />
          {currentPageSlug === '' && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
              <Home className="w-3 h-3" />
              Homepage
            </div>
          )}
          {!isPublished && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium border border-amber-200">
              <AlertCircle className="w-3 h-3" />
              <span>Draft - Not Published</span>
            </div>
          )}
        </div>

        {/* Center: Edit Mode Toggle & Viewport */}
        <div className="flex items-center gap-2">
          {/* Edit/Navigate Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => editorMode !== 'edit' && toggleEditorMode()}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                'flex items-center gap-1.5',
                editorMode === 'edit'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => editorMode !== 'navigate' && toggleEditorMode()}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                'flex items-center gap-1.5',
                editorMode === 'navigate'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <MousePointer className="w-3.5 h-3.5" />
              Navigate
            </button>
          </div>

          {/* Viewport Selector - Only visible in Edit mode */}
          {editorMode === 'edit' && (
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg animate-in fade-in slide-in-from-left-2 duration-200">
              <button
                onClick={() => setViewportSize('desktop')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewportSize === 'desktop'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                title="Desktop view"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewportSize('tablet')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewportSize === 'tablet'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                title="Tablet view"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewportSize('mobile')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewportSize === 'mobile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                title="Mobile view"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Autosave Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Autosave Status Indicator */}
          {isSaving && (
            <div className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--theme-primary)' }}>
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--theme-primary)' }} />
              Saving...
            </div>
          )}

          {!isSaving && hasUnsavedChanges && (
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Autosaving...
            </div>
          )}

          {!isSaving && !hasUnsavedChanges && (
            <div className="text-xs font-medium flex items-center gap-1.5 text-green-600">
              <Check className="w-3.5 h-3.5" />
              Autosave
            </div>
          )}

          {/* Page Settings Button */}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowPageSettingsModal(true)}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Page Settings</span>
            <span className="sm:hidden">Settings</span>
          </Button>

          {/* Create Page Button */}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 hidden md:flex"
            onClick={() => setShowCreatePageModal(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Page
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 cursor-pointer"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 z-[110]" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Optional: Collapse indicator for mobile */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .full-site-editor-bar {
            font-size: 0.875rem;
          }
        }
      `}</style>

      {/* Page Settings Modal */}
      <PageSettingsModal
        isOpen={showPageSettingsModal}
        onClose={() => setShowPageSettingsModal(false)}
      />

      {/* Create Page Modal */}
      <CreateContentModal
        open={showCreatePageModal}
        onOpenChange={setShowCreatePageModal}
        siteIdOverride={siteId}
        onNavigateAfterCreate={handleNavigateToNewPage}
      />
    </div>
  )
}

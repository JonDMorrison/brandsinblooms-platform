'use client'

/**
 * Full Site Editor Top Bar
 * Fixed navigation bar that appears when editing customer sites
 */

import React, { useState } from 'react'
import { useFullSiteEditor } from '@/src/contexts/FullSiteEditorContext'
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
  Save,
  Clock,
  FileText,
  Plus,
  Home,
  LogOut,
  ChevronDown,
  RotateCcw,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { QuickPageSwitcher } from './QuickPageSwitcher'

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
    toggleEditorMode,
    setViewportSize,
    savePage,
    discardChanges,
    exitEditor
  } = useFullSiteEditor()

  const { user, signOut } = useAuth()

  // State for discard confirmation modal
  const [showDiscardModal, setShowDiscardModal] = useState(false)

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

  // Handle discard changes - opens confirmation modal
  const handleDiscard = () => {
    setShowDiscardModal(true)
  }

  // Confirm and execute discard
  const confirmDiscard = () => {
    discardChanges()
    setShowDiscardModal(false)
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[9999]',
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

        {/* Right: Save & Exit */}
        <div className="flex items-center gap-3">
          {/* Last Saved */}
          {lastSaved && !hasUnsavedChanges && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Saved {format(lastSaved, 'HH:mm')}
              </span>
            </div>
          )}

          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && !isSaving && (
            <div className="text-xs text-amber-600 font-medium">
              Unsaved changes
            </div>
          )}

          {/* Saving indicator */}
          {isSaving && (
            <div className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--theme-primary)' }}>
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--theme-primary)' }} />
              Saving...
            </div>
          )}

          {/* Discard Button - Only when unsaved changes exist */}
          {hasUnsavedChanges && !isSaving && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDiscard}
              className={cn(
                'gap-1.5',
                'border-gray-300 text-gray-600',
                'hover:border-red-500 hover:text-red-600 hover:bg-red-50',
                'transition-colors'
              )}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Discard Changes</span>
              <span className="sm:hidden">Discard</span>
            </Button>
          )}

          {/* Save Button */}
          <Button
            size="sm"
            onClick={savePage}
            disabled={!hasUnsavedChanges || isSaving}
            className={cn(
              'gap-1.5',
              hasUnsavedChanges
                ? 'bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90 text-white'
                : 'bg-gray-300 cursor-not-allowed'
            )}
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>

          {/* Create Page Button (optional - for future) */}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 hidden md:flex"
            onClick={() => {
              // TODO: Open create page modal
              console.log('Create page clicked')
            }}
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
            <DropdownMenuContent className="w-48 z-[10000]" align="end">
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

      {/* Discard Changes Confirmation Modal */}
      <Dialog open={showDiscardModal} onOpenChange={setShowDiscardModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Discard Changes?</DialogTitle>
            <DialogDescription>
              This will revert all changes since your last save. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDiscardModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDiscard}
              className="bg-red-500 hover:bg-red-600"
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

/**
 * Full Site Editor Context
 * Manages state for the full site editor on customer-facing sites
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { PageContent } from '@/src/lib/content/schema'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'

export type EditorMode = 'edit' | 'navigate'
export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

export interface EditPermissions {
  canEdit: boolean
  canManage: boolean
  canPublish: boolean
  role: 'owner' | 'admin' | 'editor' | 'viewer' | null
}

export interface FullSiteEditorState {
  // Edit mode state
  isEditMode: boolean
  editorMode: EditorMode
  viewportSize: ViewportSize

  // Current page state
  currentPageId: string | null
  currentPageSlug: string
  pageContent: PageContent | null
  hasUnsavedChanges: boolean

  // Section management
  activeSection: string | null
  sectionsChanged: boolean

  // Permissions
  permissions: EditPermissions

  // UI state
  isTopBarVisible: boolean
  isSaving: boolean
  lastSaved: Date | null
}

interface FullSiteEditorContextValue extends FullSiteEditorState {
  // Mode management
  setEditorMode: (mode: EditorMode) => void
  toggleEditorMode: () => void
  setViewportSize: (size: ViewportSize) => void

  // Page content management
  setPageContent: (content: PageContent | null) => void
  setCurrentPageId: (id: string | null) => void
  updateSectionContent: (sectionKey: string, data: unknown) => void
  markAsChanged: () => void

  // Section management
  setActiveSection: (sectionKey: string | null) => void
  hideSection: (sectionKey: string) => void
  deleteSection: (sectionKey: string) => void
  reorderSection: (sectionKey: string, direction: 'up' | 'down') => void
  duplicateSection: (sectionKey: string) => void

  // Save management
  savePage: () => Promise<void>
  discardChanges: () => void
  setSaving: (saving: boolean) => void

  // UI management
  setTopBarVisible: (visible: boolean) => void

  // Permissions
  setPermissions: (permissions: EditPermissions) => void

  // Editor exit
  exitEditor: () => Promise<void>
}

const FullSiteEditorContext = createContext<FullSiteEditorContextValue | undefined>(undefined)

interface FullSiteEditorProviderProps {
  children: ReactNode
  isEditMode?: boolean
  initialPermissions?: EditPermissions
  initialPageContent?: PageContent | null
  initialPageId?: string | null
  onSave?: (content: PageContent) => Promise<void>
}

const defaultPermissions: EditPermissions = {
  canEdit: false,
  canManage: false,
  canPublish: false,
  role: null
}

export function FullSiteEditorProvider({
  children,
  isEditMode = false,
  initialPermissions = defaultPermissions,
  initialPageContent = null,
  initialPageId = null,
  onSave
}: FullSiteEditorProviderProps) {
  const pathname = usePathname()

  // Initialize state
  const [state, setState] = useState<FullSiteEditorState>({
    isEditMode,
    editorMode: 'edit',
    viewportSize: 'desktop',
    currentPageId: initialPageId,
    currentPageSlug: pathname || '',
    pageContent: initialPageContent,
    hasUnsavedChanges: false,
    activeSection: null,
    sectionsChanged: false,
    permissions: initialPermissions,
    isTopBarVisible: isEditMode,
    isSaving: false,
    lastSaved: null
  })

  // Update page slug when pathname changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentPageSlug: pathname || ''
    }))
  }, [pathname])

  // Mode management
  const setEditorMode = useCallback((mode: EditorMode) => {
    setState(prev => ({ ...prev, editorMode: mode }))
  }, [])

  const toggleEditorMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      editorMode: prev.editorMode === 'edit' ? 'navigate' : 'edit'
    }))
  }, [])

  const setViewportSize = useCallback((size: ViewportSize) => {
    setState(prev => ({ ...prev, viewportSize: size }))
  }, [])

  // Page content management
  const setPageContent = useCallback((content: PageContent | null) => {
    setState(prev => ({ ...prev, pageContent: content }))
  }, [])

  const setCurrentPageId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, currentPageId: id }))
  }, [])

  const updateSectionContent = useCallback((sectionKey: string, data: unknown) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const updatedContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...prev.pageContent.sections[sectionKey],
            data
          }
        }
      }

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  const markAsChanged = useCallback(() => {
    setState(prev => ({ ...prev, hasUnsavedChanges: true }))
  }, [])

  // Section management
  const setActiveSection = useCallback((sectionKey: string | null) => {
    setState(prev => ({ ...prev, activeSection: sectionKey }))
  }, [])

  const hideSection = useCallback((sectionKey: string) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const updatedContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...prev.pageContent.sections[sectionKey],
            visible: false
          }
        }
      }

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
    toast.success('Section hidden')
  }, [])

  const deleteSection = useCallback((sectionKey: string) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const sections = { ...prev.pageContent.sections }
      delete sections[sectionKey]

      const updatedContent = {
        ...prev.pageContent,
        sections
      }

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
    toast.success('Section deleted')
  }, [])

  const reorderSection = useCallback((sectionKey: string, direction: 'up' | 'down') => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const sections = prev.pageContent.sections
      const sectionKeys = Object.keys(sections)
      const currentIndex = sectionKeys.indexOf(sectionKey)

      if (currentIndex === -1) return prev

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      if (newIndex < 0 || newIndex >= sectionKeys.length) {
        toast.error(`Cannot move section ${direction}`)
        return prev
      }

      // Swap sections
      const newSectionKeys = [...sectionKeys]
      ;[newSectionKeys[currentIndex], newSectionKeys[newIndex]] = [
        newSectionKeys[newIndex],
        newSectionKeys[currentIndex]
      ]

      // Rebuild sections object in new order
      const reorderedSections: Record<string, unknown> = {}
      newSectionKeys.forEach(key => {
        reorderedSections[key] = sections[key]
      })

      const updatedContent = {
        ...prev.pageContent,
        sections: reorderedSections
      }

      toast.success(`Section moved ${direction}`)

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  const duplicateSection = useCallback((sectionKey: string) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section) return prev

      // Create new section key
      let newKey = `${sectionKey}_copy`
      let counter = 1
      while (prev.pageContent.sections[newKey]) {
        newKey = `${sectionKey}_copy_${counter}`
        counter++
      }

      const updatedContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [newKey]: { ...section }
        }
      }

      toast.success('Section duplicated')

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  // Save management
  const savePage = useCallback(async () => {
    if (!state.pageContent || !onSave) {
      toast.error('Cannot save: no content or save handler')
      return
    }

    setState(prev => ({ ...prev, isSaving: true }))

    try {
      await onSave(state.pageContent)
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        sectionsChanged: false,
        isSaving: false,
        lastSaved: new Date()
      }))
      toast.success('Changes saved')
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }))
      console.error('Error saving page:', error)
      toast.error('Failed to save changes')
    }
  }, [state.pageContent, onSave])

  const discardChanges = useCallback(() => {
    if (initialPageContent) {
      setState(prev => ({
        ...prev,
        pageContent: initialPageContent,
        hasUnsavedChanges: false,
        sectionsChanged: false
      }))
      toast.info('Changes discarded')
    }
  }, [initialPageContent])

  const setSaving = useCallback((saving: boolean) => {
    setState(prev => ({ ...prev, isSaving: saving }))
  }, [])

  // UI management
  const setTopBarVisible = useCallback((visible: boolean) => {
    setState(prev => ({ ...prev, isTopBarVisible: visible }))
  }, [])

  // Permissions
  const setPermissions = useCallback((permissions: EditPermissions) => {
    setState(prev => ({ ...prev, permissions }))
  }, [])

  // Editor exit
  const exitEditor = useCallback(async () => {
    if (state.hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to exit?'
      )
      if (!confirmed) return
    }

    try {
      await fetch('/api/site-editor/exit', { method: 'POST' })
      window.location.reload()
    } catch (error) {
      console.error('Error exiting editor:', error)
      toast.error('Failed to exit editor')
    }
  }, [state.hasUnsavedChanges])

  // Warning on page unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state.hasUnsavedChanges])

  const value: FullSiteEditorContextValue = {
    ...state,
    setEditorMode,
    toggleEditorMode,
    setViewportSize,
    setPageContent,
    setCurrentPageId,
    updateSectionContent,
    markAsChanged,
    setActiveSection,
    hideSection,
    deleteSection,
    reorderSection,
    duplicateSection,
    savePage,
    discardChanges,
    setSaving,
    setTopBarVisible,
    setPermissions,
    exitEditor
  }

  return (
    <FullSiteEditorContext.Provider value={value}>
      {children}
    </FullSiteEditorContext.Provider>
  )
}

/**
 * Hook to access full site editor context
 */
export function useFullSiteEditor() {
  const context = useContext(FullSiteEditorContext)

  if (!context) {
    throw new Error('useFullSiteEditor must be used within FullSiteEditorProvider')
  }

  return context
}

/**
 * Hook to check if edit mode is active
 */
export function useIsEditModeActive() {
  const context = useContext(FullSiteEditorContext)
  return context?.isEditMode ?? false
}

/**
 * Hook to check if user can edit
 */
export function useCanEdit() {
  const context = useContext(FullSiteEditorContext)
  return context?.permissions.canEdit ?? false
}

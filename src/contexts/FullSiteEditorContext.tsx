'use client'

/**
 * Full Site Editor Context
 * Manages state for the full site editor on customer-facing sites
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { PageContent, LayoutType, DEFAULT_FEATURED_ITEMS } from '@/src/lib/content/schema'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'

export type EditorMode = 'edit' | 'navigate'
export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

// Cookie name for editor mode persistence
const EDITOR_MODE_COOKIE = 'site_editor_mode'

/**
 * Read editor mode from cookie
 * Persists across page navigation during edit session
 */
function getEditorModeFromCookie(): EditorMode {
  if (typeof document === 'undefined') return 'edit'
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${EDITOR_MODE_COOKIE}=`))
    ?.split('=')[1]
  return (value === 'navigate' ? 'navigate' : 'edit') as EditorMode
}

/**
 * Write editor mode to cookie
 * Persists for 24 hours (same as edit session)
 */
function setEditorModeCookie(mode: EditorMode) {
  if (typeof document === 'undefined') return
  document.cookie = `${EDITOR_MODE_COOKIE}=${mode}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`
}

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
  isPublished: boolean
  hasUnsavedChanges: boolean

  // Page metadata
  pageTitle: string
  pageSlug: string
  layout: LayoutType
  siteUrl: string
  siteId: string

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
  updateFieldContent: (sectionKey: string, fieldPath: string, content: string) => void
  updateFeatureContent: (sectionKey: string, featureIndex: number, field: string, value: string) => void
  updateCategoryContent: (sectionKey: string, categoryIndex: number, updatedCategory: Record<string, unknown>) => void
  deleteCategoryContent: (sectionKey: string, categoryIndex: number) => void
  updateFeaturedContent: (sectionKey: string, itemIndex: number, updatedItem: Record<string, unknown>) => void
  deleteFeaturedContent: (sectionKey: string, itemIndex: number) => void
  updateSectionSettings: (sectionKey: string, settings: Record<string, unknown>, options?: { silent?: boolean }) => void
  markAsChanged: () => void

  // Item management (Features, Values, FAQ)
  addFeatureItem: (sectionKey: string, newItem: Record<string, unknown>) => void
  deleteFeatureItem: (sectionKey: string, itemIndex: number) => void
  addValueItem: (sectionKey: string, newItem: Record<string, unknown>) => void
  deleteValueItem: (sectionKey: string, itemIndex: number) => void
  addFAQItem: (sectionKey: string, newItem: Record<string, unknown>) => void
  deleteFAQItem: (sectionKey: string, itemIndex: number) => void

  // Page metadata management
  updatePageTitle: (title: string) => void
  updatePageSlug: (slug: string) => void
  updatePagePublished: (published: boolean) => void

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

export const FullSiteEditorContext = createContext<FullSiteEditorContextValue | undefined>(undefined)

export interface PageMetadata {
  title: string
  slug: string
  isPublished: boolean
}

interface FullSiteEditorProviderProps {
  children: ReactNode
  isEditMode?: boolean
  initialPermissions?: EditPermissions
  initialPageContent?: PageContent | null
  initialPageId?: string | null
  initialIsPublished?: boolean
  initialPageTitle?: string
  initialPageSlug?: string
  initialLayout?: LayoutType
  initialSiteUrl?: string
  initialSiteId?: string
  onSave?: (content: PageContent, metadata: PageMetadata) => Promise<void>
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
  initialIsPublished = true,
  initialPageTitle = '',
  initialPageSlug = '',
  initialLayout = 'landing',
  initialSiteUrl = '',
  initialSiteId = '',
  onSave
}: FullSiteEditorProviderProps) {
  const pathname = usePathname()

  // Initialize state with default 'edit' mode to ensure consistent SSR/client hydration
  // Cookie will be read after mount to restore user's preferred mode
  const [state, setState] = useState<FullSiteEditorState>({
    isEditMode,
    editorMode: 'edit', // Always start with 'edit' for consistent hydration
    viewportSize: 'desktop',
    currentPageId: initialPageId,
    currentPageSlug: pathname || '',
    pageContent: initialPageContent,
    isPublished: initialIsPublished,
    hasUnsavedChanges: false,
    pageTitle: initialPageTitle,
    pageSlug: initialPageSlug,
    layout: initialLayout,
    siteUrl: initialSiteUrl,
    siteId: initialSiteId,
    activeSection: null,
    sectionsChanged: false,
    permissions: initialPermissions,
    isTopBarVisible: isEditMode,
    isSaving: false,
    lastSaved: null
  })

  // Read editor mode from cookie after component mounts (client-only)
  // This prevents hydration mismatch while still persisting user's mode preference
  useEffect(() => {
    if (!isEditMode) return // Only read cookie if in edit mode

    const cookieMode = getEditorModeFromCookie()
    if (cookieMode !== state.editorMode) {
      setState(prev => ({ ...prev, editorMode: cookieMode }))
    }
  }, [isEditMode]) // Only run once when component mounts

  // Update page slug when pathname changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentPageSlug: pathname || ''
    }))
  }, [pathname])

  // Mode management
  const setEditorMode = useCallback((mode: EditorMode) => {
    setEditorModeCookie(mode) // Persist mode across page navigation
    setState(prev => ({ ...prev, editorMode: mode }))
  }, [])

  const toggleEditorMode = useCallback(() => {
    // Save current scroll position before DOM changes
    const scrollY = window.scrollY

    setState(prev => {
      const newMode = prev.editorMode === 'edit' ? 'navigate' : 'edit'
      setEditorModeCookie(newMode) // Persist mode across page navigation
      return {
        ...prev,
        editorMode: newMode
      }
    })

    // Restore scroll position after React reconciliation completes
    // requestAnimationFrame ensures this runs after the browser has painted the new DOM
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
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

      const updatedContent: PageContent = {
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

  const updateFieldContent = useCallback((sectionKey: string, fieldPath: string, content: string) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section) return prev

      // Strip "data." prefix since we're already working with section.data
      // fieldPath comes as "data.headline" but we're working with section.data already
      let processedPath = fieldPath
      if (processedPath.startsWith('data.')) {
        processedPath = processedPath.substring(5) // Remove "data." prefix
      }

      // Parse field path (e.g., "headline" -> ["headline"])
      const pathParts = processedPath.split('.')

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data || {}))

      // Navigate to the nested field and update it
      let current = updatedData
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {}
        }
        current = current[pathParts[i]]
      }
      current[pathParts[pathParts.length - 1]] = content

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
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

  const updateFeatureContent = useCallback((sectionKey: string, featureIndex: number, field: string, value: string) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Ensure features array exists
      if (!Array.isArray(updatedData.features)) {
        updatedData.features = []
      }

      // Ensure feature at index exists and is an object (backward compatibility)
      if (!updatedData.features[featureIndex]) {
        // Feature doesn't exist, create empty object
        updatedData.features[featureIndex] = {}
      } else if (typeof updatedData.features[featureIndex] === 'string') {
        // Feature is a string (old format), convert to object
        const stringValue = updatedData.features[featureIndex] as string
        updatedData.features[featureIndex] = {
          id: `feature-${featureIndex}`,
          icon: 'Check',
          title: stringValue,
          text: stringValue
        }
      }

      // Update the specific field
      updatedData.features[featureIndex][field] = value

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
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

  // Page metadata management
  const updatePageTitle = useCallback((title: string) => {
    setState(prev => ({
      ...prev,
      pageTitle: title,
      hasUnsavedChanges: true
    }))
  }, [])

  const updatePageSlug = useCallback((slug: string) => {
    setState(prev => ({
      ...prev,
      pageSlug: slug,
      hasUnsavedChanges: true
    }))
  }, [])

  const updatePagePublished = useCallback((published: boolean) => {
    setState(prev => ({
      ...prev,
      isPublished: published,
      hasUnsavedChanges: true
    }))
  }, [])

  // Category management
  const updateCategoryContent = useCallback((sectionKey: string, categoryIndex: number, updatedCategory: Record<string, unknown>) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Ensure categories array exists
      if (!Array.isArray(updatedData.categories)) {
        updatedData.categories = []
      }

      // Update the specific category
      if (updatedData.categories[categoryIndex]) {
        updatedData.categories[categoryIndex] = {
          ...updatedData.categories[categoryIndex],
          ...updatedCategory
        }
      }

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
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

  const deleteCategoryContent = useCallback((sectionKey: string, categoryIndex: number) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Ensure categories array exists
      if (!Array.isArray(updatedData.categories)) {
        return prev
      }

      // Remove category at index
      updatedData.categories.splice(categoryIndex, 1)

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
          }
        }
      }

      toast.success('Category deleted')

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  // Featured items management
  const updateFeaturedContent = useCallback((sectionKey: string, itemIndex: number, updatedItem: Record<string, unknown>) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Initialize featuredItems array if it doesn't exist or is empty
      // This "materializes" the default items into the database on first edit
      if (!Array.isArray(updatedData.featuredItems) || updatedData.featuredItems.length === 0) {
        console.info(`[FullSiteEditor] Initializing featuredItems with defaults for section "${sectionKey}"`)
        updatedData.featuredItems = JSON.parse(JSON.stringify(DEFAULT_FEATURED_ITEMS))
      }

      // Validate itemIndex bounds
      if (itemIndex < 0 || itemIndex >= updatedData.featuredItems.length) {
        console.warn(`[FullSiteEditor] Cannot update featured item: invalid itemIndex ${itemIndex} (array length: ${updatedData.featuredItems.length})`)
        return prev
      }

      // Update the specific featured item
      updatedData.featuredItems[itemIndex] = {
        ...updatedData.featuredItems[itemIndex],
        ...updatedItem
      }

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
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

  const deleteFeaturedContent = useCallback((sectionKey: string, itemIndex: number) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Initialize featuredItems array if it doesn't exist or is empty
      // This "materializes" the default items into the database before deletion
      if (!Array.isArray(updatedData.featuredItems) || updatedData.featuredItems.length === 0) {
        console.info(`[FullSiteEditor] Initializing featuredItems with defaults for section "${sectionKey}" before deletion`)
        updatedData.featuredItems = JSON.parse(JSON.stringify(DEFAULT_FEATURED_ITEMS))
      }

      // Validate itemIndex bounds
      if (itemIndex < 0 || itemIndex >= updatedData.featuredItems.length) {
        console.warn(`[FullSiteEditor] Cannot delete featured item: invalid itemIndex ${itemIndex} (array length: ${updatedData.featuredItems.length})`)
        return prev
      }

      // Remove item at index
      updatedData.featuredItems.splice(itemIndex, 1)

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
          }
        }
      }

      toast.success('Featured item deleted')

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  // Features section item management
  const addFeatureItem = useCallback((sectionKey: string, newItem: Record<string, unknown>) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Ensure features array exists
      if (!Array.isArray(updatedData.features)) {
        updatedData.features = []
      }

      // Add new item to features array
      updatedData.features.push(newItem)

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
          }
        }
      }

      toast.success('Feature added')

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  const deleteFeatureItem = useCallback((sectionKey: string, itemIndex: number) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Ensure features array exists
      if (!Array.isArray(updatedData.features)) {
        console.warn(`[FullSiteEditor] Cannot delete feature: features array not found`)
        return prev
      }

      // Validate itemIndex bounds
      if (itemIndex < 0 || itemIndex >= updatedData.features.length) {
        console.warn(`[FullSiteEditor] Cannot delete feature: invalid itemIndex ${itemIndex} (array length: ${updatedData.features.length})`)
        return prev
      }

      // Remove item at index
      updatedData.features.splice(itemIndex, 1)

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
          }
        }
      }

      toast.success('Feature deleted')

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  // Values section item management
  const addValueItem = useCallback((sectionKey: string, newItem: Record<string, unknown>) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Ensure items array exists
      if (!Array.isArray(updatedData.items)) {
        updatedData.items = []
      }

      // Add new item to items array
      updatedData.items.push(newItem)

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
          }
        }
      }

      toast.success('Value added')

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  const deleteValueItem = useCallback((sectionKey: string, itemIndex: number) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Ensure items array exists
      if (!Array.isArray(updatedData.items)) {
        console.warn(`[FullSiteEditor] Cannot delete value: items array not found`)
        return prev
      }

      // Validate itemIndex bounds
      if (itemIndex < 0 || itemIndex >= updatedData.items.length) {
        console.warn(`[FullSiteEditor] Cannot delete value: invalid itemIndex ${itemIndex} (array length: ${updatedData.items.length})`)
        return prev
      }

      // Remove item at index
      updatedData.items.splice(itemIndex, 1)

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
          }
        }
      }

      toast.success('Value deleted')

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  // FAQ section item management
  const addFAQItem = useCallback((sectionKey: string, newItem: Record<string, unknown>) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Ensure faqs array exists
      if (!Array.isArray(updatedData.faqs)) {
        updatedData.faqs = []
      }

      // Add new item to faqs array
      updatedData.faqs.push(newItem)

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
          }
        }
      }

      toast.success('FAQ added')

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  const deleteFAQItem = useCallback((sectionKey: string, itemIndex: number) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section || !section.data) return prev

      // Deep clone section data
      const updatedData = JSON.parse(JSON.stringify(section.data))

      // Ensure faqs array exists
      if (!Array.isArray(updatedData.faqs)) {
        console.warn(`[FullSiteEditor] Cannot delete FAQ: faqs array not found`)
        return prev
      }

      // Validate itemIndex bounds
      if (itemIndex < 0 || itemIndex >= updatedData.faqs.length) {
        console.warn(`[FullSiteEditor] Cannot delete FAQ: invalid itemIndex ${itemIndex} (array length: ${updatedData.faqs.length})`)
        return prev
      }

      // Remove item at index
      updatedData.faqs.splice(itemIndex, 1)

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            data: updatedData
          }
        }
      }

      toast.success('FAQ deleted')

      return {
        ...prev,
        pageContent: updatedContent,
        hasUnsavedChanges: true,
        sectionsChanged: true
      }
    })
  }, [])

  // Section settings management
  const updateSectionSettings = useCallback((
    sectionKey: string,
    settings: Record<string, unknown>,
    options?: { silent?: boolean }
  ) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const section = prev.pageContent.sections[sectionKey]
      if (!section) return prev

      const updatedContent: PageContent = {
        ...prev.pageContent,
        sections: {
          ...prev.pageContent.sections,
          [sectionKey]: {
            ...section,
            settings: {
              ...section.settings,
              ...settings
            }
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

    // Only show toast if not silenced
    if (!options?.silent) {
      toast.success('Section settings updated')
    }
  }, [])

  // Section management
  const setActiveSection = useCallback((sectionKey: string | null) => {
    setState(prev => ({ ...prev, activeSection: sectionKey }))
  }, [])

  const hideSection = useCallback((sectionKey: string) => {
    setState(prev => {
      if (!prev.pageContent) return prev

      const updatedContent: PageContent = {
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
      const reorderedSections = {} as typeof sections
      newSectionKeys.forEach(key => {
        reorderedSections[key] = sections[key]
      })

      const updatedContent: PageContent = {
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
      // Prepare metadata to save
      const metadata: PageMetadata = {
        title: state.pageTitle,
        slug: state.pageSlug,
        isPublished: state.isPublished
      }

      await onSave(state.pageContent, metadata)
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        sectionsChanged: false,
        isSaving: false,
        lastSaved: new Date()
      }))
      // Toast notification is shown by the onSave handler (ClientSiteEditorWrapper)
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }))
      console.error('Error saving page:', error)
      toast.error('Failed to save changes')
    }
  }, [state.pageContent, state.pageTitle, state.pageSlug, state.isPublished, onSave])

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
    updateFieldContent,
    updateFeatureContent,
    updateCategoryContent,
    deleteCategoryContent,
    updateFeaturedContent,
    deleteFeaturedContent,
    addFeatureItem,
    deleteFeatureItem,
    addValueItem,
    deleteValueItem,
    addFAQItem,
    deleteFAQItem,
    updateSectionSettings,
    markAsChanged,
    updatePageTitle,
    updatePageSlug,
    updatePagePublished,
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
 * Hook to optionally access full site editor context
 * Returns undefined if not within FullSiteEditorProvider (e.g., in Content Editor)
 * Use this in shared components that work in both Full Site Editor and Content Editor
 */
export function useFullSiteEditorOptional() {
  return useContext(FullSiteEditorContext)
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

'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import {
  Eye,
  EyeOff,
  Layers,
  Settings,
  Undo,
  Redo,
  Save,
  Grid3X3,
  Move,
  MousePointer,
  Plus,
  Package,
  Lock
} from 'lucide-react'
import { PageContent, LayoutType, LAYOUT_SECTIONS } from '@/src/lib/content/schema'
import { toast } from 'sonner'
import { useVisualEditor } from '@/src/contexts/VisualEditorContext'
import { useEditMode } from '@/src/contexts/EditModeContext'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/src/components/ui/dropdown-menu'

interface VisualEditorToolbarProps {
  content: PageContent
  layout: LayoutType
  onContentChange: (content: PageContent) => void
  onToggleComponentLibrary?: () => void
  isComponentLibraryOpen?: boolean
  className?: string
}

export function VisualEditorToolbar({
  content,
  layout,
  onContentChange,
  onToggleComponentLibrary,
  isComponentLibraryOpen = false,
  className
}: VisualEditorToolbarProps) {
  const { editMode } = useEditMode()
  const {
    activeElement,
    hoveredElement,
    showOverlay,
    toggleOverlay,
    editableElements,
    getElementsInSection
  } = useVisualEditor()
  
  const [isGridVisible, setIsGridVisible] = useState(false)
  
  // Get section statistics
  const sectionStats = React.useMemo(() => {
    const sections = Object.keys(content.sections)
    const visibleSections = sections.filter(key => content.sections[key].visible !== false)
    const hiddenSections = sections.length - visibleSections.length
    
    return {
      total: sections.length,
      visible: visibleSections.length,
      hidden: hiddenSections
    }
  }, [content.sections])
  
  // Get editable elements count
  const elementCount = editableElements.size
  
  // Handle section visibility toggle
  const toggleSectionVisibility = useCallback((sectionKey: string) => {
    const currentSection = content.sections[sectionKey]
    if (!currentSection) return

    // Check if this is a required section - don't allow hiding required sections
    const layoutConfig = LAYOUT_SECTIONS[layout]
    if ((layoutConfig?.required || []).includes(sectionKey) && currentSection.visible) {
      // Show a toast notification that required sections can't be hidden
      toast.info('Required sections cannot be hidden')
      return
    }

    const updatedContent: PageContent = {
      ...content,
      sections: {
        ...content.sections,
        [sectionKey]: {
          ...currentSection,
          visible: !currentSection.visible
        }
      }
    }

    onContentChange(updatedContent)
  }, [content, onContentChange, layout])
  
  // Get sections for dropdown (sorted by order)
  const sections = Object.entries(content.sections)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
    .map(([key, section]) => ({
      key,
      section,
      elementCount: getElementsInSection(key).length
    }))
  
  if (editMode !== 'inline') return null
  
  return (
    <div className={`visual-editor-toolbar border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 py-2 flex items-center justify-between sticky top-0 z-20 ${className || ''}`}>
      {/* Left side - Mode & Status */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          Visual Editor
        </Badge>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Element count */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MousePointer className="w-4 h-4" />
          <span>{elementCount} elements</span>
        </div>
        
        {/* Active element indicator */}
        {activeElement && (
          <Badge variant="outline" className="text-xs">
            {activeElement.sectionKey} • {activeElement.fieldPath.split('.').pop()}
          </Badge>
        )}
      </div>
      
      {/* Center - Tools */}
      <div className="flex items-center gap-2">
        {/* Overlay toggle */}
        <Button
          variant={showOverlay ? "secondary" : "ghost"}
          size="sm"
          onClick={toggleOverlay}
          className="h-8 px-3"
        >
          {showOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
        
        {/* Grid toggle */}
        <Button
          variant={isGridVisible ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setIsGridVisible(!isGridVisible)}
          className="h-8 px-3"
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Sections dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <Layers className="w-4 h-4 mr-1" />
              Sections ({sectionStats.visible})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-64">
            <DropdownMenuLabel className="flex items-center justify-between">
              Page Sections
              <Badge variant="secondary" className="text-xs">
                {sectionStats.total} total
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {sections.map(({ key, section, elementCount }) => {
              const layoutConfig = LAYOUT_SECTIONS[layout]
              const isRequired = (layoutConfig?.required || []).includes(key)

              return (
                <DropdownMenuItem
                  key={key}
                  className={`flex items-center justify-between ${
                    isRequired ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                  onClick={() => !isRequired && toggleSectionVisibility(key)}
                >
                  <div className="flex items-center gap-2">
                    {section.visible !== false ? (
                      <Eye className={`w-3 h-3 ${
                        isRequired ? 'text-gray-400' : 'text-green-600'
                      }`} />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isRequired && (
                      <Lock className="w-3 h-3 text-amber-600" />
                    )}
                    {elementCount > 0 && (
                      <Badge variant="outline" className="text-xs h-4 px-1">
                        {elementCount}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })}
            
            {sections.length === 0 && (
              <DropdownMenuItem disabled>
                No sections available
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Component Library Toggle */}
        {onToggleComponentLibrary && (
          <>
            <Button
              variant={isComponentLibraryOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={onToggleComponentLibrary}
              className="h-8 px-3"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Section
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
          </>
        )}
        
        {/* Undo/Redo (placeholder for future implementation) */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled>
          <Redo className="w-4 h-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Settings */}
        <Button variant="ghost" size="sm" className="h-8 px-3">
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </Button>
      </div>
      
      {/* Grid overlay */}
      {isGridVisible && (
        <div className="fixed inset-0 pointer-events-none z-10">
          <div 
            className="w-full h-full opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
        </div>
      )}
      
    </div>
  )
}
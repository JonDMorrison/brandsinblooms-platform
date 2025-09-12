'use client'

/**
 * Section Actions Component
 * Provides action buttons for sections (delete, duplicate, etc.) that appear on hover
 */

import React, { useState } from 'react'
import { Trash2, Copy, Eye, EyeOff, GripVertical, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ContentSection } from '@/lib/content/schema'
import SectionDeleteDialog from './SectionDeleteDialog'

interface SectionActionsProps {
  sectionKey: string
  section: ContentSection
  onDelete: (sectionKey: string) => void
  onToggleVisibility?: (sectionKey: string) => void
  onDuplicate?: (sectionKey: string) => void
  dragHandle?: React.ReactNode
  className?: string
  compact?: boolean
}

export function SectionActions({
  sectionKey,
  section,
  onDelete,
  onToggleVisibility,
  onDuplicate,
  dragHandle,
  className = '',
  compact = false
}: SectionActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }
  
  const handleDeleteConfirm = () => {
    onDelete(sectionKey)
    setShowDeleteDialog(false)
  }
  
  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
  }
  
  const handleToggleVisibility = () => {
    if (onToggleVisibility) {
      onToggleVisibility(sectionKey)
    }
  }
  
  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(sectionKey)
    }
  }
  
  if (compact) {
    return (
      <>
        <div className={`flex items-center gap-1 ${className}`}>
          {/* Drag Handle */}
          {dragHandle && (
            <div className="flex-shrink-0">
              {dragHandle}
            </div>
          )}
          
          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onToggleVisibility && (
                <DropdownMenuItem onClick={handleToggleVisibility}>
                  {section.visible !== false ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Section
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Section
                    </>
                  )}
                </DropdownMenuItem>
              )}
              
              {onDuplicate && (
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Section
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleDeleteClick}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Delete Confirmation Dialog */}
        <SectionDeleteDialog
          isOpen={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          sectionKey={sectionKey}
          section={section}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </>
    )
  }
  
  // Full actions layout
  return (
    <>
      <div className={`flex items-center gap-1 ${className}`}>
        {/* Drag Handle */}
        {dragHandle && (
          <div className="flex-shrink-0">
            {dragHandle}
          </div>
        )}
        
        {/* Visibility Toggle */}
        {onToggleVisibility && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleVisibility}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title={section.visible !== false ? 'Hide section' : 'Show section'}
          >
            {section.visible !== false ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
          </Button>
        )}
        
        {/* Duplicate Button */}
        {onDuplicate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Duplicate section"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        
        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteClick}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
          title="Delete section"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <SectionDeleteDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        sectionKey={sectionKey}
        section={section}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  )
}

export default SectionActions
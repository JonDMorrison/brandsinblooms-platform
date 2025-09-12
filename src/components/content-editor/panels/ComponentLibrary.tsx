'use client'

/**
 * Component Library Panel for Visual Editor
 * Provides a side panel with available section templates that can be added to content
 */

import React, { useState, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp,
  Filter
} from 'lucide-react'
import * as Lucide from 'lucide-react'
import {
  SECTION_TEMPLATES,
  SectionTemplate,
  SectionCategory,
  getTemplatesByCategory,
  getAllCategories,
  searchTemplates
} from '@/lib/content/section-templates'
import { ContentSection } from '@/lib/content/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ComponentLibraryProps {
  onAddSection: (templateId: string, insertAfter?: string) => void
  isOpen: boolean
  onClose: () => void
  disabled?: boolean
  className?: string
}

interface TemplateCardProps {
  template: SectionTemplate
  onAdd: (templateId: string) => void
  disabled?: boolean
}

/**
 * Individual template card component
 */
function TemplateCard({ template, onAdd, disabled }: TemplateCardProps) {
  const IconComponent = (Lucide as any)[template.icon] || Lucide.Square

  return (
    <div className="group relative border rounded-lg p-3 hover:shadow-md transition-all bg-white">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-gray-50 rounded-md group-hover:bg-gray-100 transition-colors">
          <IconComponent className="h-4 w-4 text-gray-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 truncate">
            {template.name}
          </h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {template.description}
          </p>
          
          {template.preview?.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
              {template.preview.description}
            </p>
          )}
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAdd(template.id)}
          disabled={disabled}
          className="flex-shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Category section component
 */
interface CategorySectionProps {
  category: SectionCategory
  templates: SectionTemplate[]
  onAddTemplate: (templateId: string) => void
  disabled?: boolean
  defaultOpen?: boolean
}

function CategorySection({ 
  category, 
  templates, 
  onAddTemplate, 
  disabled,
  defaultOpen = false
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  const categoryLabels: Record<SectionCategory, string> = {
    content: 'Content',
    layout: 'Layout',
    media: 'Media',
    interactive: 'Interactive',
    commerce: 'Commerce',
    social: 'Social',
    plant: 'Plant Care'
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto font-medium text-left"
        >
          <span className="flex items-center gap-2">
            <span>{categoryLabels[category]}</span>
            <Badge variant="secondary" className="text-xs">
              {templates.length}
            </Badge>
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-2 px-3 pb-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onAdd={onAddTemplate}
            disabled={disabled}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Main ComponentLibrary component
 */
export function ComponentLibrary({
  onAddSection,
  isOpen,
  onClose,
  disabled = false,
  className = ''
}: ComponentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SectionCategory | 'all'>('all')
  
  // Get all available categories
  const categories = getAllCategories()
  
  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let templates = SECTION_TEMPLATES
    
    // Apply search filter
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery.trim())
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      templates = templates.filter(template => template.category === selectedCategory)
    }
    
    return templates
  }, [searchQuery, selectedCategory])
  
  // Group templates by category for display
  const templatesByCategory = useMemo(() => {
    const grouped: Record<SectionCategory, SectionTemplate[]> = {
      content: [],
      layout: [],
      media: [],
      interactive: [],
      commerce: [],
      social: [],
      plant: []
    }
    
    filteredTemplates.forEach(template => {
      if (grouped[template.category]) {
        grouped[template.category].push(template)
      }
    })
    
    // Only return categories that have templates
    return Object.entries(grouped).filter(([_, templates]) => templates.length > 0)
  }, [filteredTemplates])
  
  const handleAddTemplate = (templateId: string) => {
    onAddSection(templateId)
  }
  
  const handleClearSearch = () => {
    setSearchQuery('')
    setSelectedCategory('all')
  }
  
  if (!isOpen) {
    return null
  }
  
  return (
    <div className={`
      fixed right-0 top-0 h-full w-80 bg-white border-l shadow-lg z-50
      flex flex-col
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <h2 className="font-semibold text-gray-900">Add Section</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Search and Filters */}
      <div className="p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-3 w-3" />
                {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem 
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-gray-100' : ''}
            >
              All Categories
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-gray-100' : ''}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Results Summary */}
      <div className="px-4 py-2 text-xs text-gray-500 border-b bg-gray-50">
        {filteredTemplates.length} section{filteredTemplates.length !== 1 ? 's' : ''} available
      </div>
      
      {/* Template Categories */}
      <ScrollArea className="flex-1">
        <div className="p-0">
          {templatesByCategory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-2">
                <Search className="h-8 w-8 mx-auto text-gray-400" />
              </div>
              <p className="text-sm">No sections found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            templatesByCategory.map(([category, templates]) => (
              <CategorySection
                key={category}
                category={category as SectionCategory}
                templates={templates}
                onAddTemplate={handleAddTemplate}
                disabled={disabled}
                defaultOpen={templatesByCategory.length === 1}
              />
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 text-xs text-gray-500">
        <p>Click on any section to add it to your content. New sections will be added at the bottom.</p>
      </div>
    </div>
  )
}

export default ComponentLibrary
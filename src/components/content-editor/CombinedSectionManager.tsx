'use client'

import { useMemo, useState, useCallback } from 'react'
import { Button, buttonVariants } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Switch } from '@/src/components/ui/switch'
import { ScrollArea } from '@/src/components/ui/scroll-area'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { 
  Eye, 
  EyeOff, 
  ChevronRight,
  ChevronDown,
  GripVertical,
  CheckCircle,
  AlertCircle,
  Circle,
  Plus,
  Trash2
} from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  MeasuringStrategy
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers'
import { cn } from '@/src/lib/utils'

import { 
  PageContent, 
  ContentSection, 
  ContentSectionType,
  LayoutType,
  LAYOUT_SECTIONS 
} from '@/src/lib/content/schema'

// Import section editor renderer
import { SectionEditorRenderer } from './SectionEditorRenderer'

interface CombinedSectionManagerProps {
  content: PageContent
  layout: LayoutType
  onToggleVisibility: (sectionKey: string) => void
  onMoveUp: (sectionKey: string) => void
  onMoveDown: (sectionKey: string) => void
  onReorderSections?: (sections: Array<{ key: string; section: ContentSection }>) => void
  onSectionClick?: (sectionKey: string) => void
  activeSectionKey?: string
  isDraggingEnabled?: boolean
  onSectionUpdate?: (sectionKey: string, section: ContentSection) => void
  onAddSection?: (sectionType: ContentSectionType, variant?: string) => void
  onRemoveSection?: (sectionKey: string) => void
}

interface ExpandableSectionCardProps {
  sectionKey: string
  section: ContentSection
  isRequired: boolean
  isActive: boolean
  isExpanded: boolean
  onToggleVisibility: (sectionKey: string) => void
  onToggleExpanded: (sectionKey: string) => void
  onClick: (sectionKey: string) => void
  onSectionUpdate?: (sectionKey: string, section: ContentSection) => void
  onRemoveSection?: (sectionKey: string) => void
  onRequestDelete?: (sectionKey: string) => void
  isDraggingEnabled?: boolean
  isDragging?: boolean
  isOverlay?: boolean
}

interface SortableExpandableSectionCardProps extends ExpandableSectionCardProps {
  id: string
}

function ExpandableSectionCard({
  sectionKey,
  section,
  isRequired,
  isActive,
  isExpanded,
  onToggleVisibility,
  onToggleExpanded,
  onClick,
  onSectionUpdate,
  onRemoveSection,
  onRequestDelete,
  isDraggingEnabled = false,
  isDragging = false,
  isOverlay = false
}: ExpandableSectionCardProps) {
  const getRichTextContentType = (section: ContentSection): 'mission' | 'story' | 'contact' | 'other' => {
    const content = section.data.content || ''
    const headline = section.data.headline || ''

    // Check for mission-related keywords
    if (headline.toLowerCase().includes('mission') ||
        content.toLowerCase().includes('mission') ||
        content.toLowerCase().includes('we believe') ||
        content.toLowerCase().includes('our purpose')) {
      return 'mission'
    }

    // Check for story-related keywords
    if (headline.toLowerCase().includes('story') ||
        headline.toLowerCase().includes('history') ||
        content.toLowerCase().includes('founded') ||
        content.toLowerCase().includes('journey') ||
        content.toLowerCase().includes('began') ||
        content.toLowerCase().includes('started')) {
      return 'story'
    }

    // Check for contact-related keywords
    if (headline.toLowerCase().includes('get in touch') ||
        headline.toLowerCase().includes('contact') ||
        content.toLowerCase().includes('get in touch') ||
        content.toLowerCase().includes("we'd love to hear from you") ||
        content.toLowerCase().includes('reach out')) {
      return 'contact'
    }

    return 'other'
  }

  const getSectionIcon = (type: ContentSectionType) => {
    const iconMap: Record<string, string> = {
      hero: '🦸',
      header: '📋',
      blogHeader: '📰',
      richText: '📝',
      text: '📄',
      image: '🖼️',
      icon: '⭐',
      gallery: '🖼️',
      features: '⚡',
      featured: '⭐',
      cta: '📢',
      testimonials: '💬',
      form: '📝',
      pricing: '💰',
      team: '👥',
      mission: '🎯',
      values: '💎',
      specifications: '📋',
      categories: '📂',
      businessInfo: '📞',
      faq: '❓'
    }

    // Content-aware icons for Rich Text sections
    if (type === 'richText') {
      const contentType = getRichTextContentType(section)
      switch (contentType) {
        case 'mission': return '🎯'
        case 'story': return '📖'
        case 'contact': return '📧'
        case 'other': return '📝'
      }
    }

    return iconMap[type] || '📄'
  }

  const formatSectionName = (key: string) => {
    // Special handling for Rich Text sections with semantic naming
    if (key.startsWith('richText')) {
      const contentType = getRichTextContentType(section)

      // Generate name based on variant type - always show semantic name
      const baseName = contentType === 'mission' ? 'Our Mission' :
                      contentType === 'story' ? 'Our Story' :
                      contentType === 'contact' ? 'Get in Touch' : 'Other'

      // For this component, we'll just show the base name without numbering
      // since this is used for aria-labels and doesn't need the detailed counting
      return baseName
    }

    // Special handling for dedicated mission section
    if (key === 'mission') {
      return 'Our Mission'
    }

    // Default formatting for other section types
    return key.replace(/([A-Z])/g, ' $1').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getSectionStatus = () => {
    if (!section.visible) {
      return { icon: EyeOff, label: 'Hidden', className: 'text-gray-500' }
    }
    
    if (isRequired) {
      return { icon: AlertCircle, label: 'Required', className: 'text-amber-600' }
    }
    
    return { icon: Eye, label: 'Visible', className: 'text-blue-600' }
  }

  const status = getSectionStatus()
  const StatusIcon = status.icon

  const handleExpandButtonClick = (e: React.MouseEvent) => {
    // Expand button click - expand/collapse and notify parent
    onToggleExpanded(sectionKey)
    onClick(sectionKey)
  }

  const handleDragAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Drag area - no action, just prevent bubbling
  }

  const handleToggleAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Toggle area - handled by Switch component
  }

  return (
    <div className="space-y-0">
      {/* Main Card */}
      <div 
        className={`
          flex items-center rounded-lg border 
          transition-all duration-200 ease-in-out
          hover:shadow-md hover:scale-[1.01]
          ${isActive 
            ? 'border-primary bg-primary/5 shadow-sm' 
            : 'border-border hover:border-primary/50'
          }
          ${isDragging ? 'opacity-50 shadow-lg transform rotate-2 scale-105 z-50' : ''}
          ${isOverlay ? 'shadow-2xl border-primary bg-primary/10' : ''}
          ${isExpanded ? 'rounded-b-none border-b-0 shadow-sm bg-primary/5' : ''}
        `}
      >
        {/* Left Zone: Drag Handle */}
        <div 
          className={`
            flex items-center p-3 transition-all duration-200 rounded-l-lg
            ${isDraggingEnabled 
              ? 'text-primary cursor-grab active:cursor-grabbing hover:text-primary/80 hover:bg-primary/5' 
              : 'text-gray-300 cursor-not-allowed opacity-50'
            }
          `}
          onClick={handleDragAreaClick}
          title={isDraggingEnabled ? 'Drag to reorder' : 'Close section to enable dragging'}
          role={isDraggingEnabled ? "button" : undefined}
          aria-label={isDraggingEnabled ? `Drag to reorder ${formatSectionName(sectionKey)} section` : undefined}
          tabIndex={isDraggingEnabled ? 0 : -1}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Middle Zone: Display Only (No Click Handler) */}
        <div 
          className={`
            flex items-center gap-2 flex-1 p-3 py-3
            ${isExpanded ? 'bg-primary/5' : ''}
          `}
        >
          {/* Section Icon */}
          <span className="text-base">{getSectionIcon(section.type)}</span>
          
          {/* Section Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium truncate">
                {formatSectionName(sectionKey)}
              </h4>
              {isRequired && (
                <Badge variant="secondary" className="text-xs h-4 px-1.5 shrink-0">
                  Required
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 mt-0.5">
              <StatusIcon className={`h-3 w-3 ${status.className}`} />
              <span className={`text-xs ${status.className}`}>
                {status.label}
              </span>
            </div>
          </div>

        </div>

        {/* Right Zone: Expand Button + Remove Button + Visibility Toggle */}
        <div className="flex items-center">
          {/* Enhanced Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`
              h-6 w-6 p-1 transition-all duration-200
              hover:bg-primary/10 hover:scale-110 focus:ring-2 focus:ring-primary focus:ring-offset-1
              ${isExpanded ? 'text-primary bg-primary/10' : 'text-muted-foreground'}
            `}
            onClick={handleExpandButtonClick}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${formatSectionName(sectionKey)} section editor`}
            title={isExpanded ? `Collapse ${formatSectionName(sectionKey)} section` : `Expand ${formatSectionName(sectionKey)} section`}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform duration-200" />
            )}
          </Button>

          {/* Remove Button - only for optional sections */}
          {!isRequired && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-1 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation()
                if (onRequestDelete) {
                  onRequestDelete(sectionKey)
                }
              }}
              title={`Remove ${formatSectionName(sectionKey)} section`}
              aria-label={`Remove ${formatSectionName(sectionKey)} section`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}

          {/* Visibility Toggle */}
          <div
            className={`
              flex items-center p-3 rounded-r-lg transition-all duration-200
              hover:bg-muted/50 active:bg-muted/70
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
              ${isRequired ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            `}
            onClick={handleToggleAreaClick}
            title={isRequired
              ? 'Required sections cannot be hidden'
              : (section.visible ? 'Hide section from preview' : 'Show section in preview')
            }
            role="button"
            tabIndex={0}
            aria-label={`Toggle visibility for ${formatSectionName(sectionKey)} section`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (!isRequired) {
                  onToggleVisibility(sectionKey)
                }
              }
            }}
          >
            <Switch
              checked={section.visible}
              onCheckedChange={() => {
                if (!isRequired) {
                  onToggleVisibility(sectionKey)
                }
              }}
              disabled={isRequired}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Expanded Content Area */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className={`
          border border-t-0 rounded-b-lg bg-card/80 backdrop-blur-sm
          transform transition-all duration-300 ease-in-out
          ${isExpanded ? 'translate-y-0 scale-100' : 'translate-y-[-10px] scale-95'}
        `}>
          {/* Section Editor Content */}
          {isExpanded && (
            <div className="p-3 animate-in fade-in-50 duration-200 delay-150">
              <SectionEditorRenderer
                sectionKey={sectionKey}
                section={section}
                onUpdate={onSectionUpdate || (() => {})}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Add Section Card Component for missing sections
interface AddSectionCardProps {
  sectionType: ContentSectionType
  onAddSection: (sectionType: ContentSectionType, variant?: string) => void
}

type RichTextVariant = 'mission' | 'story' | 'contact' | 'other'

// Rich Text template content generator
export function createRichTextTemplate(variant: RichTextVariant) {
  const templates = {
    mission: {
      headline: 'Our Mission',
      content: `<p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">We believe in transforming spaces and lives through the power of plants. Our mission is to provide expert guidance, premium plants, and sustainable practices that help create thriving green sanctuaries in every home and office.</p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;"></p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">We're committed to making plant care accessible, enjoyable, and successful for everyone – from beginners taking their first steps into gardening to experienced plant enthusiasts expanding their collections.</p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;"></p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">Through our carefully curated selection and personalized support, we aim to foster a deeper connection between people and nature, one plant at a time.</p>`
    },
    story: {
      headline: 'Our Story',
      content: `<p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">Founded with a passion for plants and a commitment to sustainability, we have grown from a small local nursery into a trusted source for premium plants and expert care guidance.</p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;"></p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">Our journey began with the simple belief that everyone deserves to experience the joy and benefits of thriving plants in their space. What started as a weekend farmer's market booth has evolved into a comprehensive plant care ecosystem, serving thousands of plant lovers in our community.</p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;"></p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">Today, we continue to honor that founding vision by combining scientific expertise with genuine care for our customers and the environment. Every plant we sell and every piece of advice we give reflects our deep commitment to helping you succeed with your green companions.</p>`
    },
    contact: {
      headline: 'Get in Touch',
      content: `<p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">We'd love to hear from you. Whether you have questions about our products, need support, or want to learn more about what we offer, our team is ready to help.</p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;"></p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">Reach out via phone, email, or stop by during our business hours. We strive to respond to all inquiries within 24 hours.</p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;"></p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">For urgent matters, please call us directly. For general inquiries, feel free to use any of the contact methods listed above.</p>`
    },
    other: {
      headline: 'Other',
      content: `<p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">Add your custom content here. This rich text section supports <strong>bold text</strong>, <em>italic text</em>, and other formatting options.</p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;"></p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">You can create multiple paragraphs, add lists, and structure your content to engage your visitors effectively.</p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;"></p><p style="color: var(--theme-text); font-family: var(--theme-font-body); text-align: left;">Replace this placeholder content with information that's relevant to your business and audience.</p>`
    }
  }

  return templates[variant] || templates.other
}

function AddSectionCard({ sectionType, onAddSection }: AddSectionCardProps) {
  const getSectionIcon = (type: ContentSectionType) => {
    const iconMap: Record<string, string> = {
      hero: '🦸',
      header: '📋',
      blogHeader: '📰',
      richText: '📝',
      text: '📄',
      image: '🖼️',
      icon: '⭐',
      gallery: '🖼️',
      features: '⚡',
      featured: '⭐',
      cta: '📢',
      testimonials: '💬',
      form: '📝',
      pricing: '💰',
      team: '👥',
      mission: '🎯',
      values: '💎',
      specifications: '📋',
      categories: '📂',
      businessInfo: '📞',
      faq: '❓'
    }
    return iconMap[type] || '📄'
  }

  const formatSectionName = (type: string) => {
    // Special handling for Rich Text section
    if (type === 'richText') {
      return 'Rich Text'
    }

    // Special handling for dedicated mission section
    if (type === 'mission') {
      return 'Our Mission'
    }

    // Special handling for businessInfo
    if (type === 'businessInfo') {
      return 'Business Information'
    }

    // Special handling for faq
    if (type === 'faq') {
      return 'FAQ'
    }

    // Default formatting for other section types
    return type.replace(/([A-Z])/g, ' $1').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const richTextVariants = [
    {
      key: 'mission' as RichTextVariant,
      label: 'Our Mission',
      icon: '🎯',
      description: 'Company mission and purpose statement'
    },
    {
      key: 'story' as RichTextVariant,
      label: 'Our Story',
      icon: '📖',
      description: 'Company history and journey'
    },
    {
      key: 'contact' as RichTextVariant,
      label: 'Get in Touch',
      icon: '📧',
      description: 'Contact information and support details'
    },
    {
      key: 'other' as RichTextVariant,
      label: 'Other',
      icon: '📝',
      description: 'General rich text content'
    }
  ]

  const handleVariantSelect = (variant: RichTextVariant) => {
    onAddSection(sectionType, variant)
  }

  const handleDirectAdd = () => {
    onAddSection(sectionType)
  }

  // For Rich Text sections, show variant selection dropdown
  if (sectionType === 'richText') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
        {/* Add Icon */}
        <div className="flex items-center text-gray-400">
          <Plus className="h-4 w-4" />
        </div>

        {/* Section Info */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-base opacity-50">{getSectionIcon(sectionType)}</span>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-600">
              Add {formatSectionName(sectionType)}
            </h4>
            <span className="text-xs text-gray-500">
              Choose a variant to add
            </span>
          </div>
        </div>

        {/* Variant Selection Dropdown */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-primary border border-primary/20 hover:bg-primary/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {richTextVariants.map((variant) => (
                <DropdownMenuItem
                  key={variant.key}
                  onClick={() => handleVariantSelect(variant.key)}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <span className="text-base mt-0.5">{variant.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{variant.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{variant.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  // For other section types, use the original layout
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200"
      onClick={handleDirectAdd}
    >
      {/* Add Icon */}
      <div className="flex items-center text-gray-400">
        <Plus className="h-4 w-4" />
      </div>

      {/* Section Info */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-base opacity-50">{getSectionIcon(sectionType)}</span>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-600">
            Add {formatSectionName(sectionType)}
          </h4>
          <span className="text-xs text-gray-500">
            Optional section
          </span>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-primary border border-primary/20 hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation()
            handleDirectAdd()
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}

// Sortable wrapper for drag-and-drop functionality
function SortableExpandableSectionCard({
  id,
  ...props
}: SortableExpandableSectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    },
    disabled: props.isExpanded // Disable dragging when section is expanded
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto'
  }

  const isDragDisabled = props.isExpanded
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...(!isDragDisabled ? attributes : {})}
      {...(!isDragDisabled ? listeners : {})}
      className={isDragDisabled ? "touch-auto" : "touch-none"}
    >
      <ExpandableSectionCard 
        {...props} 
        isDragging={isDragging}
        isDraggingEnabled={!isDragDisabled}
      />
    </div>
  )
}

export function CombinedSectionManager({
  content,
  layout,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onReorderSections,
  onSectionClick,
  activeSectionKey,
  isDraggingEnabled = true,
  onSectionUpdate,
  onAddSection,
  onRemoveSection
}: CombinedSectionManagerProps) {
  const layoutConfig = LAYOUT_SECTIONS[layout]
  const [activeId, setActiveId] = useState<string | null>(null)
  const [expandedSectionKey, setExpandedSectionKey] = useState<string | null>(null)
  const [draggedSection, setDraggedSection] = useState<{
    key: string
    section: ContentSection
  } | null>(null)
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)
  
  // Get all available sections for this layout
  const allAvailableSections = useMemo(() => {
    const existingSections = Object.keys(content.sections)
    const requiredSections = layoutConfig.required
    const optionalSections = layoutConfig.optional
    
    return [...requiredSections, ...optionalSections]
  }, [layoutConfig, content.sections])

  // Get existing sections (sorted by order)
  const sortedSections = useMemo(() => {
    return Object.entries(content.sections).sort((a, b) => {
      const orderA = a[1].order || 0
      const orderB = b[1].order || 0
      return orderA - orderB
    })
  }, [content.sections])

  // Get missing sections that can be added
  const missingSections = useMemo(() => {
    const existingSectionKeys = Object.keys(content.sections)

    // Section types that allow multiple instances
    const multipleInstanceTypes: ContentSectionType[] = ['richText']

    return layoutConfig.optional.filter(sectionKey => {
      // Always allow multiple instance types to be added
      if (multipleInstanceTypes.includes(sectionKey as ContentSectionType)) {
        return true
      }
      // For other types, only show if they don't exist yet
      return !existingSectionKeys.includes(sectionKey)
    })
  }, [layoutConfig.optional, content.sections])

  // Configure sensors for touch and pointer devices
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5
      }
    })
  )

  const sectionStats = useMemo(() => {
    const available = allAvailableSections.length
    const added = sortedSections.length
    const visible = sortedSections.filter(([, section]) => section.visible).length
    
    return { available, added, visible }
  }, [allAvailableSections.length, sortedSections])

  const handleSectionClick = (sectionKey: string) => {
    onSectionClick?.(sectionKey)
  }

  const handleToggleExpanded = useCallback((sectionKey: string) => {
    setExpandedSectionKey(current => 
      current === sectionKey ? null : sectionKey
    )
  }, [])

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    // Store the dragged section for overlay rendering
    const draggedEntry = sortedSections.find(([key]) => key === active.id)
    if (draggedEntry) {
      setDraggedSection({
        key: draggedEntry[0],
        section: draggedEntry[1]
      })
    }
  }, [sortedSections])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setDraggedSection(null)
    
    if (!over || active.id === over.id) return
    
    const oldIndex = sortedSections.findIndex(([key]) => key === active.id)
    const newIndex = sortedSections.findIndex(([key]) => key === over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      // Reorder sections array
      const reorderedSections = arrayMove(sortedSections, oldIndex, newIndex)
      
      // Update order values to match new positions
      const updatedSections = reorderedSections.map(([key, section], index) => ({
        key,
        section: {
          ...section,
          order: index + 1
        }
      }))
      
      // Call the reorder handler if provided (for optimistic updates)
      if (onReorderSections) {
        onReorderSections(updatedSections)
      } else {
        // Fallback to individual moves for backward compatibility
        if (newIndex > oldIndex) {
          // Moving down
          for (let i = 0; i < newIndex - oldIndex; i++) {
            onMoveDown(active.id as string)
          }
        } else {
          // Moving up
          for (let i = 0; i < oldIndex - newIndex; i++) {
            onMoveUp(active.id as string)
          }
        }
      }
    }
  }, [sortedSections, onReorderSections, onMoveUp, onMoveDown])

  // Handle section deletion confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (sectionToDelete && onRemoveSection) {
      onRemoveSection(sectionToDelete)
      setSectionToDelete(null)
    }
  }, [sectionToDelete, onRemoveSection])

  const handleDeleteCancel = useCallback(() => {
    setSectionToDelete(null)
  }, [])

  // Helper function to detect Rich Text content type
  const getRichTextContentType = useCallback((section: ContentSection): 'mission' | 'story' | 'other' => {
    const content = section.data.content || ''
    const headline = section.data.headline || ''

    // Check for mission-related keywords
    if (headline.toLowerCase().includes('mission') ||
        content.toLowerCase().includes('mission') ||
        content.toLowerCase().includes('we believe') ||
        content.toLowerCase().includes('our purpose')) {
      return 'mission'
    }

    // Check for story-related keywords
    if (headline.toLowerCase().includes('story') ||
        headline.toLowerCase().includes('history') ||
        content.toLowerCase().includes('founded') ||
        content.toLowerCase().includes('journey') ||
        content.toLowerCase().includes('began') ||
        content.toLowerCase().includes('started')) {
      return 'story'
    }

    return 'other'
  }, [])

  // Helper function to format section names with semantic Rich Text handling
  const formatSectionName = useCallback((key: string) => {
    // Special handling for Rich Text sections with semantic naming
    if (key.startsWith('richText')) {
      const section = content.sections[key]
      if (section) {
        const contentType = getRichTextContentType(section)

        // Count how many sections of this same variant type exist (including this one)
        const sameVariantSections = Object.entries(content.sections)
          .filter(([sectionKey, sectionData]) => {
            if (!sectionKey.startsWith('richText') || sectionData.type !== 'richText') return false
            return getRichTextContentType(sectionData) === contentType
          })
          .sort(([a], [b]) => {
            // Sort by key to maintain consistent ordering
            if (a === 'richText') return -1
            if (b === 'richText') return 1
            const aNum = parseInt(a.replace('richText_', ''), 10) || 0
            const bNum = parseInt(b.replace('richText_', ''), 10) || 0
            return aNum - bNum
          })

        // Find the index of the current section in the sorted list
        const currentIndex = sameVariantSections.findIndex(([sectionKey]) => sectionKey === key)

        // Generate name based on variant type and position
        const baseName = contentType === 'mission' ? 'Our Mission' :
                        contentType === 'story' ? 'Our Story' : 'Other'

        if (currentIndex === 0) {
          // First instance of this variant type gets no number
          return baseName
        } else {
          // Subsequent instances get numbered starting from 02
          const number = currentIndex + 1
          const paddedNumber = number.toString().padStart(2, '0')
          return `${baseName} ${paddedNumber}`
        }
      }

      // Fallback for Rich Text sections without content
      return 'Other'
    }

    // Default formatting for other section types
    return key.replace(/([A-Z])/g, ' $1').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [content.sections, getRichTextContentType])

  // Handle delete request from section card
  const handleDeleteRequest = useCallback((sectionKey: string) => {
    setSectionToDelete(sectionKey)
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="text-lg font-medium">{sectionStats.available}</div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
          <div className="text-center p-2 bg-primary/10 rounded">
            <div className="text-lg font-medium text-primary">
              {sectionStats.added}
            </div>
            <div className="text-xs text-primary">Added</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-medium text-blue-600">
              {sectionStats.visible}
            </div>
            <div className="text-xs text-blue-600">Visible</div>
          </div>
        </div>
      </div>

      {/* Section List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isDraggingEnabled ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              measuring={{
                droppable: {
                  strategy: MeasuringStrategy.Always
                }
              }}
              modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
            >
              <SortableContext 
                items={sortedSections.map(([key]) => key)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 relative">
                  {/* Existing Sections */}
                  {sortedSections.map(([sectionKey, section]) => {
                    const isRequired = layoutConfig.required.includes(sectionKey)
                    const isActive = activeSectionKey === sectionKey
                    const isExpanded = expandedSectionKey === sectionKey
                    
                    return (
                      <SortableExpandableSectionCard
                        key={sectionKey}
                        id={sectionKey}
                        sectionKey={sectionKey}
                        section={section}
                        isRequired={isRequired}
                        isActive={isActive}
                        isExpanded={isExpanded}
                        onToggleVisibility={onToggleVisibility}
                        onToggleExpanded={handleToggleExpanded}
                        onClick={handleSectionClick}
                        onSectionUpdate={onSectionUpdate}
                        onRemoveSection={onRemoveSection}
                        onRequestDelete={handleDeleteRequest}
                      />
                    )
                  })}
                  
                  {/* Add Section Cards for Missing Sections */}
                  {missingSections.length > 0 && onAddSection && (
                    <div className="pt-2 mt-4 border-t border-dashed border-gray-300">
                      <div className="text-xs text-gray-500 mb-2 font-medium">Available to Add</div>
                      {missingSections.map((sectionType) => (
                        <div key={`add-${sectionType}`} className="mb-2">
                          <AddSectionCard
                            sectionType={sectionType as ContentSectionType}
                            onAddSection={onAddSection}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SortableContext>
              
              {/* Drag Overlay */}
              <DragOverlay 
                dropAnimation={{
                  duration: 200,
                  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)'
                }}
              >
                {draggedSection && (
                  <div className="transform rotate-3">
                    <ExpandableSectionCard
                      sectionKey={draggedSection.key}
                      section={draggedSection.section}
                      isRequired={layoutConfig.required.includes(draggedSection.key)}
                      isActive={activeSectionKey === draggedSection.key}
                      isExpanded={false}
                      onToggleVisibility={onToggleVisibility}
                      onToggleExpanded={handleToggleExpanded}
                      onClick={handleSectionClick}
                      onSectionUpdate={onSectionUpdate}
                      onRemoveSection={onRemoveSection}
                      onRequestDelete={handleDeleteRequest}
                      isOverlay={true}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            // Fallback to non-draggable version
            <div className="space-y-2">
              {/* Existing Sections */}
              {sortedSections.map(([sectionKey, section]) => {
                const isRequired = layoutConfig.required.includes(sectionKey)
                const isActive = activeSectionKey === sectionKey
                const isExpanded = expandedSectionKey === sectionKey
                
                return (
                  <ExpandableSectionCard
                    key={sectionKey}
                    sectionKey={sectionKey}
                    section={section}
                    isRequired={isRequired}
                    isActive={isActive}
                    isExpanded={isExpanded}
                    onToggleVisibility={onToggleVisibility}
                    onToggleExpanded={handleToggleExpanded}
                    onClick={handleSectionClick}
                    onSectionUpdate={onSectionUpdate}
                    onRemoveSection={onRemoveSection}
                    onRequestDelete={handleDeleteRequest}
                    isDraggingEnabled={false}
                  />
                )
              })}
              
              {/* Add Section Cards for Missing Sections */}
              {missingSections.length > 0 && onAddSection && (
                <div className="pt-2 mt-4 border-t border-dashed border-gray-300">
                  <div className="text-xs text-gray-500 mb-2 font-medium">Available to Add</div>
                  {missingSections.map((sectionType) => (
                    <div key={`add-${sectionType}`} className="mb-2">
                      <AddSectionCard
                        sectionType={sectionType as ContentSectionType}
                        onAddSection={onAddSection}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-xs text-gray-500 text-center">
          {isDraggingEnabled 
            ? 'Drag sections to reorder • Click arrow to expand • Toggle visibility with switches'
            : 'Click arrow to expand • Toggle visibility with switches'
          }
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={sectionToDelete !== null} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the &quot;{sectionToDelete ? formatSectionName(sectionToDelete) : ''}&quot; section? 
              This action cannot be undone and all content in this section will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="!bg-red-600 hover:!bg-red-700 !text-white !border-0"
            >
              Remove Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CombinedSectionManager
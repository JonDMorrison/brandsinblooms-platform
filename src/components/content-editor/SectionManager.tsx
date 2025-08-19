'use client'

import { useMemo } from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Switch } from '@/src/components/ui/switch'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown,
  GripVertical,
  CheckCircle,
  AlertCircle,
  Circle
} from 'lucide-react'

import { 
  PageContent, 
  ContentSection, 
  ContentSectionType,
  LayoutType,
  LAYOUT_SECTIONS 
} from '@/src/lib/content/schema'

interface SectionManagerProps {
  content: PageContent
  layout: LayoutType
  onToggleVisibility: (sectionKey: string) => void
  onMoveUp: (sectionKey: string) => void
  onMoveDown: (sectionKey: string) => void
  onSectionClick?: (sectionKey: string) => void
  activeSectionKey?: string
}

interface SectionItemProps {
  sectionKey: string
  section: ContentSection
  isRequired: boolean
  isActive: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onToggleVisibility: (sectionKey: string) => void
  onMoveUp: (sectionKey: string) => void
  onMoveDown: (sectionKey: string) => void
  onClick: (sectionKey: string) => void
}

function SectionItem({
  sectionKey,
  section,
  isRequired,
  isActive,
  canMoveUp,
  canMoveDown,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onClick
}: SectionItemProps) {
  const getSectionIcon = (type: ContentSectionType) => {
    const iconMap = {
      hero: '🦸',
      richText: '📝',
      text: '📄',
      image: '🖼️',
      icon: '⭐',
      gallery: '🖼️',
      features: '⚡',
      cta: '📢',
      testimonials: '💬',
      form: '📝',
      pricing: '💰',
      team: '👥',
      mission: '🎯',
      values: '💎',
      specifications: '📋'
    }
    return iconMap[type] || '📄'
  }

  const getSectionStatus = () => {
    const hasContent = section.data.content || section.data.url || section.data.icon || 
                      (section.data.items && Array.isArray(section.data.items) && section.data.items.length > 0)
    
    if (!section.visible) {
      return { icon: EyeOff, label: 'Hidden', className: 'text-muted-foreground' }
    }
    
    if (hasContent) {
      return { icon: CheckCircle, label: 'Complete', className: 'text-green-600' }
    }
    
    if (isRequired) {
      return { icon: AlertCircle, label: 'Required', className: 'text-amber-600' }
    }
    
    return { icon: Circle, label: 'Empty', className: 'text-muted-foreground' }
  }

  const status = getSectionStatus()
  const StatusIcon = status.icon

  const formatSectionName = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
        ${isActive 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}
      onClick={() => onClick(sectionKey)}
    >
      {/* Drag Handle */}
      <div className="flex items-center text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Section Info */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-base">{getSectionIcon(section.type)}</span>
        
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

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Move buttons */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation()
            onMoveUp(sectionKey)
          }}
          disabled={!canMoveUp}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation()
            onMoveDown(sectionKey)
          }}
          disabled={!canMoveDown}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>

        {/* Visibility toggle */}
        <Switch
          checked={section.visible}
          onCheckedChange={() => onToggleVisibility(sectionKey)}
          disabled={isRequired}
          size="sm"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}

export function SectionManager({
  content,
  layout,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onSectionClick,
  activeSectionKey
}: SectionManagerProps) {
  const layoutConfig = LAYOUT_SECTIONS[layout]
  
  const sortedSections = useMemo(() => {
    return Object.entries(content.sections).sort((a, b) => {
      const orderA = a[1].order || 0
      const orderB = b[1].order || 0
      return orderA - orderB
    })
  }, [content.sections])

  const sectionStats = useMemo(() => {
    const total = sortedSections.length
    const visible = sortedSections.filter(([, section]) => section.visible).length
    const completed = sortedSections.filter(([, section]) => {
      const hasContent = section.data.content || section.data.url || section.data.icon ||
                        (section.data.items && Array.isArray(section.data.items) && section.data.items.length > 0)
      return section.visible && hasContent
    }).length
    
    return { total, visible, completed }
  }, [sortedSections])

  const canMoveUp = (index: number) => index > 0
  const canMoveDown = (index: number) => index < sortedSections.length - 1

  const handleSectionClick = (sectionKey: string) => {
    onSectionClick?.(sectionKey)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium">Section Manager</h3>
            <p className="text-xs text-muted-foreground">
              {layout.charAt(0).toUpperCase() + layout.slice(1)} Layout
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="text-lg font-medium">{sectionStats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-medium text-blue-600">
              {sectionStats.visible}
            </div>
            <div className="text-xs text-blue-600">Visible</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-medium text-green-600">
              {sectionStats.completed}
            </div>
            <div className="text-xs text-green-600">Complete</div>
          </div>
        </div>
      </div>

      {/* Section List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {sortedSections.map(([sectionKey, section], index) => {
            const isRequired = layoutConfig.required.includes(sectionKey)
            const isActive = activeSectionKey === sectionKey
            
            return (
              <SectionItem
                key={sectionKey}
                sectionKey={sectionKey}
                section={section}
                isRequired={isRequired}
                isActive={isActive}
                canMoveUp={canMoveUp(index)}
                canMoveDown={canMoveDown(index)}
                onToggleVisibility={onToggleVisibility}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onClick={handleSectionClick}
              />
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Drag sections to reorder • Toggle visibility with switches
        </p>
      </div>
    </div>
  )
}

export default SectionManager
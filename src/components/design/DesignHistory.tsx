'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Badge } from '@/src/components/ui/badge'
import { 
  Undo2, 
  Redo2, 
  History, 
  Clock,
  ChevronRight,
  Trash2,
  Save,
  Download,
  Upload
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'
import { toast } from 'sonner'

interface DesignHistoryProps {
  history: Array<{
    settings: ThemeSettings
    timestamp: number
    description?: string
  }>
  currentIndex: number
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onJumpTo: (index: number) => void
  onClear: () => void
  onApply?: (settings: ThemeSettings) => void
}

export function DesignHistory({
  history,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onJumpTo,
  onClear,
  onApply
}: DesignHistoryProps) {
  // Export history as JSON
  const handleExportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `design-history-${new Date().toISOString()}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success('History exported successfully')
  }
  
  // Import history from JSON
  const handleImportHistory = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const imported = JSON.parse(text)
        
        // Validate the imported data
        if (!Array.isArray(imported)) {
          throw new Error('Invalid history format')
        }
        
        // Apply the most recent settings
        if (imported.length > 0 && onApply) {
          const latest = imported[imported.length - 1]
          onApply(latest.settings)
          toast.success('History imported and applied')
        }
      } catch (error) {
        toast.error('Failed to import history')
      }
    }
    
    input.click()
  }
  
  // Generate preview of changes
  const getChangeSummary = (index: number): string => {
    if (index === 0) return 'Initial state'
    
    const prev = history[index - 1].settings
    const curr = history[index].settings
    const changes: string[] = []
    
    // Check color changes
    if (JSON.stringify(prev.colors) !== JSON.stringify(curr.colors)) {
      changes.push('Colors')
    }
    
    // Check typography changes
    if (JSON.stringify(prev.typography) !== JSON.stringify(curr.typography)) {
      changes.push('Typography')
    }
    
    // Check layout changes
    if (JSON.stringify(prev.layout) !== JSON.stringify(curr.layout)) {
      changes.push('Layout')
    }
    
    // Check logo changes
    if (JSON.stringify(prev.logo) !== JSON.stringify(curr.logo)) {
      changes.push('Logo')
    }
    
    return changes.length > 0 ? `Changed: ${changes.join(', ')}` : 'No changes'
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Design History
            </CardTitle>
            <CardDescription>
              Track and revert your design changes
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Cmd/Ctrl + Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Cmd/Ctrl + Shift + Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* History Controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportHistory}
            disabled={history.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportHistory}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={history.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
        
        {/* History Timeline */}
        <ScrollArea className="h-[400px] pr-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No history yet</p>
              <p className="text-xs mt-1">Your design changes will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, index) => {
                const isCurrent = index === currentIndex
                const isPast = index < currentIndex
                const isFuture = index > currentIndex
                
                return (
                  <div
                    key={index}
                    className={`
                      relative p-3 rounded-lg border cursor-pointer transition-all
                      ${isCurrent ? 'bg-primary/5 border-primary' : ''}
                      ${isPast ? 'opacity-60 hover:opacity-80' : ''}
                      ${isFuture ? 'opacity-40 hover:opacity-60' : ''}
                      ${!isCurrent ? 'hover:bg-gray-50' : ''}
                    `}
                    onClick={() => !isCurrent && onJumpTo(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                          </span>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium">
                          {entry.description || getChangeSummary(index)}
                        </p>
                        
                        {/* Color preview */}
                        <div className="flex items-center gap-1 mt-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: entry.settings.colors.primary }}
                            title="Primary"
                          />
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: entry.settings.colors.secondary }}
                            title="Secondary"
                          />
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: entry.settings.colors.accent }}
                            title="Accent"
                          />
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: entry.settings.colors.background }}
                            title="Background"
                          />
                          <span className="text-xs text-gray-400 ml-2">
                            {entry.settings.typography.headingFont} / {entry.settings.typography.bodyFont}
                          </span>
                        </div>
                      </div>
                      
                      {!isCurrent && (
                        <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        
        {/* Keyboard Shortcuts */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
          <p>Keyboard shortcuts:</p>
          <div className="flex gap-4">
            <span><kbd>Cmd/Ctrl + Z</kbd> Undo</span>
            <span><kbd>Cmd/Ctrl + Shift + Z</kbd> Redo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
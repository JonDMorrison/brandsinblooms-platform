'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, AlertCircle, Clock, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { handleError } from '@/lib/types/error-handling'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'failed'

interface AutoSaveProps {
  onSave: () => Promise<void>
  isDirty: boolean
  isValid: boolean
  delay?: number
  maxRetries?: number
  className?: string
}

interface AutoSaveState {
  status: AutoSaveStatus
  lastSaved: Date | null
  retryCount: number
  error: string | null
}

export function AutoSave({
  onSave,
  isDirty,
  isValid,
  delay = 5000,
  maxRetries = 3,
  className
}: AutoSaveProps) {
  const [state, setState] = useState<AutoSaveState>({
    status: 'idle',
    lastSaved: null,
    retryCount: 0,
    error: null
  })

  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const performSave = useCallback(async () => {
    if (!isValid || !isDirty) return

    setState(prev => ({ ...prev, status: 'saving', error: null }))

    try {
      await onSave()
      setState(prev => ({
        ...prev,
        status: 'saved',
        lastSaved: new Date(),
        retryCount: 0,
        error: null
      }))

      // Reset to idle after showing "saved" status briefly
      setTimeout(() => {
        setState(prev => ({ ...prev, status: 'idle' }))
      }, 1000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed'
      handleError(error, 'Auto-save failed')

      setState(prev => {
        const newRetryCount = prev.retryCount + 1
        
        // Schedule retry if we haven't exceeded max retries
        if (newRetryCount < maxRetries) {
          const retryDelay = Math.min(delay * Math.pow(2, newRetryCount), 10000) // Exponential backoff, max 10s
          setTimeout(() => {
            performSave()
          }, retryDelay)
        } else {
          // Remove persistent error toast - user will see indicator in UI
          console.error(`Auto-save failed after ${maxRetries} attempts`)
        }

        return {
          ...prev,
          status: 'failed',
          retryCount: newRetryCount,
          error: errorMessage
        }
      })
    }
  }, [onSave, isValid, isDirty, delay, maxRetries])

  const scheduleAutoSave = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (isDirty && isValid && state.status !== 'saving') {
      const newTimeoutId = setTimeout(() => {
        performSave()
      }, delay)
      setTimeoutId(newTimeoutId)
    }
  }, [isDirty, isValid, state.status, delay, performSave])

  const handleManualRetry = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }))
    performSave()
  }, [performSave])

  // Schedule auto-save when content changes
  useEffect(() => {
    scheduleAutoSave()
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [scheduleAutoSave])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  const getStatusDisplay = () => {
    switch (state.status) {
      case 'saving':
        return {
          icon: <Clock className="h-3 w-3 animate-spin" />,
          text: 'Saving...',
          variant: 'secondary' as const,
          className: 'text-blue-600 border-blue-600'
        }
      case 'saved':
        return {
          icon: <Check className="h-3 w-3" />,
          text: 'Saved',
          variant: 'secondary' as const,
          className: 'text-green-600 border-green-600'
        }
      case 'failed':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: `Failed (${state.retryCount}/${maxRetries})`,
          variant: 'destructive' as const,
          className: ''
        }
      default:
        if (isDirty) {
          return {
            icon: <Clock className="h-3 w-3" />,
            text: 'Unsaved',
            variant: 'outline' as const,
            className: 'text-orange-600 border-orange-600'
          }
        }
        return null
    }
  }

  const statusDisplay = getStatusDisplay()
  if (!statusDisplay) return null

  const getTooltipContent = () => {
    if (state.status === 'saved' && state.lastSaved) {
      return `Last saved: ${state.lastSaved.toLocaleTimeString()}`
    }
    if (state.status === 'failed' && state.error) {
      return `Error: ${state.error}`
    }
    if (state.status === 'saving') {
      return 'Saving changes...'
    }
    if (isDirty) {
      return 'Changes will be saved automatically'
    }
    return 'All changes saved'
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={statusDisplay.variant}
              className={`h-6 px-2 ${statusDisplay.className}`}
            >
              {statusDisplay.icon}
              <span className="ml-1.5 text-xs">{statusDisplay.text}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>

        {state.status === 'failed' && state.retryCount < maxRetries && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleManualRetry}
                className="h-6 w-6 p-0"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Retry save</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

export default AutoSave
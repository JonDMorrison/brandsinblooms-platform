import { useState, useCallback, useRef, useEffect } from 'react'
import { ThemeSettings } from '@/src/lib/queries/domains/theme'

interface HistoryEntry {
  settings: ThemeSettings
  timestamp: number
  description?: string
}

interface UseDesignHistoryOptions {
  maxHistorySize?: number
  autoSave?: boolean
  storageKey?: string
}

export function useDesignHistory(
  initialSettings: ThemeSettings,
  options: UseDesignHistoryOptions = {}
) {
  const {
    maxHistorySize = 50,
    autoSave = true,
    storageKey = 'design-history'
  } = options
  
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [currentSettings, setCurrentSettings] = useState<ThemeSettings>(initialSettings)
  
  // Track if we're in the middle of an undo/redo operation
  const isUndoRedoRef = useRef(false)
  
  // Initialize history from localStorage
  useEffect(() => {
    if (!autoSave) return
    
    try {
      const savedHistory = localStorage.getItem(storageKey)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        setHistory(parsed.history || [])
        setCurrentIndex(parsed.currentIndex || -1)
        if (parsed.history && parsed.history.length > 0 && parsed.currentIndex >= 0) {
          setCurrentSettings(parsed.history[parsed.currentIndex].settings)
        }
      }
    } catch (error) {
      console.error('Failed to load design history:', error)
    }
  }, [storageKey, autoSave])
  
  // Save history to localStorage
  useEffect(() => {
    if (!autoSave) return
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        history,
        currentIndex
      }))
    } catch (error) {
      console.error('Failed to save design history:', error)
    }
  }, [history, currentIndex, storageKey, autoSave])
  
  // Add new entry to history
  const addToHistory = useCallback((
    settings: ThemeSettings,
    description?: string
  ) => {
    // Don't add to history during undo/redo
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false
      return
    }
    
    setHistory(prev => {
      // Remove any entries after current index (for branching history)
      const newHistory = prev.slice(0, currentIndex + 1)
      
      // Add new entry
      newHistory.push({
        settings: JSON.parse(JSON.stringify(settings)), // Deep clone
        timestamp: Date.now(),
        description
      })
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize)
      }
      
      return newHistory
    })
    
    setCurrentIndex(prev => Math.min(prev + 1, maxHistorySize - 1))
    setCurrentSettings(settings)
  }, [currentIndex, maxHistorySize])
  
  // Undo to previous state
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoRef.current = true
      const newIndex = currentIndex - 1
      const entry = history[newIndex]
      
      setCurrentIndex(newIndex)
      setCurrentSettings(entry.settings)
      
      return entry.settings
    }
    return null
  }, [currentIndex, history])
  
  // Redo to next state
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoRef.current = true
      const newIndex = currentIndex + 1
      const entry = history[newIndex]
      
      setCurrentIndex(newIndex)
      setCurrentSettings(entry.settings)
      
      return entry.settings
    }
    return null
  }, [currentIndex, history])
  
  // Jump to specific point in history
  const jumpToHistory = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      isUndoRedoRef.current = true
      const entry = history[index]
      
      setCurrentIndex(index)
      setCurrentSettings(entry.settings)
      
      return entry.settings
    }
    return null
  }, [history])
  
  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentIndex(-1)
    
    if (autoSave) {
      try {
        localStorage.removeItem(storageKey)
      } catch (error) {
        console.error('Failed to clear history:', error)
      }
    }
  }, [autoSave, storageKey])
  
  // Get history metadata
  const getHistoryInfo = useCallback(() => {
    return {
      totalEntries: history.length,
      currentIndex,
      canUndo: currentIndex > 0,
      canRedo: currentIndex < history.length - 1,
      entries: history.map((entry, index) => ({
        ...entry,
        isCurrent: index === currentIndex
      }))
    }
  }, [history, currentIndex])
  
  return {
    // Current state
    currentSettings,
    
    // History operations
    addToHistory,
    undo,
    redo,
    jumpToHistory,
    clearHistory,
    
    // History info
    getHistoryInfo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length,
    
    // Raw history access (for display)
    history,
    currentIndex
  }
}

// Hook for keyboard shortcuts
export function useDesignHistoryKeyboardShortcuts(
  undo: () => void,
  redo: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + Z (undo)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      
      // Check for Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y (redo)
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
        ((e.metaKey || e.ctrlKey) && e.key === 'y')
      ) {
        e.preventDefault()
        redo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [undo, redo, enabled])
}
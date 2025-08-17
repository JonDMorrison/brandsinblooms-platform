'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { PageContent } from '@/src/lib/content/schema'

interface PerformanceMetrics {
  renderCount: number
  avgRenderTime: number
  lastRenderTime: number
  contentSize: number
  saveTime: number | null
  loadTime: number | null
  memoryUsage: number | null
}

interface PerformanceWarning {
  type: 'render' | 'content-size' | 'save-time' | 'memory'
  message: string
  severity: 'low' | 'medium' | 'high'
  timestamp: Date
}

interface UseEditorPerformanceProps {
  content?: PageContent
  isEnabled?: boolean
  warningThresholds?: {
    renderTime: number
    contentSize: number
    saveTime: number
    renderCount: number
  }
}

interface UseEditorPerformanceReturn {
  metrics: PerformanceMetrics
  warnings: PerformanceWarning[]
  startTiming: (operation: 'save' | 'load') => () => void
  logRender: () => void
  clearWarnings: () => void
  getReport: () => string
}

const DEFAULT_THRESHOLDS = {
  renderTime: 100, // ms
  contentSize: 100000, // bytes
  saveTime: 2000, // ms
  renderCount: 50 // renders per minute
}

export function useEditorPerformance({
  content,
  isEnabled = process.env.NODE_ENV === 'development',
  warningThresholds = DEFAULT_THRESHOLDS
}: UseEditorPerformanceProps = {}): UseEditorPerformanceReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    avgRenderTime: 0,
    lastRenderTime: 0,
    contentSize: 0,
    saveTime: null,
    loadTime: null,
    memoryUsage: null
  })

  const [warnings, setWarnings] = useState<PerformanceWarning[]>([])
  const renderTimesRef = useRef<number[]>([])
  const lastRenderTimeRef = useRef<number>(Date.now())
  const renderWindowRef = useRef<number[]>([])

  // Get memory usage (if available)
  const getMemoryUsage = useCallback((): number | null => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize || null
    }
    return null
  }, [])

  // Calculate content size
  const calculateContentSize = useCallback((content: PageContent): number => {
    if (!content) return 0
    try {
      return new Blob([JSON.stringify(content)]).size
    } catch {
      return 0
    }
  }, [])

  // Add warning
  const addWarning = useCallback((warning: Omit<PerformanceWarning, 'timestamp'>) => {
    if (!isEnabled) return

    const newWarning: PerformanceWarning = {
      ...warning,
      timestamp: new Date()
    }

    setWarnings(prev => {
      // Avoid duplicate warnings within 5 seconds
      const isDuplicate = prev.some(w => 
        w.type === warning.type && 
        w.message === warning.message &&
        Date.now() - w.timestamp.getTime() < 5000
      )

      if (isDuplicate) return prev

      // Keep only last 10 warnings
      const updated = [newWarning, ...prev].slice(0, 10)
      return updated
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const style = warning.severity === 'high' ? 'color: red' : 
                   warning.severity === 'medium' ? 'color: orange' : 'color: yellow'
      console.warn(`%c[Editor Performance] ${warning.message}`, style)
    }
  }, [isEnabled])

  // Start timing an operation
  const startTiming = useCallback((operation: 'save' | 'load') => {
    if (!isEnabled) return () => {}

    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      setMetrics(prev => ({
        ...prev,
        [operation === 'save' ? 'saveTime' : 'loadTime']: duration
      }))

      // Check for performance warnings
      if (operation === 'save' && duration > warningThresholds.saveTime) {
        addWarning({
          type: 'save-time',
          message: `Slow save operation: ${duration.toFixed(1)}ms (threshold: ${warningThresholds.saveTime}ms)`,
          severity: duration > warningThresholds.saveTime * 2 ? 'high' : 'medium'
        })
      }
    }
  }, [isEnabled, warningThresholds.saveTime, addWarning])

  // Log render
  const logRender = useCallback(() => {
    if (!isEnabled) return

    const now = performance.now()
    const renderTime = now - lastRenderTimeRef.current
    lastRenderTimeRef.current = now

    // Track render times
    renderTimesRef.current.push(renderTime)
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current.shift()
    }

    // Track renders per minute
    const oneMinuteAgo = Date.now() - 60000
    renderWindowRef.current.push(Date.now())
    renderWindowRef.current = renderWindowRef.current.filter(time => time > oneMinuteAgo)

    const avgRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
    const renderCount = renderWindowRef.current.length

    setMetrics(prev => ({
      ...prev,
      renderCount: prev.renderCount + 1,
      avgRenderTime,
      lastRenderTime: renderTime,
      memoryUsage: getMemoryUsage()
    }))

    // Check for performance warnings
    if (renderTime > warningThresholds.renderTime) {
      addWarning({
        type: 'render',
        message: `Slow render: ${renderTime.toFixed(1)}ms (threshold: ${warningThresholds.renderTime}ms)`,
        severity: renderTime > warningThresholds.renderTime * 2 ? 'high' : 'medium'
      })
    }

    if (renderCount > warningThresholds.renderCount) {
      addWarning({
        type: 'render',
        message: `High render frequency: ${renderCount} renders/min (threshold: ${warningThresholds.renderCount})`,
        severity: 'medium'
      })
    }
  }, [isEnabled, warningThresholds.renderTime, warningThresholds.renderCount, addWarning, getMemoryUsage])

  // Clear warnings
  const clearWarnings = useCallback(() => {
    setWarnings([])
  }, [])

  // Generate performance report
  const getReport = useCallback((): string => {
    const report = [
      '=== Editor Performance Report ===',
      `Total Renders: ${metrics.renderCount}`,
      `Average Render Time: ${metrics.avgRenderTime.toFixed(1)}ms`,
      `Last Render Time: ${metrics.lastRenderTime.toFixed(1)}ms`,
      `Content Size: ${(metrics.contentSize / 1024).toFixed(1)}KB`,
      metrics.saveTime ? `Last Save Time: ${metrics.saveTime.toFixed(1)}ms` : 'No saves recorded',
      metrics.loadTime ? `Last Load Time: ${metrics.loadTime.toFixed(1)}ms` : 'No loads recorded',
      metrics.memoryUsage ? `Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB` : 'Memory usage unavailable',
      '',
      '=== Recent Warnings ===',
      ...warnings.map(w => `[${w.severity.toUpperCase()}] ${w.message} (${w.timestamp.toLocaleTimeString()})`),
      warnings.length === 0 ? 'No warnings' : ''
    ]

    return report.join('\n')
  }, [metrics, warnings])

  // Update content size when content changes
  useEffect(() => {
    if (!isEnabled || !content) return

    const contentSize = calculateContentSize(content)
    setMetrics(prev => ({ ...prev, contentSize }))

    if (contentSize > warningThresholds.contentSize) {
      addWarning({
        type: 'content-size',
        message: `Large content size: ${(contentSize / 1024).toFixed(1)}KB (threshold: ${(warningThresholds.contentSize / 1024).toFixed(1)}KB)`,
        severity: contentSize > warningThresholds.contentSize * 2 ? 'high' : 'medium'
      })
    }
  }, [content, isEnabled, calculateContentSize, warningThresholds.contentSize, addWarning])

  // Memory monitoring (check every 30 seconds)
  useEffect(() => {
    if (!isEnabled) return

    const interval = setInterval(() => {
      const memoryUsage = getMemoryUsage()
      if (memoryUsage) {
        setMetrics(prev => ({ ...prev, memoryUsage }))

        // Warning for high memory usage (>100MB)
        if (memoryUsage > 100 * 1024 * 1024) {
          addWarning({
            type: 'memory',
            message: `High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`,
            severity: memoryUsage > 200 * 1024 * 1024 ? 'high' : 'medium'
          })
        }
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isEnabled, getMemoryUsage, addWarning])

  // Cleanup warnings older than 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      setWarnings(prev => prev.filter(w => w.timestamp.getTime() > fiveMinutesAgo))
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return {
    metrics,
    warnings,
    startTiming,
    logRender,
    clearWarnings,
    getReport
  }
}

export default useEditorPerformance
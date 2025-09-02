'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { useEffect } from 'react'

interface WebVitalsMetric {
  id: string
  name: string
  label: string
  value: number
  attribution?: any
}

// Threshold values for good/needs improvement/poor performance
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
}

function sendToAnalytics(metric: WebVitalsMetric) {
  // Send to your analytics service
  const body = {
    id: metric.id,
    name: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    label: metric.label,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS]
    let status = 'good'
    
    if (threshold) {
      if (metric.value > threshold.poor) {
        status = 'poor'
      } else if (metric.value > threshold.good) {
        status = 'needs-improvement'
      }
    }

    // Commented out - uncomment if you need to debug web vitals
    // if (process.env.NODE_ENV === 'development') {
    //   console.log(`[Web Vitals] ${metric.name}: ${metric.value} (${status})`, body)
    // }
  }

  // In production, send to your analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to custom analytics endpoint
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch((error) => {
      console.error('Failed to send web vitals:', error)
    })

    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.value,
      })
    }
  }
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    sendToAnalytics(metric)
  })

  // Monitor performance observer for additional metrics
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 150) {
            // Only warn in development
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Performance] Long task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              })
            }
          }
        }
      })

      longTaskObserver.observe({ entryTypes: ['longtask'] })

      // Monitor resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 300) {
            console.warn('[Performance] Slow resource:', {
              name: (entry as PerformanceResourceTiming).name,
              duration: entry.duration,
              type: entry.entryType,
            })
          }
        }
      })

      resourceObserver.observe({ entryTypes: ['resource'] })

      return () => {
        longTaskObserver.disconnect()
        resourceObserver.disconnect()
      }
    } catch (error) {
      console.error('Failed to setup performance observers:', error)
    }
  }, [])

  return null
}
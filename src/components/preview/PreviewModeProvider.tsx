'use client'

import React, { createContext, useContext, ReactNode } from 'react'

export type PreviewMode = 'iframe' | 'live'

interface PreviewModeContextType {
  mode: PreviewMode
  isIframeMode: boolean
  isLiveMode: boolean
}

const PreviewModeContext = createContext<PreviewModeContextType | undefined>(undefined)

interface PreviewModeProviderProps {
  children: ReactNode
  mode: PreviewMode
}

export function PreviewModeProvider({ children, mode }: PreviewModeProviderProps) {
  const value: PreviewModeContextType = {
    mode,
    isIframeMode: mode === 'iframe',
    isLiveMode: mode === 'live'
  }
  
  return (
    <PreviewModeContext.Provider value={value}>
      {children}
    </PreviewModeContext.Provider>
  )
}

export function usePreviewMode() {
  const context = useContext(PreviewModeContext)
  if (context === undefined) {
    throw new Error('usePreviewMode must be used within a PreviewModeProvider')
  }
  return context
}

export function usePreviewModeOptional() {
  const context = useContext(PreviewModeContext)
  return context
}
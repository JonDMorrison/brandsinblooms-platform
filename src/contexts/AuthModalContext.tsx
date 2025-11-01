'use client'

/**
 * AuthModalContext
 *
 * Provides centralized authentication modal state management.
 * Allows any component (like SiteFooter) to trigger the auth modal
 * without prop drilling or redirects.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type AuthModalMode = 'signin' | 'signup'

interface AuthModalOptions {
  mode?: AuthModalMode
  returnUrl?: string
  enableEdit?: boolean
}

interface AuthModalContextValue {
  // Modal state
  isOpen: boolean
  mode: AuthModalMode
  returnUrl: string
  enableEdit: boolean

  // Actions
  openAuthModal: (options?: AuthModalOptions) => void
  closeAuthModal: () => void
  setMode: (mode: AuthModalMode) => void
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined)

interface AuthModalProviderProps {
  children: ReactNode
  defaultMode?: AuthModalMode
}

export function AuthModalProvider({
  children,
  defaultMode = 'signin'
}: AuthModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthModalMode>(defaultMode)
  const [returnUrl, setReturnUrl] = useState('/')
  const [enableEdit, setEnableEdit] = useState(false)

  const openAuthModal = useCallback((options: AuthModalOptions = {}) => {
    setMode(options.mode || 'signin')
    setReturnUrl(options.returnUrl || '/')
    setEnableEdit(options.enableEdit || false)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const value: AuthModalContextValue = {
    isOpen,
    mode,
    returnUrl,
    enableEdit,
    openAuthModal,
    closeAuthModal,
    setMode
  }

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  )
}

/**
 * Hook to access auth modal context
 * Must be used within AuthModalProvider
 */
export function useAuthModal() {
  const context = useContext(AuthModalContext)

  if (context === undefined) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }

  return context
}

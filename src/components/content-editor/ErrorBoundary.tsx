'use client'

import React, { Component, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  componentName?: string
}

function DefaultErrorFallback({ error, resetError, componentName }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {componentName ? `${componentName} Error` : 'Something went wrong'}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          {process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'An unexpected error occurred. Please try again.'
          }
        </p>
        <Button 
          onClick={resetError} 
          size="sm" 
          variant="outline"
          className="mt-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call the error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    // Reset error state when resetKeys change
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      )
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }
  }

  resetErrorBoundary = () => {
    // Clear any pending timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Render default error UI
      return (
        <DefaultErrorFallback 
          error={error} 
          resetError={this.resetErrorBoundary}
        />
      )
    }

    return children
  }
}

// Specialized error boundaries for different editor components

interface EditorErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'fallback'> {
  componentName?: string
}

export function EditorErrorBoundary({ 
  children, 
  componentName = 'Editor Component',
  ...props 
}: EditorErrorBoundaryProps) {
  return (
    <ErrorBoundary
      {...props}
      fallback={
        <Alert variant="destructive" className="m-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{componentName} Failed to Load</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-sm">
              The {componentName.toLowerCase()} encountered an error and could not be displayed.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              size="sm" 
              variant="outline"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reload Page
            </Button>
          </AlertDescription>
        </Alert>
      }
    />
  )
}

export function RichTextEditorErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  return (
    <EditorErrorBoundary componentName="Rich Text Editor" {...props}>
      {children}
    </EditorErrorBoundary>
  )
}

export function IconPickerErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  return (
    <EditorErrorBoundary componentName="Icon Picker" {...props}>
      {children}
    </EditorErrorBoundary>
  )
}

export function PreviewErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  return (
    <EditorErrorBoundary componentName="Preview" {...props}>
      {children}
    </EditorErrorBoundary>
  )
}

// Hook for easier error boundary usage
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

export default ErrorBoundary
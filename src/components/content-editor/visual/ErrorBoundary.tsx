'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { AlertTriangle, RotateCcw, Bug, RefreshCw, FileText } from 'lucide-react';
import { handleError } from '@/src/lib/types/error-handling';

/**
 * Error types specific to visual editor
 */
export enum VisualEditorErrorType {
  RENDER_ERROR = 'render_error',
  CONTENT_LOAD_ERROR = 'content_load_error',
  SAVE_ERROR = 'save_error',
  DRAG_DROP_ERROR = 'drag_drop_error',
  COMPONENT_ERROR = 'component_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Enhanced error info for visual editor
 */
export interface VisualEditorErrorInfo {
  errorType: VisualEditorErrorType;
  componentStack?: string;
  userAction?: string;
  timestamp: Date;
  errorId: string;
  context?: Record<string, unknown>;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: VisualEditorErrorInfo) => void;
  errorType?: VisualEditorErrorType;
  context?: Record<string, unknown>;
  showDetails?: boolean;
  allowRetry?: boolean;
  allowReload?: boolean;
  allowReport?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: VisualEditorErrorInfo;
  isRetrying: boolean;
  retryCount: number;
}

/**
 * Enhanced error boundary specifically designed for the visual editor
 */
export class VisualEditorErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, reactErrorInfo: React.ErrorInfo) {
    const errorInfo: VisualEditorErrorInfo = {
      errorType: this.props.errorType || VisualEditorErrorType.UNKNOWN_ERROR,
      componentStack: reactErrorInfo.componentStack,
      timestamp: new Date(),
      errorId: `ve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      context: this.props.context
    };

    this.setState({ errorInfo });

    // Log error for monitoring
    const processedError = handleError(error);
    console.error('VisualEditor Error Boundary:', {
      ...processedError,
      errorInfo,
      reactErrorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private reportError = (error: Error, errorInfo: VisualEditorErrorInfo) => {
    // This would integrate with error monitoring services like Sentry
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.log('Error reported:', { error: error.message, errorInfo });
    }
  };

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ 
      isRetrying: true,
      retryCount: this.state.retryCount + 1
    });

    // Add a small delay to prevent immediate re-error
    this.retryTimeout = setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        isRetrying: false
      });
    }, 1000);
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReport = () => {
    if (this.state.error && this.state.errorInfo) {
      const errorReport = {
        message: this.state.error.message,
        stack: this.state.error.stack,
        errorInfo: this.state.errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Copy error report to clipboard
      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
        .then(() => {
          alert('Error report copied to clipboard. Please share this with support.');
        })
        .catch(() => {
          // Fallback: open email client
          const subject = `Visual Editor Error - ${this.state.errorInfo?.errorId}`;
          const body = encodeURIComponent(JSON.stringify(errorReport, null, 2));
          window.open(`mailto:support@brandsinblooms.com?subject=${subject}&body=${body}`);
        });
    }
  };

  getErrorMessage = (): string => {
    const { error, errorInfo } = this.state;
    
    if (!error || !errorInfo) {
      return 'An unexpected error occurred in the visual editor.';
    }

    switch (errorInfo.errorType) {
      case VisualEditorErrorType.CONTENT_LOAD_ERROR:
        return 'Failed to load page content. Please check your connection and try again.';
      case VisualEditorErrorType.SAVE_ERROR:
        return 'Unable to save your changes. Your work may be lost if you reload.';
      case VisualEditorErrorType.DRAG_DROP_ERROR:
        return 'Drag and drop functionality encountered an error. Try refreshing the page.';
      case VisualEditorErrorType.COMPONENT_ERROR:
        return 'A component in the page failed to render properly.';
      case VisualEditorErrorType.NETWORK_ERROR:
        return 'Network connection error. Please check your internet connection.';
      case VisualEditorErrorType.RENDER_ERROR:
        return 'The page failed to render correctly. Some content may be missing.';
      default:
        return 'An unexpected error occurred in the visual editor.';
    }
  };

  getErrorIcon = () => {
    const { errorInfo } = this.state;
    
    switch (errorInfo?.errorType) {
      case VisualEditorErrorType.NETWORK_ERROR:
        return <RefreshCw className="h-6 w-6 text-red-600" />;
      case VisualEditorErrorType.SAVE_ERROR:
        return <FileText className="h-6 w-6 text-red-600" />;
      case VisualEditorErrorType.COMPONENT_ERROR:
      case VisualEditorErrorType.RENDER_ERROR:
        return <Bug className="h-6 w-6 text-red-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
    }
  };

  getRecoveryActions = () => {
    const { allowRetry = true, allowReload = true, allowReport = true } = this.props;
    const { retryCount, isRetrying } = this.state;
    const canRetry = allowRetry && retryCount < this.maxRetries && !isRetrying;

    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {canRetry && (
          <Button 
            onClick={this.handleRetry} 
            variant="outline"
            disabled={isRetrying}
            size="sm"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : `Try Again (${this.maxRetries - retryCount} left)`}
          </Button>
        )}
        
        {allowReload && (
          <Button onClick={this.handleReload} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
        )}
        
        {allowReport && (
          <Button onClick={this.handleReport} variant="ghost" size="sm">
            <Bug className="h-4 w-4 mr-2" />
            Report Bug
          </Button>
        )}
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { showDetails = false } = this.props;
      const { error, errorInfo } = this.state;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                {this.getErrorIcon()}
              </div>
              <CardTitle className="mt-4">Visual Editor Error</CardTitle>
              <CardDescription className="text-base">
                {this.getErrorMessage()}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {showDetails && error && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-auto">
                      <div><strong>Error:</strong> {error.message}</div>
                      {errorInfo?.errorId && (
                        <div><strong>ID:</strong> {errorInfo.errorId}</div>
                      )}
                      {errorInfo?.timestamp && (
                        <div><strong>Time:</strong> {errorInfo.timestamp.toISOString()}</div>
                      )}
                      {errorInfo?.errorType && (
                        <div><strong>Type:</strong> {errorInfo.errorType}</div>
                      )}
                    </div>
                    {error.stack && (
                      <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-auto max-h-32">
                        <strong>Stack Trace:</strong>
                        <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              {this.getRecoveryActions()}
              
              <p className="text-xs text-center text-muted-foreground">
                If this problem persists, please contact support with the error ID.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * React hook for handling errors in functional components
 */
export function useVisualEditorErrorHandler(errorType?: VisualEditorErrorType) {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error, context?: Record<string, unknown>) => {
    const errorInfo: VisualEditorErrorInfo = {
      errorType: errorType || VisualEditorErrorType.UNKNOWN_ERROR,
      timestamp: new Date(),
      errorId: `ve_hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      context
    };

    console.error('Visual Editor Hook Error:', { error, errorInfo });
    setError(error);

    // Report error
    if (process.env.NODE_ENV === 'production') {
      console.log('Error reported via hook:', { error: error.message, errorInfo });
    }
  }, [errorType]);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null
  };
}

/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withVisualEditorErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const displayName = Component.displayName || Component.name || 'Component';

  const WrappedComponent = React.forwardRef<any, T>((props, ref) => (
    <VisualEditorErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </VisualEditorErrorBoundary>
  ));

  WrappedComponent.displayName = `withVisualEditorErrorBoundary(${displayName})`;

  return WrappedComponent;
}

/**
 * Specialized error boundaries for different parts of the visual editor
 */

// Error boundary for drag and drop operations
export function DragDropErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <VisualEditorErrorBoundary
      errorType={VisualEditorErrorType.DRAG_DROP_ERROR}
      context={{ feature: 'drag-drop' }}
      showDetails={false}
    >
      {children}
    </VisualEditorErrorBoundary>
  );
}

// Error boundary for content rendering
export function ContentRenderErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <VisualEditorErrorBoundary
      errorType={VisualEditorErrorType.RENDER_ERROR}
      context={{ feature: 'content-render' }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </VisualEditorErrorBoundary>
  );
}

// Error boundary for component library
export function ComponentLibraryErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <VisualEditorErrorBoundary
      errorType={VisualEditorErrorType.COMPONENT_ERROR}
      context={{ feature: 'component-library' }}
      fallback={
        <div className="p-4 text-center text-muted-foreground">
          <Bug className="h-8 w-8 mx-auto mb-2" />
          <p>Component library temporarily unavailable</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      }
    >
      {children}
    </VisualEditorErrorBoundary>
  );
}

// Error boundary for auto-save functionality
export function AutoSaveErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <VisualEditorErrorBoundary
      errorType={VisualEditorErrorType.SAVE_ERROR}
      context={{ feature: 'auto-save' }}
      allowRetry={true}
      allowReload={false}
      showDetails={false}
    >
      {children}
    </VisualEditorErrorBoundary>
  );
}
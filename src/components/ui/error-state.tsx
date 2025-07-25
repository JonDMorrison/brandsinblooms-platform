import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  showHomeButton?: boolean
  showBackButton?: boolean
  onHome?: () => void
  onBack?: () => void
}

export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error while loading this content. Please try again.",
  actionLabel = "Try Again",
  onAction,
  showHomeButton = false,
  showBackButton = false,
  onHome,
  onBack,
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="mt-4">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {onAction && (
              <Button onClick={onAction} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                {actionLabel}
              </Button>
            )}
            {showBackButton && onBack && (
              <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            )}
            {showHomeButton && onHome && (
              <Button variant="outline" onClick={onHome} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific error states for common scenarios
export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Error"
      description="Unable to connect to the server. Please check your internet connection and try again."
      actionLabel="Retry"
      onAction={onRetry}
    />
  )
}

export function NotFoundErrorState({ onHome }: { onHome?: () => void }) {
  return (
    <ErrorState
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved."
      actionLabel="Go Home"
      onAction={onHome}
      showHomeButton={true}
      onHome={onHome}
    />
  )
}

export function UnauthorizedErrorState({ onSignIn }: { onSignIn?: () => void }) {
  return (
    <ErrorState
      title="Access Denied"
      description="You don't have permission to access this resource. Please sign in or contact support."
      actionLabel="Sign In"
      onAction={onSignIn}
    />
  )
}

export function ServerErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Server Error"
      description="Our servers are experiencing issues. Please try again in a few moments."
      actionLabel="Try Again"
      onAction={onRetry}
    />
  )
}
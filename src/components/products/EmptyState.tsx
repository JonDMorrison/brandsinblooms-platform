import { LucideIcon } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-gray-100 p-6">
          <Icon className="h-12 w-12 text-gray-400" />
        </div>
      )}

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-500 text-center max-w-md mb-6">
          {description}
        </p>
      )}

      {(actionLabel && (actionHref || onAction)) && (
        <Button
          onClick={onAction}
          asChild={!!actionHref}
        >
          {actionHref ? (
            <a href={actionHref}>{actionLabel}</a>
          ) : (
            <span>{actionLabel}</span>
          )}
        </Button>
      )}
    </div>
  )
}

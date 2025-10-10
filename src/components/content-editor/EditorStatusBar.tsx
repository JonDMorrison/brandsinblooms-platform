type LayoutType = 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact' | 'other'
type ViewportSize = 'mobile' | 'tablet' | 'desktop'

const layoutInfo = {
  landing: { name: 'Landing Page' },
  blog: { name: 'Blog Article' },
  portfolio: { name: 'Portfolio Grid' },
  about: { name: 'About/Company' },
  product: { name: 'Product Page' },
  contact: { name: 'Contact/Services' },
  other: { name: 'Custom/Other' }
}

const viewportSizes = {
  mobile: { label: 'Mobile' },
  tablet: { label: 'Tablet' },
  desktop: { label: 'Desktop' }
}

/**
 * Format a timestamp for display in the status bar
 * Returns user-friendly relative or absolute time
 */
function formatLastSaved(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  // Just now (< 1 minute)
  if (diffMinutes < 1) {
    return 'Just now'
  }

  // Minutes ago (< 1 hour)
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  }

  // Hours ago (< 24 hours, same day)
  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  // Yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  }

  // This week (< 7 days)
  if (diffDays < 7) {
    return `${date.toLocaleDateString([], { weekday: 'short' })} at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  }

  // Older dates
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

interface EditorStatusBarProps {
  layout: LayoutType
  activeViewport: ViewportSize
  hasUnsavedChanges: boolean
  lastSaved?: Date | null
}

export function EditorStatusBar({
  layout,
  activeViewport,
  hasUnsavedChanges,
  lastSaved
}: EditorStatusBarProps) {
  const validLayout = layout in layoutInfo ? layout : 'landing'

  return (
    <div className="border-t bg-muted/30 px-6 py-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="font-medium">{layoutInfo[validLayout].name}</span>
          <span className="text-gray-500/50">•</span>
          <span>{viewportSizes[activeViewport].label} View</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Last saved: {lastSaved ? formatLastSaved(lastSaved) : 'Never'}</span>
          {hasUnsavedChanges && (
            <>
              <span className="text-gray-500/50">•</span>
              <span className="text-orange-600">Unsaved changes</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
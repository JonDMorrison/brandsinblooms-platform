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

interface EditorStatusBarProps {
  layout: LayoutType
  activeViewport: ViewportSize
  hasUnsavedChanges: boolean
}

export function EditorStatusBar({ 
  layout, 
  activeViewport, 
  hasUnsavedChanges 
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
          <span>Last saved: Never</span>
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
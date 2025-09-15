'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { 
  Globe,
  Hash,
  X
} from 'lucide-react'
import { SEOSettings } from '@/src/lib/content/schema'

interface SEOTabProps {
  seoSettings: SEOSettings
  onSEOChange: (settings: SEOSettings) => void
  pageTitle?: string
  slug?: string
}

export function SEOTab({ seoSettings, onSEOChange, pageTitle, slug }: SEOTabProps) {
  const [newKeyword, setNewKeyword] = useState('')

  // Character count limits
  const TITLE_LIMIT = 60
  const DESCRIPTION_LIMIT = 160

  const handleFieldChange = (field: keyof SEOSettings, value: any) => {
    onSEOChange({
      ...seoSettings,
      [field]: value
    })
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !seoSettings.keywords?.includes(newKeyword.trim())) {
      const updatedKeywords = [...(seoSettings.keywords || []), newKeyword.trim()]
      handleFieldChange('keywords', updatedKeywords)
      setNewKeyword('')
    }
  }

  const removeKeyword = (index: number) => {
    const updatedKeywords = seoSettings.keywords?.filter((_, i) => i !== index) || []
    handleFieldChange('keywords', updatedKeywords)
  }

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }
  }

  // Auto-populate SEO title from page title if empty
  useEffect(() => {
    if (!seoSettings.title && pageTitle) {
      handleFieldChange('title', pageTitle)
    }
  }, [pageTitle])

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Search Engine Optimization
        </h3>

        {/* SEO Title */}
        <div className="space-y-2">
          <Label htmlFor="seo-title" className="text-xs font-medium">
            SEO Title
          </Label>
          <Input
            id="seo-title"
            type="text"
            value={seoSettings.title || ''}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="h-8"
            placeholder="Enter SEO title"
            maxLength={TITLE_LIMIT + 20} // Allow slight overflow
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              This title appears in search results
            </p>
            <Badge 
              variant={seoSettings.title?.length > TITLE_LIMIT ? "destructive" : "secondary"}
              className="text-xs"
            >
              {(seoSettings.title?.length || 0)}/{TITLE_LIMIT}
            </Badge>
          </div>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <Label htmlFor="seo-description" className="text-xs font-medium">
            Meta Description
          </Label>
          <Textarea
            id="seo-description"
            value={seoSettings.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="min-h-[60px] resize-none"
            placeholder="Enter meta description"
            maxLength={DESCRIPTION_LIMIT + 40} // Allow slight overflow
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Brief description shown in search results
            </p>
            <Badge 
              variant={seoSettings.description?.length > DESCRIPTION_LIMIT ? "destructive" : "secondary"}
              className="text-xs"
            >
              {(seoSettings.description?.length || 0)}/{DESCRIPTION_LIMIT}
            </Badge>
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label htmlFor="seo-keywords" className="text-xs font-medium">
            Keywords
          </Label>
          <div className="flex gap-2">
            <Input
              id="seo-keywords"
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={handleKeywordKeyPress}
              className="h-8 flex-1"
              placeholder="Add keyword and press Enter"
            />
            <Button
              type="button"
              size="sm"
              onClick={addKeyword}
              disabled={!newKeyword.trim()}
              className="h-8"
            >
              <Hash className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Keywords display */}
          {seoSettings.keywords && seoSettings.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {seoSettings.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Add relevant keywords for search optimization
          </p>
        </div>

        {/* Search Preview */}
        <div className="border rounded-lg p-3 bg-muted/30">
          <p className="text-xs font-medium mb-2">Search Preview</p>
          <div className="space-y-1">
            <div className="text-sm text-blue-600 hover:underline cursor-pointer line-clamp-1">
              {seoSettings.title || pageTitle || 'Page Title'}
            </div>
            <div className="text-xs text-green-600">
              {process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3001'}/{slug || 'page-url'}
            </div>
            <div className="text-xs text-gray-600 line-clamp-2">
              {seoSettings.description || 'Meta description will appear here...'}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
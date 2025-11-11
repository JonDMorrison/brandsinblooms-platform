'use client'

/**
 * Section Settings Modal
 * Modal for editing section-level settings (background color, etc.) and managing items in Full Site Editor
 * Integrates with existing settings structure from ContentSection schema
 */

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Slider } from '@/src/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { ContentSection } from '@/src/lib/content/schema'
import { Settings, Upload, X, Palette, List, Loader2, Cloud } from 'lucide-react'
import { getAvailableBackgrounds } from '@/src/lib/content/section-backgrounds'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { toast } from 'sonner'
import { handleError } from '@/src/lib/types/error-handling'
import { FeaturesItemManager } from './item-managers/FeaturesItemManager'
import { ValuesItemManager } from './item-managers/ValuesItemManager'
import { FAQItemManager } from './item-managers/FAQItemManager'
import { HeroFeaturesItemManager } from './item-managers/HeroFeaturesItemManager'
import { FeaturedItemManager } from './item-managers/FeaturedItemManager'
import { CategoriesItemManager } from './item-managers/CategoriesItemManager'

interface SectionSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  section: ContentSection
  sectionKey: string
  onSave: (settings: Record<string, unknown>, options?: { silent?: boolean }) => void
  onAddItem?: (sectionKey: string, newItem: Record<string, unknown>) => void
  onDeleteItem?: (sectionKey: string, itemIndex: number) => void
  onDataUpdate?: (updates: Record<string, unknown>) => void
}

type BackgroundColor = 'default' | 'alternate' | 'primary' | 'gradient' | 'image'

interface BackgroundImageSettings {
  url: string
  position: string
  opacity: number
  scale: number
}

export function SectionSettingsModal({
  isOpen,
  onClose,
  section,
  sectionKey,
  onSave,
  onAddItem,
  onDeleteItem,
  onDataUpdate
}: SectionSettingsModalProps) {
  const { currentSite } = useSiteContext()
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColor>('default')
  const [backgroundImage, setBackgroundImage] = useState<BackgroundImageSettings>({
    url: '',
    position: 'center',
    opacity: 100,
    scale: 100
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const originalSettingsRef = useRef<Record<string, unknown> | null>(null)

  // Determine if section supports item management
  const supportsItemManagement = ['features', 'values', 'faq', 'hero', 'featured', 'categories'].includes(section.type)

  // Default item templates for each section type
  const getDefaultItem = () => {
    switch (section.type) {
      case 'features':
        return {
          id: `feature-${Date.now()}`,
          icon: 'Check',
          title: 'New Feature'
        }
      case 'hero':
        return {
          id: `feature-${Date.now()}`,
          icon: 'Check',
          text: 'New Feature',
          title: 'New Feature'
        }
      case 'values':
        return {
          id: `value-${Date.now()}`,
          icon: 'Star',
          title: 'New Value',
          description: 'Describe this value...'
        }
      case 'faq':
        return {
          id: `faq-${Date.now()}`,
          question: 'New Question',
          answer: 'Answer here...'
        }
      case 'featured':
        return {
          id: `featured-${Date.now()}`,
          title: 'New Featured Item',
          image: '',
          tag: 'New',
          link: ''
        }
      case 'categories':
        return {
          id: `category-${Date.now()}`,
          name: 'New Category',
          image: '',
          link: '',
          plantCount: 0,
          description: ''
        }
      default:
        return {}
    }
  }

  // Handle add item
  const handleAddItem = () => {
    if (!onAddItem) return
    const newItem = getDefaultItem()
    onAddItem(sectionKey, newItem)
  }

  // Handle delete item
  const handleDeleteItem = (itemIndex: number) => {
    if (!onDeleteItem) return
    onDeleteItem(sectionKey, itemIndex)
  }

  // Initialize from section settings when modal opens
  useEffect(() => {
    if (isOpen) {
      // Store original settings for cancel/restore
      if (!originalSettingsRef.current) {
        originalSettingsRef.current = section.settings ? { ...section.settings } : {}
      }

      const currentBg = (section.settings?.backgroundColor as BackgroundColor) || 'default'
      setBackgroundColor(currentBg)

      // Initialize image settings if they exist
      if (section.settings?.backgroundImage) {
        const imgSettings = section.settings.backgroundImage as BackgroundImageSettings
        setBackgroundImage({
          url: imgSettings.url || '',
          position: imgSettings.position || 'center',
          opacity: imgSettings.opacity ?? 100,
          scale: imgSettings.scale ?? 100
        })
      } else {
        setBackgroundImage({
          url: '',
          position: 'center',
          opacity: 100,
          scale: 100
        })
      }
    } else {
      // Clear original settings when modal closes
      originalSettingsRef.current = null
    }
  }, [isOpen, section.settings])

  // Apply settings immediately for live preview (silently)
  const applySettingsPreview = (newBgColor: BackgroundColor, newBgImage: BackgroundImageSettings) => {
    const newSettings: Record<string, unknown> = {
      ...section.settings,
      backgroundColor: newBgColor
    }

    // Only include backgroundImage if using image background and URL exists
    if (newBgColor === 'image' && newBgImage.url) {
      newSettings.backgroundImage = newBgImage
    }

    onSave(newSettings, { silent: true }) // Silent during live preview
  }

  const handleSave = () => {
    // Changes already applied via live preview, show single confirmation toast
    toast.success('Section settings updated')
    originalSettingsRef.current = null
    onClose()
  }

  const handleCancel = () => {
    // Restore original settings silently
    if (originalSettingsRef.current) {
      onSave(originalSettingsRef.current, { silent: true })
    }

    // Reset local state to original
    const currentBg = (originalSettingsRef.current?.backgroundColor as BackgroundColor) || 'default'
    setBackgroundColor(currentBg)
    if (originalSettingsRef.current?.backgroundImage) {
      const imgSettings = originalSettingsRef.current.backgroundImage as BackgroundImageSettings
      setBackgroundImage({
        url: imgSettings.url || '',
        position: imgSettings.position || 'center',
        opacity: imgSettings.opacity ?? 100,
        scale: imgSettings.scale ?? 100
      })
    } else {
      setBackgroundImage({
        url: '',
        position: 'center',
        opacity: 100,
        scale: 100
      })
    }

    originalSettingsRef.current = null
    onClose()
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    if (!currentSite?.id) {
      toast.error('Site not found')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    try {
      const response = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          siteId: currentSite.id,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Failed to get upload URL:', error)
        throw new Error('Failed to get upload URL')
      }

      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('Invalid presigned URL response')
      }

      const { uploadUrl, publicUrl } = result.data

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Upload failed:', uploadResponse.status, errorText)
        throw new Error(`Failed to upload file: ${uploadResponse.status}`)
      }

      setUploadProgress(100)
      setBackgroundImage(prev => ({ ...prev, url: publicUrl }))
      toast.success('Background image uploaded successfully')
    } catch (error) {
      handleError(error)
      toast.error('Failed to upload background image')
    } finally {
      setIsUploading(false)
      clearInterval(progressInterval)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleRemoveImage = () => {
    setBackgroundImage({
      url: '',
      position: 'center',
      opacity: 100,
      scale: 100
    })
  }

  // Get section name for display
  const getSectionName = () => {
    return sectionKey
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Background color options with descriptions
  const allBackgroundOptions: Array<{
    value: BackgroundColor
    label: string
    description: string
    previewStyle: React.CSSProperties
  }> = [
    {
      value: 'default',
      label: 'Default',
      description: 'Standard background',
      previewStyle: { backgroundColor: 'var(--theme-background)' }
    },
    {
      value: 'alternate',
      label: 'Alternate',
      description: 'Subtle contrast',
      previewStyle: { backgroundColor: 'rgba(var(--theme-primary-rgb), 0.03)' }
    },
    {
      value: 'primary',
      label: 'Bold',
      description: 'Primary color',
      previewStyle: { backgroundColor: 'var(--theme-primary)' }
    },
    {
      value: 'gradient',
      label: 'Gradient',
      description: 'Subtle gradient',
      previewStyle: {
        background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-secondary-rgb), 0.1))'
      }
    },
    {
      value: 'image',
      label: 'Image',
      description: 'Custom image',
      previewStyle: {
        backgroundColor: '#f3f4f6',
        backgroundImage: backgroundImage.url ? `url(${backgroundImage.url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    }
  ]

  // Position options for image background
  const positionOptions = [
    { value: 'center', label: 'Center' },
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' }
  ]

  // Filter options based on section type
  const availableBackgroundTypes = getAvailableBackgrounds(section.type)
  const backgroundOptions = allBackgroundOptions.filter(option =>
    availableBackgroundTypes.includes(option.value)
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
        <div className="p-4 sm:p-6 border-b flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            Section Settings
          </DialogTitle>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {getSectionName()}
          </p>
        </div>

        <div className="overflow-y-auto flex-1">
          {supportsItemManagement ? (
            <Tabs defaultValue="appearance" className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-gray-50">
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Appearance</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
              </TabsList>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="p-4 sm:p-6 space-y-4 sm:space-y-5 m-0">
          {/* Background Color Selection */}
          <div className="space-y-3">
            <Label className="text-xs sm:text-sm font-medium">Background Color</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {backgroundOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-2 border-2 rounded-md cursor-pointer transition-all ${
                    backgroundColor === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="backgroundColor"
                    value={option.value}
                    checked={backgroundColor === option.value}
                    onChange={() => {
                      setBackgroundColor(option.value)
                      applySettingsPreview(option.value, backgroundImage)
                    }}
                    className="sr-only"
                  />
                  <div
                    className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
                    style={option.previewStyle}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Image Background Controls - Only show when Image is selected */}
          {backgroundColor === 'image' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <Label className="text-sm font-medium">Image Settings</Label>

              {/* Image Upload/Preview */}
              <div className="space-y-2">
                {backgroundImage.url ? (
                  <div className="relative">
                    <div
                      className="w-full h-32 rounded border bg-cover bg-center"
                      style={{ backgroundImage: `url(${backgroundImage.url})` }}
                    />

                    {/* Loading overlay during upload */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded">
                        <Cloud className="h-8 w-8 text-white animate-pulse mb-2" />
                        <p className="text-sm font-medium text-white mb-2">Uploading...</p>
                        <div className="w-3/4 h-2 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-white/80 mt-1">{Math.round(uploadProgress)}%</p>
                      </div>
                    )}

                    {!isUploading && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {isUploading ? 'Uploading...' : 'Change Image'}
                    </Button>
                  </div>
                ) : (
                  <div
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs">Uploading... {uploadProgress}%</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm font-medium">Click to upload image</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Position Dropdown */}
              {backgroundImage.url && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">Position</Label>
                    <select
                      value={backgroundImage.position}
                      onChange={(e) => {
                        const newImage = { ...backgroundImage, position: e.target.value }
                        setBackgroundImage(newImage)
                        applySettingsPreview(backgroundColor, newImage)
                      }}
                      className="w-full p-2 border rounded text-sm"
                    >
                      {positionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Opacity</Label>
                      <span className="text-xs text-gray-600">{backgroundImage.opacity}%</span>
                    </div>
                    <Slider
                      value={[backgroundImage.opacity]}
                      onValueChange={(value) => {
                        const newImage = { ...backgroundImage, opacity: value[0] }
                        setBackgroundImage(newImage)
                        applySettingsPreview(backgroundColor, newImage)
                      }}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Zoom/Crop Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Zoom/Crop</Label>
                      <span className="text-xs text-gray-600">{backgroundImage.scale}%</span>
                    </div>
                    <Slider
                      value={[backgroundImage.scale]}
                      onValueChange={(value) => {
                        const newImage = { ...backgroundImage, scale: value[0] }
                        setBackgroundImage(newImage)
                        applySettingsPreview(backgroundColor, newImage)
                      }}
                      max={200}
                      min={100}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          )}

                {/* Preview Note */}
                <div className="p-2.5 sm:p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Tip:</strong> Changes will be applied immediately when you save. Use Navigate mode to preview the section without editing controls.
                  </p>
                </div>
              </TabsContent>

              {/* Content Tab - Item Management */}
              <TabsContent value="content" className="p-4 sm:p-6 m-0">
                {section.type === 'features' && (
                  <FeaturesItemManager
                    section={section}
                    sectionKey={sectionKey}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                  />
                )}
                {section.type === 'hero' && (
                  <HeroFeaturesItemManager
                    section={section}
                    sectionKey={sectionKey}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                  />
                )}
                {section.type === 'values' && (
                  <ValuesItemManager
                    section={section}
                    sectionKey={sectionKey}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                  />
                )}
                {section.type === 'faq' && (
                  <FAQItemManager
                    section={section}
                    sectionKey={sectionKey}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                  />
                )}
                {section.type === 'featured' && (
                  <FeaturedItemManager
                    section={section}
                    sectionKey={sectionKey}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                    onDataUpdate={onDataUpdate}
                  />
                )}
                {section.type === 'categories' && (
                  <CategoriesItemManager
                    section={section}
                    sectionKey={sectionKey}
                    onAdd={handleAddItem}
                    onDelete={handleDeleteItem}
                  />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            /* No tabs - just appearance settings for sections without item management */
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Background Color Selection */}
              <div className="space-y-3">
                <Label className="text-xs sm:text-sm font-medium">Background Color</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {backgroundOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-2 border-2 rounded-md cursor-pointer transition-all ${
                        backgroundColor === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="backgroundColor"
                        value={option.value}
                        checked={backgroundColor === option.value}
                        onChange={() => {
                          setBackgroundColor(option.value)
                          applySettingsPreview(option.value, backgroundImage)
                        }}
                        className="sr-only"
                      />
                      <div
                        className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
                        style={option.previewStyle}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duplicate image background controls if needed */}
              {backgroundColor === 'image' && backgroundImage.url && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <Label className="text-sm font-medium">Image Settings</Label>
                  {/* Add simplified image controls here if needed for non-tab mode */}
                </div>
              )}

              {/* Preview Note */}
              <div className="p-2.5 sm:p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Changes will be applied immediately when you save.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 sm:p-6 border-t bg-gray-50 flex justify-end gap-2 sm:gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="text-sm"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

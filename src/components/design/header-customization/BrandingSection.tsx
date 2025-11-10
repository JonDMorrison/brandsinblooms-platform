'use client'

import { Upload, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useState, useRef } from 'react'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Slider } from '@/src/components/ui/slider'
import { Card, CardContent } from '@/src/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
import { cn } from '@/src/lib/utils'
import { toast } from 'sonner'
import { useSupabase } from '@/hooks/useSupabase'
import { useSiteId } from '@/contexts/SiteContext'
import { handleError } from '@/src/lib/types/error-handling'
import { HeaderCustomizationProps, BrandingType } from './types'

interface BrandingSectionProps extends Pick<HeaderCustomizationProps, 'value' | 'onChange'> {
  localBrandText: string
  setLocalBrandText: (text: string) => void
  logoSize: number[]
  setLogoSize: (size: number[]) => void
  brandingType: BrandingType
  setBrandingType: (type: BrandingType) => void
  isUploadModalOpen: boolean
  setIsUploadModalOpen: (open: boolean) => void
  isUploading: boolean
  setIsUploading: (uploading: boolean) => void
  uploadProgress: number
  setUploadProgress: (progress: number) => void
  debouncedBrandTextChange: (text: string) => void
  debouncedLogoSizeChange: (size: number) => void
}

export function BrandingSection({
  value,
  onChange,
  localBrandText,
  setLocalBrandText,
  logoSize,
  setLogoSize,
  brandingType,
  setBrandingType,
  isUploadModalOpen,
  setIsUploadModalOpen,
  isUploading,
  setIsUploading,
  uploadProgress,
  setUploadProgress,
  debouncedBrandTextChange,
  debouncedLogoSizeChange
}: BrandingSectionProps) {
  const [logoOpen, setLogoOpen] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = useSupabase()
  const siteId = useSiteId()

  const handleLogoChange = (key: string, val: any) => {
    onChange({
      ...value,
      logo: {
        ...value.logo,
        [key]: val
      }
    })
    // Toast notifications removed - let the modal handle success feedback
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
      if (!siteId) {
        throw new Error('No site ID available')
      }

      const response = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          siteId,
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
      handleLogoChange('url', publicUrl)
      toast.success('Logo uploaded successfully')
      setIsUploadModalOpen(false)
    } catch (error) {
      handleError(error)
      toast.error('Failed to upload logo')
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

  return (
    <Collapsible open={logoOpen} onOpenChange={setLogoOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
        >
          <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Logo & Branding
          </Label>
          {logoOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Branding Display</Label>
            <RadioGroup
              value={brandingType}
              onValueChange={(val: BrandingType) => {
                setBrandingType(val)
                handleLogoChange('displayType', val)
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
                  brandingType === 'text' ? "ring-2 ring-primary ring-offset-2" : ""
                )}
                onClick={() => {
                  setBrandingType('text')
                  handleLogoChange('displayType', 'text')
                }}
              >
                <CardContent className="p-3">
                  <RadioGroupItem value="text" className="sr-only" />
                  <div className="text-center">
                    <div className="font-medium text-sm">Text Only</div>
                    <div className="text-xs text-muted-foreground mt-1">Brand name only</div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
                  brandingType === 'logo' ? "ring-2 ring-primary ring-offset-2" : ""
                )}
                onClick={() => {
                  setBrandingType('logo')
                  handleLogoChange('displayType', 'logo')
                }}
              >
                <CardContent className="p-3">
                  <RadioGroupItem value="logo" className="sr-only" />
                  <div className="text-center">
                    <div className="font-medium text-sm">Logo Only</div>
                    <div className="text-xs text-muted-foreground mt-1">Image logo only</div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
                  brandingType === 'both' ? "ring-2 ring-primary ring-offset-2" : ""
                )}
                onClick={() => {
                  setBrandingType('both')
                  handleLogoChange('displayType', 'both')
                }}
              >
                <CardContent className="p-3">
                  <RadioGroupItem value="both" className="sr-only" />
                  <div className="text-center">
                    <div className="font-medium text-sm">Logo + Text</div>
                    <div className="text-xs text-muted-foreground mt-1">Both together</div>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div></div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Brand Text</Label>
                <Input
                  placeholder="Enter your brand name"
                  value={localBrandText}
                  onChange={(e) => {
                    setLocalBrandText(e.target.value)
                    debouncedBrandTextChange(e.target.value)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Logo Size</Label>
                <div>
                  <Slider
                    value={logoSize}
                    onValueChange={(val) => {
                      setLogoSize(val)
                      debouncedLogoSizeChange(val[0])
                    }}
                    max={120}
                    min={20}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>20px</span>
                    <span>{logoSize[0]}px</span>
                    <span>120px</span>
                  </div>
                </div>
              </div>
            </div>
            <div></div>
          </div>
          
          <div className="space-y-3">
            {value.logo?.url ? (
              <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-gray-50">
                <div 
                  className="bg-white rounded p-3 border shadow-sm flex items-center justify-center"
                  style={{ width: `auto`, height: `150px` }}
                >
                  <img 
                    src={value.logo.url} 
                    alt="Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Upload className="h-3 w-3 mr-1" />
                      Change Logo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Upload Logo</DialogTitle>
                      <DialogDescription>
                        Choose a new logo for your header
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {isUploading ? (
                        <div className="space-y-3 p-8 text-center">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium">Click to upload logo</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
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
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Upload Logo</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Logo</DialogTitle>
                    <DialogDescription>
                      Choose a logo for your header
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {isUploading ? (
                      <div className="space-y-3 p-8 text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium">Click to upload logo</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
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
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
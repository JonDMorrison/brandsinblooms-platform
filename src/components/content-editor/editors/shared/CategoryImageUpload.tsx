/**
 * Category Image Upload Component
 * Single image upload for category cards with S3 storage
 */

import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import { toast } from 'sonner'
import { Upload, X, Image as ImageIcon, Cloud } from 'lucide-react'

interface CategoryImageUploadProps {
  imageUrl: string | null
  onImageChange: (url: string, s3Key?: string) => void
  siteId: string
  disabled?: boolean
  categoryId?: string
}

export function CategoryImageUpload({
  imageUrl,
  onImageChange,
  siteId,
  disabled = false,
  categoryId
}: CategoryImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload file to S3 using presigned URL
  const uploadToS3 = async (file: File): Promise<{ url: string; s3Key: string } | null> => {
    try {
      // Request presigned URL from API
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
          categoryId: categoryId || 'category'
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

      const { uploadUrl, key, publicUrl } = result.data

      // Upload file to S3
      setUploadProgress(50)

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
      return { url: publicUrl, s3Key: key }
    } catch (error) {
      console.error('S3 upload error:', error)
      return null
    }
  }

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || disabled) return

    const file = e.target.files[0]

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const result = await uploadToS3(file)

      if (result) {
        onImageChange(result.url, result.s3Key)
        toast.success('Image uploaded successfully')
        setImageError(false)
      } else {
        toast.error('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }

    // Clear input
    e.target.value = ''
  }

  // Handle drag and drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    )

    if (files.length === 0) {
      toast.error('Please drop an image file')
      return
    }

    // Create fake event to reuse handler
    const fakeEvent = {
      target: { files: [files[0]] },
    } as React.ChangeEvent<HTMLInputElement>

    await handleFileSelect(fakeEvent)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleRemove = () => {
    onImageChange('', undefined)
    setImageError(false)
    toast.info('Image removed')
  }

  // If image exists, show preview with remove button
  if (imageUrl) {
    return (
      <div className="space-y-2">
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-muted">
            {imageError ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Failed to load image</p>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt="Category"
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            )}

            {/* Remove button overlay */}
            {!disabled && (
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemove}
                  className="h-8 w-8 p-0 shadow-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Change image button */}
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="h-3 w-3 mr-2" />
            Change Image
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
      </div>
    )
  }

  // No image - show upload area
  return (
    <div className="space-y-2">
      <Card
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />

          {isUploading ? (
            <div className="w-full space-y-3">
              <Cloud className="h-10 w-10 mx-auto text-primary animate-pulse" />
              <p className="text-sm font-medium">Uploading to S3...</p>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
            </div>
          ) : (
            <>
              <Upload className={`h-10 w-10 mb-3 ${isDragOver ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium mb-1">
                {isDragOver ? 'Drop image here' : 'Upload Image'}
              </p>
              <p className="text-xs text-muted-foreground">
                Click or drag to upload
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground mt-2">
                <span>JPG, PNG, WebP</span>
                <span>•</span>
                <span>Max 5MB</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

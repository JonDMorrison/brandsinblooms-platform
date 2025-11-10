'use client';

/**
 * Image upload dialog for rich text editor
 * Supports both file upload to S3 and URL input
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useImageUpload } from '@/hooks/useImageUpload';

export interface ImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, alt: string) => void;
  siteId: string;
}

export function ImageUploadDialog({
  isOpen,
  onClose,
  onInsert,
  siteId,
}: ImageUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isUploading,
    progress,
    error: uploadError,
    uploadedUrl,
    uploadImage,
    reset: resetUpload,
  } = useImageUpload({
    siteId,
    resourceType: 'content',
    resourceId: 'editor',
  });

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAltText('');
    setImageUrl('');
    setUrlError(null);
    resetUpload();
    onClose();
  }, [onClose, resetUpload]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setUrlError('Please select an image file');
      return;
    }

    setSelectedFile(file);
    setUrlError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle upload button click
  const handleUploadClick = useCallback(async () => {
    if (!selectedFile) return;

    const result = await uploadImage(selectedFile);

    if (result.success && result.cdnUrl) {
      // Auto-insert after successful upload if alt text is provided
      if (altText.trim()) {
        onInsert(result.cdnUrl, altText);
        handleClose();
      }
    }
  }, [selectedFile, uploadImage, altText, onInsert, handleClose]);

  // Validate URL
  const validateImageUrl = useCallback((url: string): boolean => {
    if (!url.trim()) {
      setUrlError(null);
      return false;
    }

    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setUrlError('URL must use http or https protocol');
        return false;
      }
      setUrlError(null);
      return true;
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
  }, []);

  // Handle URL input change
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    if (url.trim()) {
      validateImageUrl(url);
    } else {
      setUrlError(null);
    }
  }, [validateImageUrl]);

  // Handle insert from URL
  const handleInsertFromUrl = useCallback(() => {
    if (validateImageUrl(imageUrl) && altText.trim()) {
      onInsert(imageUrl, altText);
      handleClose();
    } else if (!altText.trim()) {
      setUrlError('Please provide alt text for accessibility');
    }
  }, [imageUrl, altText, validateImageUrl, onInsert, handleClose]);

  // Handle insert uploaded image
  const handleInsertUploaded = useCallback(() => {
    if (uploadedUrl && altText.trim()) {
      onInsert(uploadedUrl, altText);
      handleClose();
    }
  }, [uploadedUrl, altText, onInsert, handleClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            {/* File Upload Area */}
            {!selectedFile && !uploadedUrl && (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Drag and drop an image, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF, WebP up to 100MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}

            {/* File Selected */}
            {selectedFile && !uploadedUrl && (
              <div className="space-y-4">
                <div className="relative border rounded-lg p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      resetUpload();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {previewUrl && (
                    <div className="flex items-center gap-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uploading...</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Upload Success */}
            {uploadedUrl && (
              <div className="space-y-4">
                <Alert>
                  <ImageIcon className="h-4 w-4" />
                  <AlertDescription>
                    Image uploaded successfully! Add alt text and click Insert.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg p-4">
                  <img
                    src={uploadedUrl}
                    alt="Uploaded"
                    className="w-full h-auto max-h-48 object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* Alt Text */}
            <div className="space-y-2">
              <Label htmlFor="upload-alt">
                Alt Text <span className="text-destructive">*</span>
              </Label>
              <Input
                id="upload-alt"
                placeholder="Describe the image for accessibility..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Required for screen readers and accessibility
              </p>
            </div>
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">
                Image URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={handleUrlChange}
              />
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
            </div>

            {imageUrl && !urlError && (
              <div className="border rounded-lg p-4">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-48 object-contain rounded"
                  onError={() => setUrlError('Failed to load image from URL')}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="url-alt">
                Alt Text <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url-alt"
                placeholder="Describe the image for accessibility..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for screen readers and accessibility
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>

          {selectedFile && !uploadedUrl && (
            <Button
              onClick={handleUploadClick}
              disabled={isUploading || !altText.trim()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Insert
                </>
              )}
            </Button>
          )}

          {uploadedUrl && (
            <Button onClick={handleInsertUploaded} disabled={!altText.trim()}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Insert Image
            </Button>
          )}

          {imageUrl && !selectedFile && (
            <Button
              onClick={handleInsertFromUrl}
              disabled={!!urlError || !altText.trim()}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Insert Image
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

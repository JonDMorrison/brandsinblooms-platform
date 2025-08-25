'use client';

import { useState, useCallback, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { toast } from 'sonner';
import {
  Upload,
  X,
  Image as ImageIcon,
  GripVertical,
  Star,
  AlertCircle,
  Loader2,
  Edit3,
  Check,
  Cloud,
} from 'lucide-react';
import { ProductImage as ProductImageComponent } from '@/src/components/ui/product-image';
import { formatFileSize } from '@/lib/utils';

/**
 * Product image data structure
 */
export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string | null;
  caption?: string | null;
  position: number;
  is_primary: boolean;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  filename?: string;
  cdn_url?: string;
  s3_key?: string;
  storage_type?: 's3' | 'local';
  size_bytes?: number;
}

interface ImageUploadS3Props {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  productId: string;
  siteId: string;
  maxImages?: number;
  disabled?: boolean;
}

/**
 * Sortable image item component
 */
function SortableImageItem({
  image,
  onRemove,
  onSetPrimary,
  onUpdateAlt,
  disabled,
  children,
}: {
  image: ProductImage;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onUpdateAlt: (id: string, altText: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [altText, setAltText] = useState(image.alt_text || '');
  const [imageError, setImageError] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveAlt = () => {
    onUpdateAlt(image.id, altText);
    setIsEditing(false);
    toast.success('Alt text updated');
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(image.id);
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Card className="overflow-hidden">
        <div className="relative aspect-square bg-muted">
          {/* Use simple img tag for debugging */}
          {imageError ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load image</p>
              <p className="text-xs text-muted-foreground mt-1 break-all">{image.url}</p>
            </div>
          ) : (
            <img
              src={image.url}
              alt={image.alt_text || ''}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                setImageError(true);
              }}
              onLoad={() => {
                // Image loaded successfully
              }}
            />
          )}
          
          {/* Primary badge */}
          {image.is_primary && (
            <Badge className="absolute top-2 left-2 bg-primary">
              <Star className="h-3 w-3 mr-1" />
              Primary
            </Badge>
          )}

          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-md cursor-move hover:bg-background transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Actions overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {!image.is_primary && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onSetPrimary(image.id)}
                disabled={disabled}
              >
                <Star className="h-4 w-4 mr-1" />
                Set Primary
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-3 space-y-2">
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Alt text"
                className="h-8 text-sm"
                disabled={disabled}
              />
              <Button
                size="sm"
                onClick={handleSaveAlt}
                disabled={disabled}
                className="h-8 px-2"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground truncate flex-1">
                {image.alt_text || 'No alt text'}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                disabled={disabled}
                className="h-6 px-2"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
          )}

          {image.filename && (
            <p className="text-xs text-muted-foreground truncate">
              {image.filename}
            </p>
          )}

          {image.size && (
            <p className="text-xs text-muted-foreground">
              {formatFileSize(image.size)}
            </p>
          )}

          {image.width && image.height && (
            <p className="text-xs text-muted-foreground">
              {image.width} × {image.height}px
            </p>
          )}

          {/* Storage info */}
          {image.storage_type === 's3' && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Cloud className="h-3 w-3" />
              <span>S3</span>
            </div>
          )}
        </CardContent>
      </Card>
      {children}
    </div>
  );
}

/**
 * Image upload component with S3 support
 */
export function ImageUploadS3({
  images,
  onImagesChange,
  productId,
  siteId,
  maxImages = 10,
  disabled = false,
}: ImageUploadS3Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload file to S3 using presigned URL
  const uploadToS3 = async (file: File, imageId: string): Promise<ProductImage | null> => {
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
          productId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to get upload URL:', error);
        throw new Error('Failed to get upload URL');
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid presigned URL response');
      }
      
      const { uploadUrl, key, publicUrl } = result.data;

      // Upload file to S3
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
        body: file,
      });

      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload file: ${uploadResponse.status}`);
      }

      // Get image dimensions
      const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = URL.createObjectURL(file);
      });

      const productImage: ProductImage = {
        id: imageId,
        url: publicUrl,
        s3_key: key,
        storage_type: 's3' as const,
        alt_text: file.name.replace(/\.[^/.]+$/, ''),
        caption: null,
        position: 0,
        is_primary: false,
        width: dimensions.width,
        height: dimensions.height,
        size: file.size,
        filename: file.name,
      };
      
      return productImage;
    } catch (error) {
      console.error('S3 upload error:', error);
      return null;
    }
  };

  // Handle file selection from input
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !disabled && images.length < maxImages) {
      const filesArray = Array.from(e.target.files);
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        // Upload files to S3 and create image records
        const uploadPromises = filesArray.map(async (file, index) => {
          const imageId = crypto.randomUUID();
          const uploadedImage = await uploadToS3(file, imageId);
          
          if (uploadedImage) {
            uploadedImage.position = images.length + index + 1;
            uploadedImage.is_primary = images.length === 0 && index === 0;
            setUploadProgress((prev) => prev + (100 / filesArray.length));
            return uploadedImage;
          }
          return null;
        });

        const uploadedImages = await Promise.all(uploadPromises);
        const successfulImages = uploadedImages.filter((img): img is ProductImage => img !== null);

        if (successfulImages.length > 0) {
          onImagesChange([...images, ...successfulImages]);
          toast.success(
            `${successfulImages.length} image${successfulImages.length > 1 ? 's' : ''} uploaded`,
            {
              description: 'Remember to click "Save Changes" to save the images to your product.',
              duration: 5000,
            }
          );
        }

        if (successfulImages.length < filesArray.length) {
          toast.error(`Failed to upload ${filesArray.length - successfulImages.length} image(s)`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload images');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
      
      // Clear the input value to allow re-selecting the same files
      e.target.value = '';
    }
  }, [disabled, images, maxImages, onImagesChange, siteId, productId]);

  // Handle drag and drop
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || images.length >= maxImages) return;
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length === 0) {
      toast.error('Please drop image files only');
      return;
    }
    
    // Create a fake event to reuse the file select handler
    const fakeEvent = {
      target: { files: e.dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>;
    
    await handleFileSelect(fakeEvent);
  }, [disabled, images.length, maxImages, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newImages = arrayMove(images, oldIndex, newIndex).map(
          (img, index) => ({
            ...img,
            position: index + 1,
          })
        );
        onImagesChange(newImages);
      }
    }

    setActiveId(null);
  }, [images, onImagesChange]);

  const handleRemoveImage = useCallback((id: string) => {
    const newImages = images
      .filter((img) => img.id !== id)
      .map((img, index) => ({
        ...img,
        position: index + 1,
        is_primary: index === 0 ? true : img.is_primary,
      }));
    
    onImagesChange(newImages);
    toast.success('Image removed');
  }, [images, onImagesChange]);

  const handleSetPrimary = useCallback((id: string) => {
    const newImages = images.map((img) => ({
      ...img,
      is_primary: img.id === id,
    }));
    
    onImagesChange(newImages);
    toast.success('Primary image updated');
  }, [images, onImagesChange]);

  const handleUpdateAlt = useCallback((id: string, altText: string) => {
    const newImages = images.map((img) =>
      img.id === id ? { ...img, alt_text: altText } : img
    );
    
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const activeImage = images.find(image => image.id === activeId);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${disabled || images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && images.length < maxImages && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileSelect}
            disabled={disabled || images.length >= maxImages}
            className="hidden"
          />
          <Cloud className={`h-10 w-10 mb-4 ${isDragOver ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
          <h3 className="text-lg font-semibold mb-2">
            {isDragOver ? 'Drop images here' : 'Upload Images'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop images here, or click to select files
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Cloud className="h-3 w-3" />
              S3 Storage
            </span>
            <span>• Maximum {maxImages} images</span>
            <span>• JPG, PNG, WebP, AVIF</span>
            <span>• Max 5MB per file</span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading to S3...</span>
                <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image count and info */}
      {images.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {images.length} of {maxImages} images uploaded
          </p>
          {images.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Drag images to reorder
            </p>
          )}
        </div>
      )}

      {/* Image Grid with Drag and Drop */}
      {images.length > 0 && (
        <DndContext
          sensors={[]}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map(img => img.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <SortableImageItem
                  key={image.id}
                  image={image}
                  onRemove={handleRemoveImage}
                  onSetPrimary={handleSetPrimary}
                  onUpdateAlt={handleUpdateAlt}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId && activeImage ? (
              <Card className="overflow-hidden shadow-2xl">
                <div className="relative aspect-square bg-muted">
                  <ProductImageComponent
                    src={activeImage.url}
                    alt={activeImage.alt_text || ''}
                    width={200}
                    height={200}
                    className="object-cover w-full h-full"
                    sizes="200px"
                  />
                </div>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
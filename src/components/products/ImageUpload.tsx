'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { validateImageFile } from '@/lib/supabase/storage';

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
  size_bytes?: number | null;
}

/**
 * Upload progress tracking
 */
interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: {
    url: string;
    path: string;
    width: number;
    height: number;
    size: number;
  };
}

/**
 * Props for the ImageUpload component
 */
interface ImageUploadProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  onUpload: (files: File[]) => Promise<Array<{
    success: boolean;
    data?: {
      url: string;
      path: string;
      width: number;
      height: number;
      size: number;
    };
    error?: string;
  }>>;
  onUpdate?: (id: string, updates: Partial<ProductImage>) => void;
  onRemove?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
  maxImages?: number;
  disabled?: boolean;
}

/**
 * Sortable image item component
 */
function SortableImageItem({
  image,
  onUpdate,
  onRemove,
  onSetPrimary,
  disabled,
}: {
  image: ProductImage;
  onUpdate?: (id: string, updates: Partial<ProductImage>) => void;
  onRemove?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    alt_text: image.alt_text || '',
    caption: image.caption || '',
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(image.id, editData);
      toast.success('Image details updated');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      alt_text: image.alt_text || '',
      caption: image.caption || '',
    });
    setIsEditing(false);
  };

  return (
    <Card ref={setNodeRef} style={style} className={`relative group ${isDragging ? 'z-10' : ''}`}>
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing self-start mt-1 text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Image preview */}
          <div className="relative flex-shrink-0">
            <img
              src={image.url}
              alt={image.alt_text || `Product image ${image.position}`}
              className="w-16 h-16 object-cover rounded-md border"
            />
            {image.is_primary && (
              <div className="absolute -top-1 -right-1">
                <Badge variant="default" className="text-xs px-1.5 py-0.5">
                  <Star className="h-3 w-3 mr-1" />
                  Primary
                </Badge>
              </div>
            )}
          </div>

          {/* Image details */}
          <div className="flex-1 space-y-2">
            {!isEditing ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {image.alt_text || 'No alt text'}
                    </p>
                    {image.caption && (
                      <p className="text-xs text-muted-foreground">{image.caption}</p>
                    )}
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      {image.width && image.height && (
                        <span>{image.width} × {image.height}</span>
                      )}
                      {image.size_bytes && (
                        <span>{formatFileSize(image.size_bytes)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {!image.is_primary && onSetPrimary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSetPrimary(image.id)}
                        disabled={disabled}
                        className="text-xs"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    {onUpdate && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        disabled={disabled}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                    {onRemove && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemove(image.id)}
                        disabled={disabled}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`alt-${image.id}`} className="text-xs">
                    Alt Text
                  </Label>
                  <Input
                    id={`alt-${image.id}`}
                    value={editData.alt_text}
                    onChange={(e) => setEditData(prev => ({ ...prev, alt_text: e.target.value }))}
                    placeholder="Describe this image..."
                    className="text-sm h-8"
                  />
                </div>
                <div>
                  <Label htmlFor={`caption-${image.id}`} className="text-xs">
                    Caption
                  </Label>
                  <Textarea
                    id={`caption-${image.id}`}
                    value={editData.caption}
                    onChange={(e) => setEditData(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Optional caption..."
                    className="text-sm min-h-[60px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="h-7 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main ImageUpload component
 */
export function ImageUpload({
  images,
  onImagesChange,
  onUpload,
  onUpdate,
  onRemove,
  onSetPrimary,
  maxImages = 10,
  disabled = false,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (disabled) return;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      toast.error(`Cannot upload more than ${maxImages} images`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    }

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length === 0) return;

    // Initialize upload progress
    const progressItems: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploadProgress(progressItems);

    try {
      // Update progress to uploading
      setUploadProgress(prev => prev.map(item => ({ ...item, status: 'uploading' as const })));

      // Upload files
      const results = await onUpload(validFiles);

      // Process results
      const newImages: ProductImage[] = [];
      let hasErrors = false;

      results.forEach((result, index) => {
        const progressItem = progressItems[index];
        
        if (result.success && result.data) {
          const newImage: ProductImage = {
            id: crypto.randomUUID(),
            url: result.data.url,
            position: images.length + newImages.length + 1,
            is_primary: images.length === 0 && newImages.length === 0, // First image is primary
            width: result.data.width,
            height: result.data.height,
            size_bytes: result.data.size,
            alt_text: '',
            caption: '',
          };
          newImages.push(newImage);

          // Update progress
          setUploadProgress(prev => prev.map(item => 
            item.file === progressItem.file 
              ? { ...item, status: 'success', progress: 100, result: result.data }
              : item
          ));
        } else {
          hasErrors = true;
          setUploadProgress(prev => prev.map(item => 
            item.file === progressItem.file 
              ? { ...item, status: 'error', error: result.error }
              : item
          ));
        }
      });

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} image${newImages.length > 1 ? 's' : ''} uploaded successfully`);
      }

      if (hasErrors) {
        toast.error('Some uploads failed. Check the details below.');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
      setUploadProgress(prev => prev.map(item => ({ 
        ...item, 
        status: 'error', 
        error: 'Upload failed' 
      })));
    }

    // Clear progress after a delay
    setTimeout(() => {
      setUploadProgress([]);
    }, 3000);
  }, [images, onImagesChange, onUpload, maxImages, disabled]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(image => image.id === active.id);
      const newIndex = images.findIndex(image => image.id === over.id);
      
      const newImages = arrayMove(images, oldIndex, newIndex).map((image, index) => ({
        ...image,
        position: index + 1,
      }));

      onImagesChange(newImages);
      toast.success('Images reordered');
    }
  }, [images, onImagesChange]);

  const handleImageUpdate = useCallback((id: string, updates: Partial<ProductImage>) => {
    if (onUpdate) {
      onUpdate(id, updates);
    } else {
      // Fallback to local state update
      const newImages = images.map(image => 
        image.id === id ? { ...image, ...updates } : image
      );
      onImagesChange(newImages);
    }
  }, [images, onImagesChange, onUpdate]);

  const handleImageRemove = useCallback((id: string) => {
    if (onRemove) {
      onRemove(id);
    } else {
      // Fallback to local state update
      const newImages = images
        .filter(image => image.id !== id)
        .map((image, index) => ({ ...image, position: index + 1 }));
      
      // If we removed the primary image, make the first image primary
      if (newImages.length > 0 && !newImages.some(img => img.is_primary)) {
        newImages[0].is_primary = true;
      }

      onImagesChange(newImages);
      toast.success('Image removed');
    }
  }, [images, onImagesChange, onRemove]);

  const handleSetPrimary = useCallback((id: string) => {
    if (onSetPrimary) {
      onSetPrimary(id);
    } else {
      // Fallback to local state update
      const newImages = images.map(image => ({
        ...image,
        is_primary: image.id === id,
      }));
      onImagesChange(newImages);
      toast.success('Primary image updated');
    }
  }, [images, onImagesChange, onSetPrimary]);

  const activeImage = images.find(image => image.id === activeId);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className={`h-10 w-10 mb-4 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          <h3 className="text-lg font-semibold mb-2">
            {isDragOver ? 'Drop images here' : 'Upload Product Images'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop images here, or click to select files
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>• Maximum {maxImages} images</span>
            <span>• JPG, PNG, WebP, AVIF</span>
            <span>• Max 5MB per file</span>
          </div>
          {images.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {images.length} / {maxImages} images uploaded
            </p>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Upload Progress</h4>
            <div className="space-y-3">
              {uploadProgress.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{item.file.name}</span>
                    <div className="flex items-center gap-2">
                      {item.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {item.status === 'success' && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {item.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge 
                        variant={
                          item.status === 'success' ? 'default' : 
                          item.status === 'error' ? 'destructive' : 
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  {item.status === 'uploading' && (
                    <Progress value={item.progress} className="h-2" />
                  )}
                  {item.status === 'error' && item.error && (
                    <p className="text-xs text-red-500">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images List */}
      {images.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Product Images</h4>
              <Badge variant="secondary">{images.length} images</Badge>
            </div>
            
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map(img => img.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {images.map((image) => (
                    <SortableImageItem
                      key={image.id}
                      image={image}
                      onUpdate={handleImageUpdate}
                      onRemove={handleImageRemove}
                      onSetPrimary={handleSetPrimary}
                      disabled={disabled}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeImage ? (
                  <Card className="opacity-90">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground self-start mt-1" />
                        <img
                          src={activeImage.url}
                          alt={activeImage.alt_text || 'Dragging image'}
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {activeImage.alt_text || 'Product image'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {images.length === 0 && uploadProgress.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No images uploaded yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add some product images to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Helper function to format file sizes
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
'use client';

import { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import type { ProductImage } from './ImageUpload';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';

/**
 * Test component for ImageUpload functionality
 * This can be used to test the image upload system independently
 */
export function ImageUploadTest() {
  const [images, setImages] = useState<ProductImage[]>([]);

  const mockUpload = async (files: File[]) => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return files.map((file, index) => ({
      success: true,
      data: {
        url: URL.createObjectURL(file),
        path: `test/${file.name}`,
        width: 800,
        height: 600,
        size: file.size,
      },
    }));
  };

  const handleImagesChange = (newImages: ProductImage[]) => {
    setImages(newImages);
    console.log('Images updated:', newImages);
  };

  const handleImageUpdate = (id: string, updates: Partial<ProductImage>) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
    console.log('Image updated:', id, updates);
  };

  const handleImageRemove = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // Reorder positions
      return filtered.map((img, index) => ({ ...img, position: index + 1 }));
    });
    console.log('Image removed:', id);
  };

  const handleSetPrimary = (id: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      is_primary: img.id === id,
    })));
    console.log('Primary image set:', id);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Upload Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ImageUpload
              images={images}
              onImagesChange={handleImagesChange}
              onUpload={mockUpload}
              onUpdate={handleImageUpdate}
              onRemove={handleImageRemove}
              onSetPrimary={handleSetPrimary}
              maxImages={5}
            />

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setImages([])}
                disabled={images.length === 0}
              >
                Clear All Images
              </Button>
              <Button 
                variant="outline" 
                onClick={() => console.log('Current images:', images)}
              >
                Log Images to Console
              </Button>
            </div>

            {images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Image State</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto max-h-40 bg-muted p-3 rounded">
                    {JSON.stringify(images, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
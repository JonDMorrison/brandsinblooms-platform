'use client';

import * as React from 'react';
import { Controller, FieldValues, FieldPath } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ImageInputProps, ImageData, ImagePreviewState, UrlValidationOptions } from '@/types/content-editor';

/**
 * URL validation helper function
 */
function validateImageUrl(url: string, options: UrlValidationOptions = {}): boolean {
  const {
    allowEmpty = false,
    requireImageExtension = false,
    allowedProtocols = ['http:', 'https:']
  } = options;

  if (!url.trim()) {
    return allowEmpty;
  }

  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }

    // Check image extension if required
    if (requireImageExtension) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const pathname = urlObj.pathname.toLowerCase();
      const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
      
      if (!hasImageExtension) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Image input component with URL input, preview, and alt text
 * Compatible with React Hook Form and includes loading/error states
 */
export function ImageInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  placeholder = "Enter image URL...",
  helperText,
  className,
  error,
  disabled = false,
  required = false,
  onImageLoad,
  onImageError,
  ...props
}: ImageInputProps<TFieldValues, TName> & Omit<React.ComponentProps<"input">, keyof ImageInputProps<TFieldValues, TName>>) {
  const [previewState, setPreviewState] = React.useState<ImagePreviewState>({
    isLoading: false,
    isValid: false
  });
  
  const [urlInputValue, setUrlInputValue] = React.useState('');
  const [altInputValue, setAltInputValue] = React.useState('');

  const validateImageData = React.useCallback((value: ImageData | null): string | true => {
    if (required && (!value || !value.url.trim())) {
      return `${label} is required`;
    }
    
    if (value?.url && !validateImageUrl(value.url, { requireImageExtension: true })) {
      return 'Please enter a valid image URL';
    }
    
    return true;
  }, [label, required]);

  const handleImageLoad = React.useCallback((url: string) => {
    if (!url.trim()) {
      setPreviewState({ isLoading: false, isValid: false });
      onImageLoad?.(false);
      return;
    }

    setPreviewState({ isLoading: true, isValid: false, error: undefined });
    
    const img = new Image();
    
    img.onload = () => {
      setPreviewState({ isLoading: false, isValid: true });
      onImageLoad?.(true);
    };
    
    img.onerror = () => {
      const errorMessage = 'Failed to load image';
      setPreviewState({ isLoading: false, isValid: false, error: errorMessage });
      onImageError?.(errorMessage);
    };
    
    img.src = url;
  }, [onImageLoad, onImageError]);

  const updateImageData = React.useCallback((
    url: string, 
    alt: string, 
    onChange: (value: ImageData | null) => void
  ) => {
    if (!url.trim() && !alt.trim()) {
      onChange(null);
    } else {
      onChange({ url: url.trim(), alt: alt.trim() });
    }
  }, []);

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          validate: validateImageData,
          required: required ? `${label} is required` : false,
        }}
        render={({ field, fieldState }) => {
          const fieldError = fieldState.error?.message || error;
          const currentValue = field.value as ImageData | null;

          React.useEffect(() => {
            if (currentValue?.url !== urlInputValue) {
              setUrlInputValue(currentValue?.url || '');
            }
            if (currentValue?.alt !== altInputValue) {
              setAltInputValue(currentValue?.alt || '');
            }
          }, [currentValue, urlInputValue, altInputValue]);

          React.useEffect(() => {
            handleImageLoad(urlInputValue);
          }, [urlInputValue, handleImageLoad]);

          const handleUrlChange = (url: string) => {
            setUrlInputValue(url);
            updateImageData(url, altInputValue, field.onChange);
          };

          const handleAltChange = (alt: string) => {
            setAltInputValue(alt);
            updateImageData(urlInputValue, alt, field.onChange);
          };

          return (
            <div className={cn('space-y-4', className)}>
              <div className="space-y-2">
                <Label htmlFor={`${field.name}-url`} className={cn(
                  required && "after:content-['*'] after:ml-0.5 after:text-destructive"
                )}>
                  {label}
                </Label>
                
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      {...props}
                      id={`${field.name}-url`}
                      type="url"
                      placeholder={placeholder}
                      value={urlInputValue}
                      disabled={disabled}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className={cn(
                        "pr-10",
                        fieldError && "border-destructive focus-visible:ring-destructive/20",
                      )}
                      aria-invalid={!!fieldError}
                      aria-describedby={
                        fieldError ? `${field.name}-error` : 
                        helperText ? `${field.name}-description` : undefined
                      }
                    />
                    
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {previewState.isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      )}
                      {!previewState.isLoading && urlInputValue && (
                        <>
                          {previewState.isValid ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => window.open(urlInputValue, '_blank')}
                              title="Open image in new tab"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {fieldError && (
                    <p 
                      id={`${field.name}-error`}
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {fieldError}
                    </p>
                  )}
                  {!fieldError && previewState.error && (
                    <p className="text-sm text-destructive">
                      {previewState.error}
                    </p>
                  )}
                  {!fieldError && !previewState.error && helperText && (
                    <p 
                      id={`${field.name}-description`}
                      className="text-sm text-gray-500"
                    >
                      {helperText}
                    </p>
                  )}
                </div>
              </div>

              {/* Alt Text Input */}
              <div className="space-y-2">
                <Label htmlFor={`${field.name}-alt`}>
                  Alt Text
                </Label>
                <Input
                  id={`${field.name}-alt`}
                  type="text"
                  placeholder="Describe the image for accessibility..."
                  value={altInputValue}
                  disabled={disabled}
                  onChange={(e) => handleAltChange(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Describe the image for screen readers and accessibility
                </p>
              </div>

              {/* Image Preview */}
              {urlInputValue && (
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Preview
                      </h4>
                      
                      {previewState.isLoading && (
                        <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading image...
                          </div>
                        </div>
                      )}
                      
                      {!previewState.isLoading && previewState.isValid && (
                        <div className="relative max-w-sm">
                          <img
                            src={urlInputValue}
                            alt={altInputValue || 'Preview'}
                            className="w-full h-auto max-h-48 object-contain rounded-md border"
                            loading="lazy"
                          />
                          {altInputValue && (
                            <p className="text-xs text-gray-500 mt-1">
                              Alt: {altInputValue}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {!previewState.isLoading && !previewState.isValid && previewState.error && (
                        <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            {previewState.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        }}
      />
    );
  }

  // Uncontrolled version for direct usage without React Hook Form
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor={`${name}-url`} className={cn(
          required && "after:content-['*'] after:ml-0.5 after:text-destructive"
        )}>
          {label}
        </Label>
        
        <div className="space-y-1">
          <div className="relative">
            <Input
              {...props}
              id={`${name}-url`}
              name={`${name}-url`}
              type="url"
              placeholder={placeholder}
              disabled={disabled}
              onChange={(e) => {
                setUrlInputValue(e.target.value);
                handleImageLoad(e.target.value);
                props.onChange?.(e);
              }}
              className={cn(
                "pr-10",
                error && "border-destructive focus-visible:ring-destructive/20",
              )}
              aria-invalid={!!error}
              aria-describedby={
                error ? `${name}-error` : 
                helperText ? `${name}-description` : undefined
              }
            />
            
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {previewState.isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              )}
              {!previewState.isLoading && urlInputValue && (
                <>
                  {previewState.isValid ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => window.open(urlInputValue, '_blank')}
                      title="Open image in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </>
              )}
            </div>
          </div>

          {error && (
            <p 
              id={`${name}-error`}
              className="text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
          {!error && previewState.error && (
            <p className="text-sm text-destructive">
              {previewState.error}
            </p>
          )}
          {!error && !previewState.error && helperText && (
            <p 
              id={`${name}-description`}
              className="text-sm text-gray-500"
            >
              {helperText}
            </p>
          )}
        </div>
      </div>

      {/* Alt Text Input */}
      <div className="space-y-2">
        <Label htmlFor={`${name}-alt`}>
          Alt Text
        </Label>
        <Input
          id={`${name}-alt`}
          name={`${name}-alt`}
          type="text"
          placeholder="Describe the image for accessibility..."
          disabled={disabled}
          onChange={(e) => setAltInputValue(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Describe the image for screen readers and accessibility
        </p>
      </div>

      {/* Image Preview */}
      {urlInputValue && (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Preview
              </h4>
              
              {previewState.isLoading && (
                <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading image...
                  </div>
                </div>
              )}
              
              {!previewState.isLoading && previewState.isValid && (
                <div className="relative max-w-sm">
                  <img
                    src={urlInputValue}
                    alt={altInputValue || 'Preview'}
                    className="w-full h-auto max-h-48 object-contain rounded-md border"
                    loading="lazy"
                  />
                  {altInputValue && (
                    <p className="text-xs text-gray-500 mt-1">
                      Alt: {altInputValue}
                    </p>
                  )}
                </div>
              )}
              
              {!previewState.isLoading && !previewState.isValid && previewState.error && (
                <div className="flex items-center justify-center h-32 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {previewState.error}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
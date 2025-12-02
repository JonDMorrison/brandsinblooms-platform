'use client';

import * as React from 'react';
import { useController, FieldValues, FieldPath } from 'react-hook-form';
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

interface ImageInputRendererProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  label: string;
  urlValue: string;
  altValue: string;
  onUrlChange: (url: string) => void;
  onAltChange: (alt: string) => void;
  error?: string;
  helperText?: string;
  previewState: ImagePreviewState;
  required?: boolean;
  disabled?: boolean;
  name: string;
}

function ImageInputRenderer({
  label,
  urlValue,
  altValue,
  onUrlChange,
  onAltChange,
  error,
  helperText,
  previewState,
  required,
  disabled,
  name,
  placeholder,
  className,
  ...props
}: ImageInputRendererProps) {
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
              type="url"
              placeholder={placeholder}
              value={urlValue}
              disabled={disabled}
              onChange={(e) => onUrlChange(e.target.value)}
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
              {!previewState.isLoading && urlValue && (
                <>
                  {previewState.isValid ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => window.open(urlValue, '_blank')}
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
          type="text"
          placeholder="Describe the image for accessibility..."
          value={altValue}
          disabled={disabled}
          onChange={(e) => onAltChange(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Describe the image for screen readers and accessibility
        </p>
      </div>

      {/* Image Preview */}
      {urlValue && (
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
                    src={urlValue}
                    alt={altValue || 'Preview'}
                    className="w-full h-auto max-h-48 object-contain rounded-md border"
                    loading="lazy"
                  />
                  {altValue && (
                    <p className="text-xs text-gray-500 mt-1">
                      Alt: {altValue}
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

function useImagePreview(onImageLoad?: (isValid: boolean) => void, onImageError?: (error: string) => void) {
  const [previewState, setPreviewState] = React.useState<ImagePreviewState>({
    isLoading: false,
    isValid: false
  });

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

  return { previewState, handleImageLoad };
}

function ControlledImageInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  required,
  onImageLoad,
  onImageError,
  ...props
}: ImageInputProps<TFieldValues, TName> & Omit<React.ComponentProps<"input">, keyof ImageInputProps<TFieldValues, TName>>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules: {
      validate: (value: ImageData | null) => {
        if (required && (!value || !value.url.trim())) {
          return `${label} is required`;
        }
        if (value?.url && !validateImageUrl(value.url, { requireImageExtension: true })) {
          return 'Please enter a valid image URL';
        }
        return true;
      },
      required: required ? `${label} is required` : false,
    }
  });

  const { previewState, handleImageLoad } = useImagePreview(onImageLoad, onImageError);
  const [urlInputValue, setUrlInputValue] = React.useState('');
  const [altInputValue, setAltInputValue] = React.useState('');

  const currentValue = field.value as ImageData | null;

  React.useEffect(() => {
    if (currentValue?.url !== urlInputValue) {
      setUrlInputValue(currentValue?.url || '');
    }
    if (currentValue?.alt !== altInputValue) {
      setAltInputValue(currentValue?.alt || '');
    }
  }, [currentValue]); // Removed urlInputValue/altInputValue from deps to avoid loops

  React.useEffect(() => {
    handleImageLoad(urlInputValue);
  }, [urlInputValue, handleImageLoad]);

  const updateImageData = (url: string, alt: string) => {
    if (!url.trim() && !alt.trim()) {
      field.onChange(null);
    } else {
      field.onChange({ url: url.trim(), alt: alt.trim() });
    }
  };

  return (
    <ImageInputRenderer
      {...props}
      name={name}
      label={label}
      required={required}
      urlValue={urlInputValue}
      altValue={altInputValue}
      onUrlChange={(url) => {
        setUrlInputValue(url);
        updateImageData(url, altInputValue);
      }}
      onAltChange={(alt) => {
        setAltInputValue(alt);
        updateImageData(urlInputValue, alt);
      }}
      error={fieldState.error?.message || props.error}
      previewState={previewState}
    />
  );
}

function UncontrolledImageInput({
  name,
  label,
  required,
  onImageLoad,
  onImageError,
  onChange,
  ...props
}: any) {
  const { previewState, handleImageLoad } = useImagePreview(onImageLoad, onImageError);
  const [urlInputValue, setUrlInputValue] = React.useState('');
  const [altInputValue, setAltInputValue] = React.useState('');

  return (
    <ImageInputRenderer
      {...props}
      name={name}
      label={label}
      required={required}
      urlValue={urlInputValue}
      altValue={altInputValue}
      onUrlChange={(url) => {
        setUrlInputValue(url);
        handleImageLoad(url);
        onChange?.({ target: { value: url } }); // Partial mock of event
      }}
      onAltChange={(alt) => {
        setAltInputValue(alt);
      }}
      previewState={previewState}
    />
  );
}

export function ImageInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: ImageInputProps<TFieldValues, TName> & Omit<React.ComponentProps<"input">, keyof ImageInputProps<TFieldValues, TName>>) {
  if (props.control) {
    return <ControlledImageInput {...props} />;
  }
  return <UncontrolledImageInput {...props} />;
}
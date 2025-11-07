'use client';

import * as React from 'react';
import { Controller, FieldValues, FieldPath } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SimpleTextInputProps } from '@/types/content-editor';

/**
 * Simple text input component with validation and character count
 * Compatible with React Hook Form and includes loading/error states
 */
export function SimpleTextInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  placeholder,
  helperText,
  maxLength,
  showCharCount = true,
  className,
  error,
  disabled = false,
  required = false,
  ...props
}: SimpleTextInputProps<TFieldValues, TName> & Omit<React.ComponentProps<"input">, keyof SimpleTextInputProps<TFieldValues, TName>>) {
  const [currentLength, setCurrentLength] = React.useState(0);

  const validateText = React.useCallback((value: string): string | true => {
    if (required && (!value || value.trim().length === 0)) {
      return `${label} is required`;
    }
    
    if (maxLength && value && value.length > maxLength) {
      return `${label} must be ${maxLength} characters or less`;
    }
    
    return true;
  }, [label, maxLength, required]);

  const handleInputChange = React.useCallback((
    value: string,
    onChange: (value: string) => void
  ) => {
    setCurrentLength(value.length);
    onChange(value);
  }, []);

  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          validate: validateText,
          required: required ? `${label} is required` : false,
        }}
        render={({ field, fieldState }) => {
          const fieldError = fieldState.error?.message || error;
          
          React.useEffect(() => {
            setCurrentLength(field.value?.length || 0);
          }, [field.value]);

          return (
            <div className={cn('space-y-2', className)}>
              <Label htmlFor={field.name} className={cn(
                required && "after:content-['*'] after:ml-0.5 after:text-destructive"
              )}>
                {label}
              </Label>
              
              <div className="space-y-1">
                <Input
                  {...field}
                  {...props}
                  id={field.name}
                  type="text"
                  placeholder={placeholder}
                  disabled={disabled}
                  maxLength={maxLength}
                  onChange={(e) => handleInputChange(e.target.value, field.onChange)}
                  className={cn(
                    fieldError && "border-destructive focus-visible:ring-destructive/20",
                  )}
                  aria-invalid={!!fieldError}
                  aria-describedby={
                    fieldError ? `${field.name}-error` : 
                    helperText ? `${field.name}-description` : undefined
                  }
                />
                
                <div className="flex justify-between items-center min-h-[1.25rem]">
                  <div className="flex-1">
                    {fieldError && (
                      <p 
                        id={`${field.name}-error`}
                        className="text-sm text-destructive"
                        role="alert"
                      >
                        {fieldError}
                      </p>
                    )}
                    {!fieldError && helperText && (
                      <p 
                        id={`${field.name}-description`}
                        className="text-sm text-gray-500"
                      >
                        {helperText}
                      </p>
                    )}
                  </div>
                  
                  {showCharCount && maxLength && (
                    <span className={cn(
                      "text-xs text-gray-500 tabular-nums",
                      currentLength > maxLength * 0.9 && "text-warning",
                      currentLength >= maxLength && "text-destructive"
                    )}>
                      {currentLength}/{maxLength}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      />
    );
  }

  // Uncontrolled version for direct usage without React Hook Form
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={cn(
        required && "after:content-['*'] after:ml-0.5 after:text-destructive"
      )}>
        {label}
      </Label>
      
      <div className="space-y-1">
        <Input
          {...props}
          id={name}
          name={name}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          onChange={(e) => {
            setCurrentLength(e.target.value.length);
            // Pass the value, not the event, to match controlled version behavior
            if (props.onChange) {
              // Cast to any to handle both event and value signatures
              (props.onChange as (value: string) => void)(e.target.value);
            }
          }}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive/20",
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${name}-error` :
            helperText ? `${name}-description` : undefined
          }
        />
        
        <div className="flex justify-between items-center min-h-[1.25rem]">
          <div className="flex-1">
            {error && (
              <p 
                id={`${name}-error`}
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}
            {!error && helperText && (
              <p 
                id={`${name}-description`}
                className="text-sm text-gray-500"
              >
                {helperText}
              </p>
            )}
          </div>
          
          {showCharCount && maxLength && (
            <span className={cn(
              "text-xs text-gray-500 tabular-nums",
              currentLength > maxLength * 0.9 && "text-warning",
              currentLength >= maxLength && "text-destructive"
            )}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
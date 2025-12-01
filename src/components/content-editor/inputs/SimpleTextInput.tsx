'use client';

import * as React from 'react';
import { useController, FieldValues, FieldPath } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/src/lib/utils';
import { SimpleTextInputProps } from '@/types/content-editor';

interface SimpleTextInputRendererProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  label: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  currentLength: number;
  required?: boolean;
  disabled?: boolean;
  name: string;
  showCharCount?: boolean;
  maxLength?: number;
}

function SimpleTextInputRenderer({
  label,
  value,
  onChange,
  error,
  helperText,
  currentLength,
  required,
  disabled,
  name,
  showCharCount,
  maxLength,
  placeholder,
  className,
  ...props
}: SimpleTextInputRendererProps) {
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
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
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

function ControlledSimpleTextInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  maxLength,
  required,
  ...props
}: SimpleTextInputProps<TFieldValues, TName> & Omit<React.ComponentProps<"input">, keyof SimpleTextInputProps<TFieldValues, TName>>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules: {
      validate: (value: string) => {
        if (required && (!value || value.trim().length === 0)) {
          return `${label} is required`;
        }
        if (maxLength && value && value.length > maxLength) {
          return `${label} must be ${maxLength} characters or less`;
        }
        return true;
      },
      required: required ? `${label} is required` : false,
    }
  });

  const [currentLength, setCurrentLength] = React.useState(0);

  React.useEffect(() => {
    setCurrentLength(field.value?.length || 0);
  }, [field.value]);

  return (
    <SimpleTextInputRenderer
      {...props}
      {...field}
      name={name}
      label={label}
      required={required}
      maxLength={maxLength}
      currentLength={currentLength}
      error={fieldState.error?.message || props.error}
      onChange={(e) => {
        setCurrentLength(e.target.value.length);
        field.onChange(e.target.value);
      }}
    />
  );
}

function UncontrolledSimpleTextInput({
  name,
  label,
  required,
  maxLength,
  onChange,
  ...props
}: any) {
  const [currentLength, setCurrentLength] = React.useState(0);

  return (
    <SimpleTextInputRenderer
      {...props}
      name={name}
      label={label}
      required={required}
      maxLength={maxLength}
      currentLength={currentLength}
      onChange={(e) => {
        setCurrentLength(e.target.value.length);
        if (onChange) {
          // Cast to any to handle both event and value signatures if needed, 
          // but standard input onChange expects event.
          // The previous code cast it to (value: string) => void, which is weird for an input prop.
          // Let's support both if possible or stick to the previous behavior.
          // Previous behavior: (props.onChange as unknown as (value: string) => void)(e.target.value);
          (onChange as unknown as (value: string) => void)(e.target.value);
        }
      }}
    />
  );
}

/**
 * Simple text input component with validation and character count
 * Compatible with React Hook Form and includes loading/error states
 */
export function SimpleTextInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: SimpleTextInputProps<TFieldValues, TName> & Omit<React.ComponentProps<"input">, keyof SimpleTextInputProps<TFieldValues, TName>>) {
  if (props.control) {
    return <ControlledSimpleTextInput {...props} />;
  }
  return <UncontrolledSimpleTextInput {...props} />;
}
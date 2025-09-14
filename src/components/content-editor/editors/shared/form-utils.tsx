/**
 * Common form utilities and components for content section editors
 * Provides reusable form field patterns to eliminate code duplication
 */

import React from 'react'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'

interface FormFieldProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

interface TextareaFieldProps extends FormFieldProps {
  rows?: number
  minHeight?: string
}

interface ButtonFieldProps {
  label: string
  textValue: string
  linkValue: string
  onTextChange: (value: string) => void
  onLinkChange: (value: string) => void
  textPlaceholder?: string
  linkPlaceholder?: string
  className?: string
}

/**
 * Reusable input field with label
 */
export function FormField({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  className = '', 
  required = false 
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 ${className}`}
        placeholder={placeholder}
      />
    </div>
  )
}

/**
 * Reusable textarea field with label
 */
export function TextareaField({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  className = '', 
  rows = 3,
  minHeight = '60px'
}: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
        style={{ minHeight }}
        rows={rows}
      />
    </div>
  )
}

/**
 * Reusable button configuration field (text + link)
 */
export function ButtonConfigField({ 
  label, 
  textValue, 
  linkValue, 
  onTextChange, 
  onLinkChange, 
  textPlaceholder = 'Button text', 
  linkPlaceholder = 'Link/Route',
  className = ''
}: ButtonFieldProps) {
  return (
    <div className={`p-3 border rounded-lg bg-muted/30 space-y-2 ${className}`}>
      <Label className="text-xs text-gray-500">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="text"
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          className="h-8"
          placeholder={textPlaceholder}
        />
        <Input
          type="text"
          value={linkValue}
          onChange={(e) => onLinkChange(e.target.value)}
          className="h-8"
          placeholder={linkPlaceholder}
        />
      </div>
    </div>
  )
}

/**
 * Form section wrapper with consistent styling
 */
export function FormSection({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`space-y-3 mb-4 ${className}`}>
      {children}
    </div>
  )
}
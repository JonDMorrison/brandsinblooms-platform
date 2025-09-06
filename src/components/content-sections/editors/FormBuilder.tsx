'use client'

import React, { useCallback } from 'react'
import { ContentSection, FormField } from '@/src/lib/content/schema'
import { ItemListEditor } from '../shared/ItemListEditor'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Button } from '@/src/components/ui/button'
import { Plus, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'

interface SectionEditorProps {
  section: ContentSection
  onUpdate: (data: Partial<ContentSection['data']>) => void
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email Input' },
  { value: 'phone', label: 'Phone Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'number', label: 'Number Input' }
] as const

export function FormBuilder({ section, onUpdate }: SectionEditorProps) {
  const fields = (section.data.fields as FormField[]) || []

  const generateFieldId = (type: string) => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `${type}-${timestamp}-${random}`
  }

  const handleAddField = useCallback((type: FormField['type']) => {
    const newField: FormField = {
      id: generateFieldId(type),
      type,
      label: `New ${type} field`,
      required: false,
      order: fields.length + 1
    }
    
    // Add default options for select/radio/checkbox
    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      newField.options = ['Option 1', 'Option 2', 'Option 3']
    }
    
    onUpdate({ fields: [...fields, newField] })
  }, [fields, onUpdate])

  const handleUpdateField = useCallback((index: number, updatedField: FormField) => {
    const newFields = [...fields]
    newFields[index] = updatedField
    onUpdate({ fields: newFields })
  }, [fields, onUpdate])

  const handleRemoveField = useCallback((index: number) => {
    const newFields = fields.filter((_, i) => i !== index)
    onUpdate({ fields: newFields })
  }, [fields, onUpdate])

  const handleReorder = useCallback((reorderedFields: FormField[]) => {
    const fieldsWithOrder = reorderedFields.map((field, index) => ({
      ...field,
      order: index + 1
    }))
    onUpdate({ fields: fieldsWithOrder })
  }, [onUpdate])

  const renderFieldEditor = useCallback((field: FormField, index: number) => {
    const updateFieldProperty = (property: keyof FormField, value: unknown) => {
      handleUpdateField(index, { ...field, [property]: value })
    }

    const updateValidation = (property: string, value: unknown) => {
      handleUpdateField(index, {
        ...field,
        validation: { ...field.validation, [property]: value }
      })
    }

    const hasOptions = field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Field Label</Label>
            <Input
              value={field.label}
              onChange={(e) => updateFieldProperty('label', e.target.value)}
              placeholder="Field label"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value: FormField['type']) => updateFieldProperty('type', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Placeholder</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => updateFieldProperty('placeholder', e.target.value)}
              placeholder="Placeholder text"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Field ID</Label>
            <Input
              value={field.id}
              onChange={(e) => updateFieldProperty('id', e.target.value)}
              placeholder="field-id"
              className="h-8"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`required-${field.id}`}
            checked={field.required}
            onCheckedChange={(checked) => updateFieldProperty('required', checked)}
          />
          <Label
            htmlFor={`required-${field.id}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Required field
          </Label>
        </div>
        
        {hasOptions && (
          <div className="space-y-2">
            <Label className="text-xs">Options</Label>
            <div className="space-y-2">
              {(field.options || []).map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(field.options || [])]
                      newOptions[optionIndex] = e.target.value
                      updateFieldProperty('options', newOptions)
                    }}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="h-8 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const newOptions = (field.options || []).filter((_, i) => i !== optionIndex)
                      updateFieldProperty('options', newOptions)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
                  updateFieldProperty('options', newOptions)
                }}
                className="w-full h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>
          </div>
        )}
        
        {/* Validation Rules */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Validation Rules (Optional)</Label>
          <div className="grid grid-cols-2 gap-2">
            {(field.type === 'text' || field.type === 'textarea') && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Min Length</Label>
                  <Input
                    type="number"
                    value={field.validation?.minLength || ''}
                    onChange={(e) => updateValidation('minLength', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    placeholder="0"
                    className="h-7"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Length</Label>
                  <Input
                    type="number"
                    value={field.validation?.maxLength || ''}
                    onChange={(e) => updateValidation('maxLength', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    placeholder="100"
                    className="h-7"
                  />
                </div>
              </>
            )}
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Validation Pattern (Regex)</Label>
              <Input
                value={field.validation?.pattern || ''}
                onChange={(e) => updateValidation('pattern', e.target.value)}
                placeholder="e.g., ^[0-9]{3}-[0-9]{3}-[0-9]{4}$"
                className="h-7"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Validation Message</Label>
              <Input
                value={field.validation?.message || ''}
                onChange={(e) => updateValidation('message', e.target.value)}
                placeholder="Custom error message"
                className="h-7"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }, [handleUpdateField])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FIELD_TYPES.map((type) => (
          <Button
            key={type.value}
            variant="outline"
            size="sm"
            onClick={() => handleAddField(type.value as FormField['type'])}
            className="h-8"
          >
            <Plus className="h-3 w-3 mr-1" />
            {type.label}
          </Button>
        ))}
      </div>
      
      {fields.length > 0 ? (
        <ItemListEditor
          items={fields}
          onAdd={() => handleAddField('text')}
          onUpdate={handleUpdateField}
          onRemove={handleRemoveField}
          onReorder={handleReorder}
          renderItem={renderFieldEditor}
          emptyMessage="No form fields added yet"
          addButtonLabel="Add Text Field"
        />
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="p-8">
            <p className="text-sm text-gray-500 text-center mb-4">
              No form fields added yet. Click a button above to add a field.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
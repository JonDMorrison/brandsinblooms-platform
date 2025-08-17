/**
 * Content serialization utilities for the enhanced content editor
 * Handles conversion between database format and editor format
 */

import { Json } from '@/lib/database/types'
import { 
  PageContent, 
  ContentSection, 
  ContentSectionData,
  ContentItem,
  FormField,
  LayoutType
} from './schema'

/**
 * Serialize PageContent for database storage
 * Converts the PageContent structure to JSONB format
 */
export function serializePageContent(content: PageContent): Json {
  try {
    return JSON.parse(JSON.stringify(content)) as Json
  } catch (error) {
    console.error('Failed to serialize page content:', error)
    throw new Error('Invalid content structure for serialization')
  }
}

/**
 * Deserialize PageContent from database
 * Converts JSONB data back to PageContent structure
 */
export function deserializePageContent(data: Json): PageContent | null {
  try {
    if (!data || typeof data !== 'object') {
      return null
    }

    const parsed = data as unknown as PageContent
    
    // Validate basic structure
    if (!parsed.version || !parsed.layout || !parsed.sections) {
      return null
    }

    return parsed
  } catch (error) {
    console.error('Failed to deserialize page content:', error)
    return null
  }
}

/**
 * Serialize ContentSection for storage
 */
export function serializeContentSection(section: ContentSection): Json {
  try {
    return {
      type: section.type,
      data: serializeContentSectionData(section.data),
      visible: section.visible,
      order: section.order || 0,
      settings: section.settings || {}
    } as Json
  } catch (error) {
    console.error('Failed to serialize content section:', error)
    throw new Error('Invalid section structure for serialization')
  }
}

/**
 * Deserialize ContentSection from storage
 */
export function deserializeContentSection(data: Json): ContentSection | null {
  try {
    if (!data || typeof data !== 'object') {
      return null
    }

    const section = data as any
    
    return {
      type: section.type,
      data: deserializeContentSectionData(section.data) || {},
      visible: Boolean(section.visible),
      order: Number(section.order) || 0,
      settings: section.settings || {}
    }
  } catch (error) {
    console.error('Failed to deserialize content section:', error)
    return null
  }
}

/**
 * Serialize ContentSectionData for storage
 */
export function serializeContentSectionData(data: ContentSectionData): Json {
  try {
    const serialized: Record<string, Json> = {}

    // Handle each field individually to ensure proper types
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return

      if (key === 'items' && Array.isArray(value)) {
        serialized[key] = value.map(item => serializeContentItem(item)) as Json
      } else if (key === 'fields' && Array.isArray(value)) {
        serialized[key] = value.map(field => serializeFormField(field)) as Json
      } else if (key === 'json' && value !== null && value !== undefined) {
        // Tiptap JSON content
        serialized[key] = value as Json
      } else {
        serialized[key] = value as Json
      }
    })

    return serialized as Json
  } catch (error) {
    console.error('Failed to serialize section data:', error)
    throw new Error('Invalid section data for serialization')
  }
}

/**
 * Deserialize ContentSectionData from storage
 */
export function deserializeContentSectionData(data: Json): ContentSectionData | null {
  try {
    if (!data || typeof data !== 'object') {
      return {}
    }

    const sectionData = data as Record<string, any>
    const deserialized: ContentSectionData = {}

    Object.entries(sectionData).forEach(([key, value]) => {
      if (key === 'items' && Array.isArray(value)) {
        deserialized[key] = value
          .map(item => deserializeContentItem(item))
          .filter(Boolean) as Json
      } else if (key === 'fields' && Array.isArray(value)) {
        deserialized[key] = value
          .map(field => deserializeFormField(field))
          .filter(Boolean) as Json
      } else {
        deserialized[key] = value
      }
    })

    return deserialized
  } catch (error) {
    console.error('Failed to deserialize section data:', error)
    return {}
  }
}

/**
 * Serialize ContentItem for storage
 */
export function serializeContentItem(item: ContentItem): Json {
  try {
    return {
      id: item.id,
      title: item.title || '',
      subtitle: item.subtitle || '',
      content: item.content || '',
      image: item.image || '',
      icon: item.icon || '',
      url: item.url || '',
      order: item.order || 0,
      metadata: item.metadata || {}
    } as Json
  } catch (error) {
    console.error('Failed to serialize content item:', error)
    throw new Error('Invalid content item for serialization')
  }
}

/**
 * Deserialize ContentItem from storage
 */
export function deserializeContentItem(data: Json): ContentItem | null {
  try {
    if (!data || typeof data !== 'object') {
      return null
    }

    const item = data as any
    
    return {
      id: String(item.id || ''),
      title: String(item.title || ''),
      subtitle: String(item.subtitle || ''),
      content: String(item.content || ''),
      image: String(item.image || ''),
      icon: String(item.icon || ''),
      url: String(item.url || ''),
      order: Number(item.order) || 0,
      metadata: item.metadata || {}
    }
  } catch (error) {
    console.error('Failed to deserialize content item:', error)
    return null
  }
}

/**
 * Serialize FormField for storage
 */
export function serializeFormField(field: FormField): Json {
  try {
    return {
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder || '',
      required: field.required,
      options: field.options || [],
      validation: field.validation || {},
      order: field.order || 0
    } as Json
  } catch (error) {
    console.error('Failed to serialize form field:', error)
    throw new Error('Invalid form field for serialization')
  }
}

/**
 * Deserialize FormField from storage
 */
export function deserializeFormField(data: Json): FormField | null {
  try {
    if (!data || typeof data !== 'object') {
      return null
    }

    const field = data as any
    
    return {
      id: String(field.id || ''),
      type: field.type || 'text',
      label: String(field.label || ''),
      placeholder: String(field.placeholder || ''),
      required: Boolean(field.required),
      options: Array.isArray(field.options) ? field.options.map(String) : [],
      validation: field.validation || {},
      order: Number(field.order) || 0
    }
  } catch (error) {
    console.error('Failed to deserialize form field:', error)
    return null
  }
}

/**
 * Extract text content from rich text data
 * Useful for previews and search indexing
 */
export function extractTextContent(sectionData: ContentSectionData): string {
  try {
    // Try to extract from HTML content
    if (sectionData.content) {
      // Remove HTML tags and decode entities
      const text = sectionData.content
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()
      
      return text
    }

    // Try to extract from Tiptap JSON
    if (sectionData.json && typeof sectionData.json === 'object') {
      return extractTextFromTiptapJSON(sectionData.json)
    }

    return ''
  } catch (error) {
    console.error('Failed to extract text content:', error)
    return ''
  }
}

/**
 * Extract text from Tiptap JSON structure
 */
function extractTextFromTiptapJSON(json: Json): string {
  try {
    if (!json || typeof json !== 'object') {
      return ''
    }

    const doc = json as any

    if (doc.type === 'text') {
      return doc.text || ''
    }

    if (Array.isArray(doc.content)) {
      return doc.content
        .map((node: any) => extractTextFromTiptapJSON(node))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    return ''
  } catch (error) {
    console.error('Failed to extract text from Tiptap JSON:', error)
    return ''
  }
}

/**
 * Generate content preview/excerpt
 */
export function generateContentPreview(
  content: PageContent, 
  maxLength: number = 150
): string {
  try {
    const textParts: string[] = []

    // Extract text from all visible sections
    Object.entries(content.sections)
      .filter(([, section]) => section.visible)
      .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
      .forEach(([, section]) => {
        const text = extractTextContent(section.data)
        if (text) {
          textParts.push(text)
        }
      })

    const fullText = textParts.join(' ').replace(/\s+/g, ' ').trim()
    
    if (fullText.length <= maxLength) {
      return fullText
    }

    // Truncate at word boundary
    const truncated = fullText.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...'
  } catch (error) {
    console.error('Failed to generate content preview:', error)
    return ''
  }
}

/**
 * Calculate content completion percentage
 */
export function calculateContentCompletion(
  content: PageContent,
  layout: LayoutType
): number {
  try {
    const sections = Object.entries(content.sections)
    if (sections.length === 0) return 0

    let totalWeight = 0
    let completedWeight = 0

    sections.forEach(([sectionKey, section]) => {
      // Required sections have more weight
      const isRequired = content.layout === layout // This would need layout config
      const weight = isRequired ? 2 : 1
      totalWeight += weight

      if (section.visible) {
        const hasContent = section.data.content || 
                          section.data.url || 
                          section.data.icon ||
                          (section.data.items && Array.isArray(section.data.items) && section.data.items.length > 0)
        
        if (hasContent) {
          completedWeight += weight
        }
      }
    })

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
  } catch (error) {
    console.error('Failed to calculate content completion:', error)
    return 0
  }
}

/**
 * Validate serialized content structure
 */
export function validateSerializedContent(data: Json): boolean {
  try {
    if (!data || typeof data !== 'object') {
      return false
    }

    const content = data as any
    
    // Check required fields
    if (!content.version || !content.layout || !content.sections) {
      return false
    }

    // Check sections structure
    if (typeof content.sections !== 'object') {
      return false
    }

    // Validate each section
    for (const [key, section] of Object.entries(content.sections)) {
      if (!section || typeof section !== 'object') {
        return false
      }

      const sectionObj = section as any
      if (!sectionObj.type || typeof sectionObj.visible !== 'boolean') {
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Failed to validate serialized content:', error)
    return false
  }
}
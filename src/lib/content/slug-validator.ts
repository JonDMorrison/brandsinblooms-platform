'use client'

import { checkSlugAvailability } from '@/src/lib/queries/domains/content'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/lib/database/types'

export interface SlugValidationResult {
  isValid: boolean
  isAvailable: boolean
  status: 'available' | 'taken' | 'invalid' | 'checking'
  message: string
  suggestions?: string[]
}

/**
 * Validates slug format and availability
 */
export class SlugValidator {
  private static readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  private static readonly MIN_LENGTH = 2
  private static readonly MAX_LENGTH = 100
  private static readonly RESERVED_SLUGS = [
    'api', 'admin', 'app', 'www', 'mail', 'ftp', 'blog', 'shop', 'store',
    'support', 'help', 'about', 'contact', 'terms', 'privacy', 'legal',
    'dashboard', 'login', 'register', 'signup', 'signin', 'logout',
    'profile', 'account', 'settings', 'config', 'assets', 'static',
    'public', 'private', 'secure', 'test', 'staging', 'dev', 'development'
  ]

  /**
   * Validates slug format
   */
  static validateFormat(slug: string): { valid: boolean; message: string } {
    if (!slug || slug.trim().length === 0) {
      return { valid: false, message: 'Slug cannot be empty' }
    }

    if (slug.length < this.MIN_LENGTH) {
      return { valid: false, message: `Slug must be at least ${this.MIN_LENGTH} characters long` }
    }

    if (slug.length > this.MAX_LENGTH) {
      return { valid: false, message: `Slug must be no more than ${this.MAX_LENGTH} characters long` }
    }

    if (!this.SLUG_REGEX.test(slug)) {
      return { valid: false, message: 'Slug can only contain lowercase letters, numbers, and hyphens' }
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      return { valid: false, message: 'Slug cannot start or end with a hyphen' }
    }

    if (slug.includes('--')) {
      return { valid: false, message: 'Slug cannot contain consecutive hyphens' }
    }

    if (this.RESERVED_SLUGS.includes(slug)) {
      return { valid: false, message: 'This slug is reserved and cannot be used' }
    }

    return { valid: true, message: 'Slug format is valid' }
  }

  /**
   * Checks slug availability in the database
   */
  static async checkAvailability(
    supabase: SupabaseClient<Database>,
    slug: string,
    siteId: string,
    excludeContentId?: string
  ): Promise<{ available: boolean; message: string }> {
    try {
      const isAvailable = await checkSlugAvailability(
        supabase,
        siteId,
        slug,
        excludeContentId
      )

      if (!isAvailable) {
        return {
          available: false,
          message: 'A page with this name already exists'
        }
      }

      return {
        available: true,
        message: 'Page name is available'
      }

    } catch (error) {
      console.error('Error checking slug availability:', error)
      return {
        available: false,
        message: 'Unable to check availability. Please try again.'
      }
    }
  }

  /**
   * Performs complete slug validation (format + availability)
   */
  static async validateSlug(
    supabase: SupabaseClient<Database>,
    slug: string,
    siteId: string,
    excludeContentId?: string
  ): Promise<SlugValidationResult> {
    // First check format
    const formatValidation = this.validateFormat(slug)

    if (!formatValidation.valid) {
      return {
        isValid: false,
        isAvailable: false,
        status: 'invalid',
        message: formatValidation.message
      }
    }

    // Then check availability
    const availabilityCheck = await this.checkAvailability(supabase, slug, siteId, excludeContentId)

    if (!availabilityCheck.available) {
      const suggestions = this.generateSuggestions(slug)
      return {
        isValid: true,
        isAvailable: false,
        status: 'taken',
        message: availabilityCheck.message,
        suggestions
      }
    }

    return {
      isValid: true,
      isAvailable: true,
      status: 'available',
      message: 'Page name is available and valid'
    }
  }

  /**
   * Generates alternative slug suggestions
   */
  static generateSuggestions(baseSlug: string, count: number = 3): string[] {
    const suggestions: string[] = []
    
    // Add number suffixes
    for (let i = 1; i <= count; i++) {
      suggestions.push(`${baseSlug}-${i}`)
    }
    
    // Add year suffix
    const currentYear = new Date().getFullYear()
    suggestions.push(`${baseSlug}-${currentYear}`)
    
    // Add random variations
    const variations = ['new', 'latest', 'updated', 'v2', 'pro', 'plus']
    for (let i = 0; i < Math.min(2, variations.length); i++) {
      const variation = variations[Math.floor(Math.random() * variations.length)]
      suggestions.push(`${baseSlug}-${variation}`)
    }
    
    return suggestions.slice(0, count)
  }

  /**
   * Generates a slug from a title
   */
  static generateFromTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, this.MAX_LENGTH) // Limit length
  }
}

/**
 * Hook for using slug validation in React components
 */
export function useSlugValidator(supabase: SupabaseClient<Database>, siteId: string, contentId?: string) {
  const validateSlug = async (slug: string): Promise<SlugValidationResult> => {
    return SlugValidator.validateSlug(supabase, slug, siteId, contentId)
  }

  const validateFormat = (slug: string) => {
    return SlugValidator.validateFormat(slug)
  }

  const generateFromTitle = (title: string) => {
    return SlugValidator.generateFromTitle(title)
  }

  const generateSuggestions = (baseSlug: string, count?: number) => {
    return SlugValidator.generateSuggestions(baseSlug, count)
  }

  return {
    validateSlug,
    validateFormat,
    generateFromTitle,
    generateSuggestions
  }
}
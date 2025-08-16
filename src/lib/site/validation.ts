/**
 * Site validation utilities
 * Handles validation for site creation, updates, and domain management
 */

import { 
  isValidSubdomain, 
  isValidCustomDomain, 
  SiteResolution 
} from './resolution'
import { 
  isSubdomainAvailable, 
  isCustomDomainAvailable
} from './queries'
import { SiteInsert, SiteUpdate } from '@/lib/database/aliases'

export interface ValidationError {
  field: string
  code: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface SiteValidationOptions {
  excludeSiteId?: string
  checkAvailability?: boolean
  useServer?: boolean
}

/**
 * Validates site resolution configuration
 */
export function validateSiteResolution(resolution: SiteResolution): ValidationResult {
  const errors: ValidationError[] = []

  if (!resolution.isValid) {
    errors.push({
      field: 'hostname',
      code: 'INVALID_HOSTNAME',
      message: 'Invalid hostname format'
    })
    return { isValid: false, errors }
  }

  if (resolution.type === 'subdomain') {
    if (!isValidSubdomain(resolution.value)) {
      errors.push({
        field: 'subdomain',
        code: 'INVALID_SUBDOMAIN',
        message: 'Invalid subdomain format or reserved subdomain'
      })
    }
  } else if (resolution.type === 'custom_domain') {
    if (!isValidCustomDomain(resolution.value)) {
      errors.push({
        field: 'custom_domain',
        code: 'INVALID_DOMAIN',
        message: 'Invalid custom domain format'
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates site data for creation
 */
export async function validateSiteForCreation(
  siteData: SiteInsert,
  options: SiteValidationOptions = {}
): Promise<ValidationResult> {
  const errors: ValidationError[] = []

  // Required field validation
  if (!siteData.name || siteData.name.trim().length === 0) {
    errors.push({
      field: 'name',
      code: 'REQUIRED',
      message: 'Site name is required'
    })
  } else if (siteData.name.length > 255) {
    errors.push({
      field: 'name',
      code: 'TOO_LONG',
      message: 'Site name must be 255 characters or less'
    })
  }

  if (!siteData.subdomain || siteData.subdomain.trim().length === 0) {
    errors.push({
      field: 'subdomain',
      code: 'REQUIRED',
      message: 'Subdomain is required'
    })
  }

  // Subdomain validation
  if (siteData.subdomain) {
    if (!isValidSubdomain(siteData.subdomain)) {
      errors.push({
        field: 'subdomain',
        code: 'INVALID_FORMAT',
        message: 'Invalid subdomain format or reserved subdomain'
      })
    } else if (options.checkAvailability !== false) {
      // Check availability if not explicitly disabled
      const availabilityResult = await isSubdomainAvailable(
        siteData.subdomain,
        options.excludeSiteId,
        options.useServer
      )
      
      if (availabilityResult.error) {
        errors.push({
          field: 'subdomain',
          code: 'AVAILABILITY_CHECK_FAILED',
          message: 'Could not verify subdomain availability'
        })
      } else if (availabilityResult.data === false) {
        errors.push({
          field: 'subdomain',
          code: 'NOT_AVAILABLE',
          message: 'Subdomain is already taken'
        })
      }
    }
  }

  // Custom domain validation (optional)
  if (siteData.custom_domain) {
    if (!isValidCustomDomain(siteData.custom_domain)) {
      errors.push({
        field: 'custom_domain',
        code: 'INVALID_FORMAT',
        message: 'Invalid custom domain format'
      })
    } else if (options.checkAvailability !== false) {
      const availabilityResult = await isCustomDomainAvailable(
        siteData.custom_domain,
        options.excludeSiteId,
        options.useServer
      )
      
      if (availabilityResult.error) {
        errors.push({
          field: 'custom_domain',
          code: 'AVAILABILITY_CHECK_FAILED',
          message: 'Could not verify custom domain availability'
        })
      } else if (availabilityResult.data === false) {
        errors.push({
          field: 'custom_domain',
          code: 'NOT_AVAILABLE',
          message: 'Custom domain is already in use'
        })
      }
    }
  }

  // Optional field validation
  if (siteData.description && siteData.description.length > 1000) {
    errors.push({
      field: 'description',
      code: 'TOO_LONG',
      message: 'Description must be 1000 characters or less'
    })
  }

  if (siteData.business_name && siteData.business_name.length > 255) {
    errors.push({
      field: 'business_name',
      code: 'TOO_LONG',
      message: 'Business name must be 255 characters or less'
    })
  }

  if (siteData.business_email && !isValidEmail(siteData.business_email)) {
    errors.push({
      field: 'business_email',
      code: 'INVALID_FORMAT',
      message: 'Invalid email format'
    })
  }

  if (siteData.business_phone && !isValidPhone(siteData.business_phone)) {
    errors.push({
      field: 'business_phone',
      code: 'INVALID_FORMAT',
      message: 'Invalid phone number format'
    })
  }

  if (siteData.primary_color && !isValidHexColor(siteData.primary_color)) {
    errors.push({
      field: 'primary_color',
      code: 'INVALID_FORMAT',
      message: 'Invalid hex color format (must be #RRGGBB)'
    })
  }

  if (siteData.latitude !== null && siteData.latitude !== undefined) {
    if (siteData.latitude < -90 || siteData.latitude > 90) {
      errors.push({
        field: 'latitude',
        code: 'OUT_OF_RANGE',
        message: 'Latitude must be between -90 and 90'
      })
    }
  }

  if (siteData.longitude !== null && siteData.longitude !== undefined) {
    if (siteData.longitude < -180 || siteData.longitude > 180) {
      errors.push({
        field: 'longitude',
        code: 'OUT_OF_RANGE',
        message: 'Longitude must be between -180 and 180'
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates site data for updates
 */
export async function validateSiteForUpdate(
  siteId: string,
  siteData: SiteUpdate,
  options: SiteValidationOptions = {}
): Promise<ValidationResult> {
  const errors: ValidationError[] = []

  // Name validation (if provided)
  if (siteData.name !== undefined) {
    if (!siteData.name || siteData.name.trim().length === 0) {
      errors.push({
        field: 'name',
        code: 'REQUIRED',
        message: 'Site name cannot be empty'
      })
    } else if (siteData.name.length > 255) {
      errors.push({
        field: 'name',
        code: 'TOO_LONG',
        message: 'Site name must be 255 characters or less'
      })
    }
  }

  // Subdomain validation (if provided)
  if (siteData.subdomain !== undefined) {
    if (!siteData.subdomain || siteData.subdomain.trim().length === 0) {
      errors.push({
        field: 'subdomain',
        code: 'REQUIRED',
        message: 'Subdomain cannot be empty'
      })
    } else if (!isValidSubdomain(siteData.subdomain)) {
      errors.push({
        field: 'subdomain',
        code: 'INVALID_FORMAT',
        message: 'Invalid subdomain format or reserved subdomain'
      })
    } else if (options.checkAvailability !== false) {
      const availabilityResult = await isSubdomainAvailable(
        siteData.subdomain,
        siteId,
        options.useServer
      )
      
      if (availabilityResult.error) {
        errors.push({
          field: 'subdomain',
          code: 'AVAILABILITY_CHECK_FAILED',
          message: 'Could not verify subdomain availability'
        })
      } else if (availabilityResult.data === false) {
        errors.push({
          field: 'subdomain',
          code: 'NOT_AVAILABLE',
          message: 'Subdomain is already taken'
        })
      }
    }
  }

  // Custom domain validation (if provided)
  if (siteData.custom_domain !== undefined && siteData.custom_domain !== null) {
    if (!isValidCustomDomain(siteData.custom_domain)) {
      errors.push({
        field: 'custom_domain',
        code: 'INVALID_FORMAT',
        message: 'Invalid custom domain format'
      })
    } else if (options.checkAvailability !== false) {
      const availabilityResult = await isCustomDomainAvailable(
        siteData.custom_domain,
        siteId,
        options.useServer
      )
      
      if (availabilityResult.error) {
        errors.push({
          field: 'custom_domain',
          code: 'AVAILABILITY_CHECK_FAILED',
          message: 'Could not verify custom domain availability'
        })
      } else if (availabilityResult.data === false) {
        errors.push({
          field: 'custom_domain',
          code: 'NOT_AVAILABLE',
          message: 'Custom domain is already in use'
        })
      }
    }
  }

  // Apply the same validation rules as creation for other fields
  const otherFieldsValidation = await validateSiteForCreation(
    siteData as SiteInsert,
    { ...options, excludeSiteId: siteId, checkAvailability: false }
  )

  // Filter out required field errors since updates are partial
  const relevantErrors = otherFieldsValidation.errors.filter(error => 
    error.code !== 'REQUIRED'
  )

  errors.push(...relevantErrors)

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates phone number format (basic validation)
 */
function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Must have 10-15 digits
  return digitsOnly.length >= 10 && digitsOnly.length <= 15
}

/**
 * Validates hex color format
 */
function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
  return hexColorRegex.test(color)
}

/**
 * Type guard for hours object
 */
function isValidHoursObject(hours: unknown): hours is { open: string; close: string; closed?: boolean } {
  if (!hours || typeof hours !== 'object') {
    return false
  }
  
  const hoursObj = hours as Record<string, unknown>
  
  // If marked as closed, we don't need open/close times
  if (hoursObj.closed === true) {
    return true
  }
  
  // Otherwise, we need both open and close times as strings
  return typeof hoursObj.open === 'string' && typeof hoursObj.close === 'string'
}

/**
 * Validates business hours format
 */
export function isValidBusinessHours(businessHours: unknown): boolean {
  if (!businessHours || typeof businessHours !== 'object') {
    return false
  }

  const hoursObj = businessHours as Record<string, unknown>
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  for (const day of daysOfWeek) {
    if (hoursObj[day]) {
      const hours = hoursObj[day]
      
      // Type guard for hours object
      if (!isValidHoursObject(hours)) {
        return false
      }
      
      // Skip validation if marked as closed
      if (hours.closed === true) {
        continue
      }
      
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(hours.open) || !timeRegex.test(hours.close)) {
        return false
      }
    }
  }

  return true
}

/**
 * Sanitizes site data before database operations
 */
export function sanitizeSiteData<T extends SiteInsert | SiteUpdate>(siteData: T): T {
  const sanitized = { ...siteData }

  // Trim string fields
  if (sanitized.name) {
    sanitized.name = sanitized.name.trim()
  }
  
  if (sanitized.subdomain) {
    sanitized.subdomain = sanitized.subdomain.trim().toLowerCase()
  }
  
  if (sanitized.custom_domain) {
    sanitized.custom_domain = sanitized.custom_domain.trim().toLowerCase()
  }
  
  if (sanitized.description) {
    sanitized.description = sanitized.description.trim()
  }
  
  if (sanitized.business_name) {
    sanitized.business_name = sanitized.business_name.trim()
  }
  
  if (sanitized.business_email) {
    sanitized.business_email = sanitized.business_email.trim().toLowerCase()
  }
  
  if (sanitized.business_phone) {
    sanitized.business_phone = sanitized.business_phone.trim()
  }

  return sanitized
}
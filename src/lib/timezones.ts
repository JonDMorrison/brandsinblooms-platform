/**
 * IANA timezone data for timezone selector
 * Grouped by region for better organization
 */

export interface TimezoneOption {
  value: string
  label: string
  offset: string
}

/**
 * Get the user's current timezone using Intl API
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    console.error('Failed to detect timezone:', error)
    return 'America/New_York' // Fallback
  }
}

/**
 * Format timezone offset for display
 */
function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })
    const parts = formatter.formatToParts(now)
    const tzPart = parts.find(part => part.type === 'timeZoneName')
    return tzPart ? tzPart.value : ''
  } catch (error) {
    return ''
  }
}

/**
 * Get timezone label with city and offset
 */
function getTimezoneLabel(timezone: string): string {
  const parts = timezone.split('/')
  const city = parts[parts.length - 1].replace(/_/g, ' ')
  const offset = getTimezoneOffset(timezone)
  return offset ? `${city} (${offset})` : city
}

/**
 * All IANA timezones organized by region
 */
export const TIMEZONES: TimezoneOption[] = [
  // Americas
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Montreal',
  'America/Halifax',
  'America/St_Johns',
  'America/Mexico_City',
  'America/Cancun',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Buenos_Aires',
  'America/Sao_Paulo',
  'America/Caracas',
  'America/Panama',
  'America/Guatemala',
  'America/Havana',
  'America/Jamaica',
  'America/Puerto_Rico',
  'America/Regina',
  'America/Winnipeg',
  'America/Edmonton',

  // Europe
  'Europe/London',
  'Europe/Dublin',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Prague',
  'Europe/Warsaw',
  'Europe/Athens',
  'Europe/Stockholm',
  'Europe/Copenhagen',
  'Europe/Oslo',
  'Europe/Helsinki',
  'Europe/Zurich',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Europe/Lisbon',
  'Europe/Budapest',
  'Europe/Bucharest',

  // Asia
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Manila',
  'Asia/Jakarta',
  'Asia/Taipei',
  'Asia/Kuala_Lumpur',
  'Asia/Ho_Chi_Minh',
  'Asia/Karachi',
  'Asia/Dhaka',
  'Asia/Tehran',
  'Asia/Jerusalem',
  'Asia/Riyadh',
  'Asia/Kuwait',
  'Asia/Bahrain',
  'Asia/Qatar',
  'Asia/Muscat',

  // Pacific
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
  'Pacific/Port_Moresby',
  'Pacific/Guadalcanal',
  'Pacific/Noumea',
  'Pacific/Tongatapu',
  'Pacific/Apia',

  // Australia
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Hobart',
  'Australia/Darwin',

  // Africa
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Casablanca',
  'Africa/Algiers',
  'Africa/Tunis',

  // Atlantic
  'Atlantic/Reykjavik',
  'Atlantic/Azores',
  'Atlantic/Cape_Verde',

  // Other
  'UTC',
].map(tz => ({
  value: tz,
  label: getTimezoneLabel(tz),
  offset: getTimezoneOffset(tz),
}))

/**
 * Search timezones by query
 */
export function searchTimezones(query: string): TimezoneOption[] {
  const lowerQuery = query.toLowerCase()
  return TIMEZONES.filter(tz =>
    tz.label.toLowerCase().includes(lowerQuery) ||
    tz.value.toLowerCase().includes(lowerQuery)
  )
}

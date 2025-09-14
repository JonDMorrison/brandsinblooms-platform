/**
 * Icon utility functions for Lucide icon handling
 */

import * as LucideIcons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

/**
 * Get Lucide icon component by name
 */
export const getIcon = (iconName?: string): LucideIcon | null => {
  if (!iconName) return null
  // Convert lowercase icon names to PascalCase for Lucide React
  const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1)
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[pascalCase]
  // Try exact match first, then try with Icon suffix
  return IconComponent || (LucideIcons as unknown as Record<string, LucideIcon>)[`${pascalCase}Icon`] || null
}
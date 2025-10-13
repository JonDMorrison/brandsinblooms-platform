/**
 * Server-side utilities for full site editor
 * Use these in server components to check edit mode status
 */

import { headers } from 'next/headers'
import { EditPermissions } from '@/src/contexts/FullSiteEditorContext'

export interface EditModeStatus {
  isEditMode: boolean
  userId: string | null
  permissions: EditPermissions
}

/**
 * Check if current request is in edit mode
 */
export async function getEditModeStatus(): Promise<EditModeStatus> {
  try {
    const headersList = await headers()
    const isEditMode = headersList.get('x-edit-mode') === 'true'
    const userId = headersList.get('x-edit-user-id')
    const permissionsHeader = headersList.get('x-edit-permissions')

    if (!isEditMode) {
      return {
        isEditMode: false,
        userId: null,
        permissions: {
          canEdit: false,
          canManage: false,
          canPublish: false,
          role: null
        }
      }
    }

    const permissions: EditPermissions = permissionsHeader
      ? JSON.parse(permissionsHeader)
      : {
          canEdit: false,
          canManage: false,
          canPublish: false,
          role: null
        }

    return {
      isEditMode,
      userId,
      permissions
    }
  } catch (error) {
    console.error('Error getting edit mode status:', error)
    return {
      isEditMode: false,
      userId: null,
      permissions: {
        canEdit: false,
        canManage: false,
        canPublish: false,
        role: null
      }
    }
  }
}

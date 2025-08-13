'use server'

import { createLowStockNotification, shouldSendLowStockNotification, getProductStockThreshold } from '@/lib/helpers/notifications'
import { Tables } from '@/lib/database/types'

/**
 * Server action to check and create low stock notifications
 * This is called from client-side hooks to handle server-side notification creation
 */
export async function checkAndCreateLowStockNotification(
  siteId: string,
  product: Tables<'products'>,
  currentStock: number,
  previousStock?: number
) {
  try {
    const threshold = getProductStockThreshold(product)
    
    if (shouldSendLowStockNotification(currentStock, threshold, previousStock)) {
      const notification = await createLowStockNotification(siteId, product, currentStock, threshold)
      return {
        success: true,
        notification: notification?.id,
        threshold,
        triggered: true
      }
    }
    
    return {
      success: true,
      notification: null,
      threshold,
      triggered: false
    }
  } catch (error) {
    console.error('Failed to create low stock notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      threshold: 5,
      triggered: false
    }
  }
}
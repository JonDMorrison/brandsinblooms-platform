/**
 * Export utilities for orders and other data
 * Provides CSV and JSON export functionality
 */

import type { OrderWithCustomer } from '@/lib/queries/domains/orders'

/**
 * Convert data to CSV format and trigger download
 */
export async function exportOrdersToCSV(orders: OrderWithCustomer[]): Promise<void> {
  if (!orders.length) {
    throw new Error('No orders to export')
  }

  try {
    // Define CSV headers
    const headers = [
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Status',
      'Payment Status',
      'Total Amount',
      'Currency',
      'Items Count',
      'Created Date',
      'Updated Date',
      'Shipped Date',
      'Delivered Date'
    ]

    // Convert orders to CSV rows
    const rows = orders.map(order => [
      order.order_number,
      order.customer.full_name || '',
      order.customer.email || '',
      order.status,
      order.payment_status || '',
      order.total_amount.toString(),
      order.currency || 'USD',
      '0', // Items count not available in basic OrderWithCustomer type
      formatDateForExport(order.created_at),
      formatDateForExport(order.updated_at),
      order.shipped_at ? formatDateForExport(order.shipped_at) : '',
      order.delivered_at ? formatDateForExport(order.delivered_at) : ''
    ])

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const filename = `orders_export_${new Date().toISOString().split('T')[0]}.csv`
    
    downloadBlob(blob, filename)
  } catch (error) {
    console.error('Error exporting orders to CSV:', error)
    throw new Error('Failed to export orders to CSV')
  }
}

/**
 * Convert data to JSON format and trigger download
 */
export async function exportOrdersToJSON(orders: OrderWithCustomer[]): Promise<void> {
  if (!orders.length) {
    throw new Error('No orders to export')
  }

  try {
    // Create export data with metadata
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalOrders: orders.length,
        version: '1.0'
      },
      orders: orders.map(order => ({
        orderNumber: order.order_number,
        id: order.id,
        status: order.status,
        paymentStatus: order.payment_status,
        totalAmount: order.total_amount,
        currency: order.currency || 'USD',
        customer: {
          id: order.customer.user_id,
          name: order.customer.full_name,
          email: order.customer.email,
        },
        items: [], // Items not available in basic OrderWithCustomer type
        addresses: {
          shipping: order.shipping_address,
          billing: order.billing_address
        },
        dates: {
          created: order.created_at,
          updated: order.updated_at,
          shipped: order.shipped_at,
          delivered: order.delivered_at
        },
        amounts: {
          subtotal: order.total_amount, // subtotal_amount not available
          tax: order.tax_amount,
          shipping: order.shipping_amount,
          total: order.total_amount
        }
      }))
    }

    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const filename = `orders_export_${new Date().toISOString().split('T')[0]}.json`
    
    downloadBlob(blob, filename)
  } catch (error) {
    console.error('Error exporting orders to JSON:', error)
    throw new Error('Failed to export orders to JSON')
  }
}

/**
 * Export selected orders with additional context
 */
export async function exportSelectedOrders(
  orders: OrderWithCustomer[],
  format: 'csv' | 'json' = 'csv',
  options: {
    includeCustomerDetails?: boolean
    includeItems?: boolean
    includeAddresses?: boolean
  } = {}
): Promise<void> {
  if (!orders.length) {
    throw new Error('No orders selected for export')
  }

  const {
    includeCustomerDetails = true,
    includeItems = false,
    includeAddresses = false
  } = options

  try {
    if (format === 'csv') {
      await exportOrdersToCSV(orders)
    } else {
      await exportOrdersToJSON(orders)
    }
  } catch (error) {
    console.error('Error exporting selected orders:', error)
    throw error
  }
}

/**
 * Export orders with custom filters applied
 */
export async function exportFilteredOrders(
  orders: OrderWithCustomer[],
  filters: {
    status?: string
    dateRange?: { from: Date; to: Date }
    minAmount?: number
    maxAmount?: number
  },
  format: 'csv' | 'json' = 'csv'
): Promise<void> {
  let filteredOrders = [...orders]

  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === filters.status)
  }

  // Apply date range filter
  if (filters.dateRange) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= filters.dateRange!.from && orderDate <= filters.dateRange!.to
    })
  }

  // Apply amount filters
  if (filters.minAmount !== undefined) {
    filteredOrders = filteredOrders.filter(order => order.total_amount >= filters.minAmount!)
  }

  if (filters.maxAmount !== undefined) {
    filteredOrders = filteredOrders.filter(order => order.total_amount <= filters.maxAmount!)
  }

  if (!filteredOrders.length) {
    throw new Error('No orders match the specified filters')
  }

  if (format === 'csv') {
    await exportOrdersToCSV(filteredOrders)
  } else {
    await exportOrdersToJSON(filteredOrders)
  }
}

/**
 * Create order summary report for export
 */
export async function exportOrderSummary(orders: OrderWithCustomer[]): Promise<void> {
  if (!orders.length) {
    throw new Error('No orders to summarize')
  }

  try {
    // Calculate summary statistics
    const summary = {
      metadata: {
        reportDate: new Date().toISOString(),
        totalOrders: orders.length,
        dateRange: {
          from: Math.min(...orders.map(o => new Date(o.created_at).getTime())),
          to: Math.max(...orders.map(o => new Date(o.created_at).getTime()))
        }
      },
      statistics: {
        totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
        averageOrderValue: orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length,
        statusBreakdown: orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        paymentStatusBreakdown: orders.reduce((acc, order) => {
          const status = order.payment_status || 'unknown'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        monthlyBreakdown: orders.reduce((acc, order) => {
          const month = new Date(order.created_at).toISOString().slice(0, 7) // YYYY-MM
          acc[month] = (acc[month] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      topCustomers: Object.entries(
        orders.reduce((acc, order) => {
          const email = order.customer.email || 'unknown'
          if (!acc[email]) {
            acc[email] = {
              name: order.customer.full_name || 'Unknown',
              email,
              orders: 0,
              totalSpent: 0
            }
          }
          acc[email].orders++
          acc[email].totalSpent += order.total_amount
          return acc
        }, {} as Record<string, any>)
      )
        .map(([_, customer]) => customer)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
    }

    const jsonContent = JSON.stringify(summary, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const filename = `orders_summary_${new Date().toISOString().split('T')[0]}.json`
    
    downloadBlob(blob, filename)
  } catch (error) {
    console.error('Error exporting order summary:', error)
    throw new Error('Failed to export order summary')
  }
}

/**
 * Helper function to format dates for export
 */
function formatDateForExport(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Helper function to trigger file download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Validate export data before processing
 */
function validateExportData(orders: OrderWithCustomer[]): void {
  if (!Array.isArray(orders)) {
    throw new Error('Invalid orders data: expected array')
  }

  if (orders.length === 0) {
    throw new Error('No orders to export')
  }

  // Validate essential fields
  const hasValidOrders = orders.every(order => 
    order.id && 
    order.order_number && 
    typeof order.total_amount === 'number' &&
    order.created_at
  )

  if (!hasValidOrders) {
    throw new Error('Invalid order data: missing required fields')
  }
}

// Export all functions
export {
  validateExportData,
  formatDateForExport,
  downloadBlob
}
'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import {
  X,
  MoreHorizontal,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { exportSelectedOrders, exportOrdersToCSV, exportOrdersToJSON } from '@/src/lib/utils/export'
import { useUpdateOrderStatus, useDeleteOrders } from '@/src/hooks/useOrderMutations'
import { toast } from 'sonner'
import type { OrderWithCustomer } from '@/lib/queries/domains/orders'

interface BulkActionsToolbarProps {
  selectedOrders: OrderWithCustomer[]
  onClearSelection: () => void
  onOrdersUpdated?: () => void
}

const ORDER_STATUS_OPTIONS = [
  { value: 'processing', label: 'Processing', icon: Package },
  { value: 'shipped', label: 'Shipped', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
]

export function BulkActionsToolbar({ 
  selectedOrders, 
  onClearSelection, 
  onOrdersUpdated 
}: BulkActionsToolbarProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  const updateOrderStatus = useUpdateOrderStatus()
  const deleteOrders = useDeleteOrders()

  if (selectedOrders.length === 0) {
    return null
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!newStatus || selectedOrders.length === 0) return

    setIsUpdatingStatus(true)
    try {
      // Update status for all selected orders
      const updatePromises = selectedOrders.map(order =>
        updateOrderStatus.mutateAsync({
          orderId: order.id,
          status: newStatus as any,
        })
      )

      await Promise.all(updatePromises)
      
      toast.success(
        `Successfully updated ${selectedOrders.length} order${selectedOrders.length > 1 ? 's' : ''} to ${newStatus}`
      )
      
      onClearSelection()
      onOrdersUpdated?.()
    } catch (error) {
      console.error('Error updating order statuses:', error)
      toast.error('Failed to update order statuses')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      await exportOrdersToCSV(selectedOrders)
      toast.success(`Exported ${selectedOrders.length} orders to CSV`)
    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Failed to export orders')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJSON = async () => {
    setIsExporting(true)
    try {
      await exportOrdersToJSON(selectedOrders)
      toast.success(`Exported ${selectedOrders.length} orders to JSON`)
    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Failed to export orders')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteOrders = async () => {
    if (selectedOrders.length === 0) return

    try {
      const orderIds = selectedOrders.map(order => order.id)
      await deleteOrders.mutateAsync(orderIds)
      
      toast.success(
        `Successfully deleted ${selectedOrders.length} order${selectedOrders.length > 1 ? 's' : ''}`
      )
      
      onClearSelection()
      onOrdersUpdated?.()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting orders:', error)
      toast.error('Failed to delete orders')
    }
  }

  const getStatusBreakdown = () => {
    const breakdown: Record<string, number> = {}
    selectedOrders.forEach(order => {
      breakdown[order.status] = (breakdown[order.status] || 0) + 1
    })
    return breakdown
  }

  const statusBreakdown = getStatusBreakdown()
  const totalValue = selectedOrders.reduce((sum, order) => sum + order.total_amount, 0)

  return (
    <>
      <Card className="border-primary/20 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Selection Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {selectedOrders.length} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Status Breakdown */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Status:</span>
                <div className="flex gap-1">
                  {Object.entries(statusBreakdown).map(([status, count]) => (
                    <Badge key={status} variant="outline" className="text-xs">
                      {status}: {count}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Total Value */}
              <div className="text-sm text-muted-foreground">
                Total: {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(totalValue)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Status Update */}
              <div className="flex items-center gap-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS_OPTIONS.map((option) => {
                      const Icon = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(selectedStatus)}
                  disabled={!selectedStatus || isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </div>

              {/* Export Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isExporting}>
                    {isExporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Orders
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quick Status Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground">Quick actions:</span>
            {ORDER_STATUS_OPTIONS.map((option) => {
              const Icon = option.icon
              const hasOrdersWithThisStatus = statusBreakdown[option.value] > 0
              
              return (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(option.value)}
                  disabled={isUpdatingStatus || hasOrdersWithThisStatus}
                  className="h-8"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  Mark {option.label}
                  {hasOrdersWithThisStatus && (
                    <Badge variant="secondary" className="ml-2 h-4 text-xs">
                      {statusBreakdown[option.value]}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Orders</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedOrders.length} selected order{selectedOrders.length > 1 ? 's' : ''}? 
              This action cannot be undone.
              
              {selectedOrders.length <= 5 && (
                <div className="mt-3 space-y-1">
                  <p className="font-medium text-sm">Orders to be deleted:</p>
                  {selectedOrders.map(order => (
                    <p key={order.id} className="text-xs text-muted-foreground">
                      #{order.order_number} - {order.customer.full_name || order.customer.email}
                    </p>
                  ))}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrders}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrders.loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Orders'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
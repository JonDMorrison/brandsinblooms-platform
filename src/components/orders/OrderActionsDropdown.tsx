'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Printer, 
  Package, 
  Download,
  Trash2,
  RefreshCw,
  FileText
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
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
import { OrderWithCustomer } from '@/lib/queries/domains/orders'
import { useOrderMutations } from '@/hooks/useOrderMutations'
import { toast } from 'sonner'

interface OrderActionsDropdownProps {
  order: OrderWithCustomer
}

export function OrderActionsDropdown({ order }: OrderActionsDropdownProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteOrder, updateOrderStatus } = useOrderMutations()

  const handleViewDetails = () => {
    // This will open the OrderDetailsSheet - implemented in parent component
    router.push(`/dashboard/orders/${order.id}`)
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: newStatus,
        notes: `Status updated to ${newStatus}`,
      })
      toast.success('Order status updated successfully')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update order status'
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteOrder.mutateAsync(order.id)
      toast.success('Order deleted successfully')
      setShowDeleteDialog(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete order'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePrintInvoice = () => {
    // In a real implementation, this would generate and open a PDF
    toast.info('Generating invoice PDF...')
    window.open(`/api/orders/${order.id}/invoice.pdf`, '_blank')
  }

  const handlePrintPackingSlip = () => {
    // In a real implementation, this would generate and open a PDF
    toast.info('Generating packing slip PDF...')
    window.open(`/api/orders/${order.id}/packing-slip.pdf`, '_blank')
  }

  const handleExport = () => {
    // In a real implementation, this would export order data
    toast.info('Exporting order data...')
    const orderData = {
      orderNumber: order.order_number,
      customer: order.customer,
      total: order.total_amount,
      status: order.status,
      createdAt: order.created_at,
    }
    
    const blob = new Blob([JSON.stringify(orderData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-${order.order_number}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const canUpdateStatus = order.status !== 'delivered' && order.status !== 'cancelled'
  const canDelete = order.status === 'cancelled' || order.status === 'processing'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {canUpdateStatus && (
            <>
              {order.status === 'processing' && (
                <DropdownMenuItem onClick={() => handleUpdateStatus('shipped')}>
                  <Package className="mr-2 h-4 w-4" />
                  Mark as Shipped
                </DropdownMenuItem>
              )}
              {order.status === 'shipped' && (
                <DropdownMenuItem onClick={() => handleUpdateStatus('delivered')}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Mark as Delivered
                </DropdownMenuItem>
              )}
              {order.status !== 'cancelled' && (
                <DropdownMenuItem 
                  onClick={() => handleUpdateStatus('cancelled')}
                  className="text-red-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Cancel Order
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem onClick={handlePrintInvoice}>
            <FileText className="mr-2 h-4 w-4" />
            Print Invoice
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handlePrintPackingSlip}>
            <Printer className="mr-2 h-4 w-4" />
            Print Packing Slip
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </DropdownMenuItem>
          
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Order
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order #{order.order_number}? 
              This action cannot be undone and will permanently remove all order data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
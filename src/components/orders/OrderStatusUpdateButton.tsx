'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog'
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
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { OrderStatus } from '@/src/lib/database/aliases'
import { useOrderMutations } from '@/hooks/useOrderMutations'
import { toast } from 'sonner'
import { Package, Truck, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react'

interface OrderStatusUpdateButtonProps {
  orderId: string
  currentStatus: OrderStatus
  onSuccess?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

// Status configuration with icons and colors
const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600' },
  processing: { label: 'Processing', icon: Package, color: 'text-blue-600' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-600' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600' },
  refunded: { label: 'Refunded', icon: DollarSign, color: 'text-gray-600' },
} as const

// Business rules for allowed status transitions
// Focus on fulfillment statuses only - payment statuses (pending/refunded) managed separately
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: [], // Payment status - not managed here
  processing: ['shipped', 'delivered', 'cancelled'],
  shipped: ['processing', 'delivered', 'cancelled'],
  delivered: ['processing', 'shipped', 'cancelled'],
  cancelled: ['processing', 'shipped', 'delivered'],
  refunded: [], // Payment status - not managed here
}

export function OrderStatusUpdateButton({
  orderId,
  currentStatus,
  onSuccess,
  variant = 'default',
  size = 'default',
}: OrderStatusUpdateButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)
  const [notes, setNotes] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { updateStatus } = useOrderMutations()
  // Filter out current status from available options (no need to change to same status)
  const availableStatuses = allowedTransitions[currentStatus].filter(
    status => status !== currentStatus
  )
  const isTerminal = availableStatuses.length === 0

  const handleStatusChange = async () => {
    if (!selectedStatus) return

    // Show confirmation dialog for cancellation
    if (selectedStatus === 'cancelled') {
      setShowCancelConfirm(true)
      return
    }

    await performUpdate()
  }

  const performUpdate = async () => {
    if (!selectedStatus) return

    try {
      await updateStatus.mutateAsync({
        orderId,
        status: selectedStatus,
        notes: notes.trim() || undefined,
      })

      toast.success(`Order marked as ${statusConfig[selectedStatus].label.toLowerCase()}`)
      setOpen(false)
      setSelectedStatus(null)
      setNotes('')
      onSuccess?.()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update order status'
      toast.error(message)
    }
  }

  const handleCancelConfirm = async () => {
    setShowCancelConfirm(false)
    await performUpdate()
  }

  // Don't render button for payment-related statuses (pending/refunded)
  if (isTerminal) {
    return null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size}>
            Update Status
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of this order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Status Display */}
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                {(() => {
                  const Icon = statusConfig[currentStatus].icon
                  return <Icon className={`h-4 w-4 ${statusConfig[currentStatus].color}`} />
                })()}
                <span className="font-medium">{statusConfig[currentStatus].label}</span>
              </div>
            </div>

            {/* New Status Selection */}
            <div className="space-y-2">
              <Label htmlFor="status">Change To</Label>
              <RadioGroup value={selectedStatus || ''} onValueChange={(value) => setSelectedStatus(value as OrderStatus)}>
                {availableStatuses.map((status) => {
                  const config = statusConfig[status]
                  const Icon = config.icon

                  return (
                    <div key={status} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted cursor-pointer">
                      <RadioGroupItem value={status} id={status} />
                      <Label htmlFor={status} className="flex items-center gap-2 cursor-pointer flex-1">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span>{config.label}</span>
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            {/* Optional Notes Field */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Notes will be recorded in the order history
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!selectedStatus || updateStatus.loading}
            >
              {updateStatus.loading ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Confirmation Dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
              {notes.trim() && (
                <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                  <strong className="block mb-1">Cancellation Note:</strong>
                  <span className="text-foreground">{notes}</span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

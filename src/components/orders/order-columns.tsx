'use client'

import { ColumnDef, Row } from '@tanstack/react-table'
import { ArrowUpDown, Calendar, Eye, MoreHorizontal, DollarSign, User, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Avatar, AvatarImage, AvatarFallback } from '@/src/components/ui/avatar'
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge'
import { OrderActionsDropdown } from './OrderActionsDropdown'
import { formatDistanceToNow } from 'date-fns'
import { OrderWithCustomer } from '@/lib/queries/domains/orders'

// Payment status badge component
function PaymentStatusBadge({ status }: { status: string | null }) {
  if (!status) return null
  
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800  '
      case 'pending':
        return 'bg-yellow-100 text-yellow-800  '
      case 'failed':
        return 'bg-red-100 text-red-800  '
      case 'refunded':
        return 'bg-gray-100 text-gray-800  '
      default:
        return 'bg-gray-100 text-gray-800  '
    }
  }

  return (
    <Badge className={getStatusConfig(status)}>
      {status}
    </Badge>
  )
}

// Customer cell component
function CustomerCell({ row }: { row: Row<OrderWithCustomer> }) {
  const { customer } = row.original
  const initials = customer.full_name 
    ? customer.full_name.split(' ').map(name => name[0]).join('').toUpperCase()
    : customer.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={customer.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">
          {customer.full_name || 'Unknown Customer'}
        </div>
        <div className="text-sm text-gray-500 truncate">
          {customer.email}
        </div>
      </div>
    </div>
  )
}

// Order number cell component
function OrderNumberCell({ row }: { row: Row<OrderWithCustomer> }) {
  const router = useRouter()
  const { id, order_number } = row.original

  return (
    <Button
      variant="link" 
      className="h-auto p-0 font-mono font-medium text-left justify-start"
      onClick={() => router.push(`/dashboard/orders/${id}`)}
    >
      #{order_number}
    </Button>
  )
}

export const orderColumns: ColumnDef<OrderWithCustomer>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "order_number",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: OrderNumberCell,
  },
  {
    accessorKey: "customer",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: CustomerCell,
    sortingFn: (rowA, rowB) => {
      const nameA = rowA.original.customer.full_name || rowA.original.customer.email || ''
      const nameB = rowB.original.customer.full_name || rowB.original.customer.email || ''
      return nameA.localeCompare(nameB)
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return <OrderStatusBadge status={status as any} showIcon />
    },
  },
  {
    accessorKey: "payment_status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Payment
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const paymentStatus = row.getValue("payment_status") as string | null
      return (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <PaymentStatusBadge status={paymentStatus} />
        </div>
      )
    },
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = row.getValue("total_amount") as number
      const currency = row.original.currency || 'USD'
      return (
        <div className="flex items-center gap-2 font-medium">
          <DollarSign className="h-4 w-4 text-gray-500" />
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
          }).format(amount)}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <div className="flex flex-col">
            <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
            <span className="text-xs">{date.toLocaleDateString()}</span>
          </div>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <OrderActionsDropdown order={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
]
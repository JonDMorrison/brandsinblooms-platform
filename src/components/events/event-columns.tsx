'use client'

import { ColumnDef, Row } from '@tanstack/react-table'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
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
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Copy, Eye, EyeOff, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDeleteEvent, usePublishEvent, useUnpublishEvent, useDuplicateEvent } from '@/src/hooks/useEvents'

export interface EventItem {
  id: string
  title: string
  event_date: Date
  location?: string
  status: 'draft' | 'published' | 'unpublished'
  is_all_day: boolean
}

function ActionsCell({
  row,
  onDeleteSuccess
}: {
  row: Row<EventItem>
  onDeleteSuccess?: () => void
}) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { mutate: deleteEvent, loading: isDeleting } = useDeleteEvent()
  const { mutate: publishEvent } = usePublishEvent()
  const { mutate: unpublishEvent } = useUnpublishEvent()
  const { mutate: duplicateEvent } = useDuplicateEvent()

  const eventItem = row.original

  const handleDelete = async () => {
    try {
      await deleteEvent(eventItem.id)
      setShowDeleteDialog(false)
      toast.success('Event deleted successfully')
      onDeleteSuccess?.()
    } catch (error: unknown) {
      console.error('Delete error:', error)
      toast.error('Failed to delete event')
    }
  }

  const handlePublishToggle = async () => {
    try {
      if (eventItem.status === 'published') {
        await unpublishEvent(eventItem.id)
        toast.success('Event unpublished')
      } else {
        await publishEvent(eventItem.id)
        toast.success('Event published')
      }
      onDeleteSuccess?.()
    } catch (error: unknown) {
      console.error('Publish toggle error:', error)
      toast.error('Failed to update event status')
    }
  }

  const handleDuplicate = async (days: number) => {
    try {
      const newEvent = await duplicateEvent({ id: eventItem.id, daysOffset: days })
      if (!newEvent) {
        throw new Error('Failed to duplicate event')
      }
      toast.success(`Event duplicated ${days} days ahead`)
      router.push(`/dashboard/events/edit/${newEvent.id}`)
    } catch (error: unknown) {
      console.error('Duplicate error:', error)
      toast.error('Failed to duplicate event')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/dashboard/events/edit/${eventItem.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePublishToggle}>
            {eventItem.status === 'published' ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDuplicate(7)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate +7 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDuplicate(30)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate +30 Days
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventItem.title}"? This action cannot be undone and will permanently remove this event from your site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const createEventColumns = (
  refreshEvents?: () => void,
  refreshStats?: () => void
): ColumnDef<EventItem>[] => [
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
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Event Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{item.title}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "event_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("event_date") as Date
      const isAllDay = row.original.is_all_day
      return (
        <div className="text-sm">
          <div className="font-medium">{format(date, 'PPP')}</div>
          {!isAllDay && (
            <div className="text-gray-500">{format(date, 'p')}</div>
          )}
          {isAllDay && (
            <div className="text-gray-500">All Day</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const location = row.getValue("location") as string | undefined
      return location ? (
        <span className="text-sm text-gray-600">{location}</span>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as EventItem['status']
      const statusColors = {
        draft: 'bg-gray-100 text-gray-800',
        published: 'bg-green-100 text-green-800',
        unpublished: 'bg-red-100 text-red-800',
      }
      return (
        <Badge className={statusColors[status]}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        onDeleteSuccess={() => {
          refreshEvents?.()
          refreshStats?.()
        }}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

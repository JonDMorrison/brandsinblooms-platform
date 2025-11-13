'use client'

import { ColumnDef, Row } from '@tanstack/react-table'
import { ArrowUpDown, Calendar, MoreHorizontal, Edit, Trash2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { formatDistanceToNow } from 'date-fns'
import { useDeleteContent } from '@/src/hooks/useContent'
import { toast } from 'sonner'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { getCustomerSiteFullUrl } from '@/src/lib/site/url-utils'

export interface ContentItem {
  id: string
  title: string
  slug: string
  type: 'page' | 'blog'
  layout?: 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact' | 'other'
  status: 'published' | 'draft' | 'archived'
  lastModified: Date
}

const getStatusColor = (status: ContentItem['status']) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800  '
    case 'draft':
      return 'bg-yellow-100 text-yellow-800  '
    case 'archived':
      return 'bg-gray-100 text-gray-800  '
    default:
      return 'bg-gray-100 text-gray-800  '
  }
}

const getTypeIcon = (type: ContentItem['type'], layout?: ContentItem['layout']) => {
  // Use layout-specific icons if available
  if (layout) {
    const layoutIcons = {
      landing: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'L' },
      blog: { bg: 'bg-green-100', text: 'text-green-600', icon: 'B' },
      portfolio: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'P' },
      about: { bg: 'bg-orange-100', text: 'text-orange-600', icon: 'A' },
      product: { bg: 'bg-pink-100', text: 'text-pink-600', icon: 'Pr' },
      contact: { bg: 'bg-cyan-100', text: 'text-cyan-600', icon: 'C' },
      other: { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'P' }  // Generic page
    }
    const config = layoutIcons[layout]
    if (config) {
      return (
        <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1 ${config.bg} rounded ${config.text} text-xs font-medium`}>
          {config.icon}
        </span>
      )
    }
  }
  
  // Fallback to type-based icons
  return type === 'blog' ? (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100  rounded text-green-600  text-xs font-medium">B</span>
  ) : (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100  rounded text-gray-600  text-xs font-medium">P</span>
  )
}

const getLayoutLabel = (layout?: ContentItem['layout'], type?: ContentItem['type']) => {
  if (!layout) return type === 'blog' ? 'Blog' : 'Page'
  
  const labels = {
    landing: 'Landing',
    blog: 'Blog',
    portfolio: 'Portfolio',
    about: 'About',
    product: 'Product',
    contact: 'Contact',
    other: 'Page'  // 'other' layout shows as generic 'Page'
  }
  
  return labels[layout] || 'Page'
}

// Title cell component with clickable link to customer site
function TitleCell({ row }: { row: Row<ContentItem> }) {
  const { currentSite } = useSiteContext()
  const item = row.original

  const handleTitleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!currentSite) {
      toast.error('Site information not available')
      return
    }

    // Build the customer site URL
    const baseUrl = getCustomerSiteFullUrl(currentSite)
    // Handle home page (empty slug or "home") - just use base URL
    const pageUrl = !item.slug || item.slug === 'home' ? baseUrl : `${baseUrl}/${item.slug}`

    // Open in new tab - edit mode will auto-enable via middleware
    window.open(pageUrl, '_blank')
  }

  return (
    <div className="flex items-center gap-3">
      {getTypeIcon(item.type, item.layout)}
      <button
        onClick={handleTitleClick}
        className="group flex items-center gap-2 font-medium hover:text-primary transition-colors text-left cursor-pointer"
        disabled={!currentSite}
        aria-label={`Open ${item.title} in new tab`}
      >
        <span>{item.title}</span>
        <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  )
}

// Actions cell component to handle navigation
function ActionsCell({ 
  row, 
  onDeleteSuccess 
}: { 
  row: Row<ContentItem>
  onDeleteSuccess?: () => void 
}) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { mutate: deleteContent, loading: isDeleting } = useDeleteContent()
  const contentItem = row.original

  const handleDelete = async () => {
    try {
      await deleteContent(contentItem.id)
      setShowDeleteDialog(false)
      toast.success('Page deleted successfully')
      // Refresh the content list
      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
    } catch (error: unknown) {
      toast.error('Failed to delete content. Please try again.')
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
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/content/editor?id=${row.original.id}`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
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
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{contentItem.title}"? This action cannot be undone and will permanently remove this {contentItem.type} from your site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Function to create columns with refresh callbacks
export const createContentColumns = (
  refreshContent?: () => void,
  refreshStats?: () => void
): ColumnDef<ContentItem>[] => [
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <TitleCell row={row} />,
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const item = row.original
      return (
        <Badge variant="outline" className="capitalize">
          {getLayoutLabel(item.layout, item.type)}
        </Badge>
      )
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
      const status = row.getValue("status") as ContentItem['status']
      return (
        <Badge className={getStatusColor(status)}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "lastModified",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Modified
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("lastModified") as Date
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
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
          refreshContent?.()
          refreshStats?.()
        }} 
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

// Export the old static columns for backward compatibility
export const contentColumns = createContentColumns()
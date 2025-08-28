'use client'

import { ColumnDef, Row } from '@tanstack/react-table'
import { ArrowUpDown, Calendar, Eye, MoreHorizontal, Edit, Trash2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'

export interface ContentItem {
  id: string
  title: string
  type: 'page' | 'blog'
  layout?: 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact' | 'other'
  status: 'published' | 'draft' | 'archived'
  lastModified: Date
  views: number
  author: string
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

// Actions cell component to handle navigation
function ActionsCell({ row }: { row: Row<ContentItem> }) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/dashboard/content/editor?id=${row.original.id}`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const contentColumns: ColumnDef<ContentItem>[] = [
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
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex items-center gap-3">
          {getTypeIcon(item.type, item.layout)}
          <span className="font-medium">{item.title}</span>
        </div>
      )
    },
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
    accessorKey: "author",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Author
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {row.getValue("author")}
        </div>
      )
    },
  },
  {
    accessorKey: "views",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Views
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const views = row.getValue("views") as number
      return (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          {views.toLocaleString()}
        </div>
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ActionsCell,
    enableSorting: false,
    enableHiding: false,
  },
]
'use client';

import React, { memo, useState } from 'react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { ProductImage } from '@/src/components/ui/product-image';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { ProductCard } from '@/src/components/ProductCard';
import { cn } from '@/src/lib/utils';

interface ProductDisplay {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  stock: 'in-stock' | 'low-stock' | 'out-of-stock';
  image: string;
  featured: boolean;
  addedToSite: boolean;
}

interface ProductsTableProps {
  products: ProductDisplay[];
  loading?: boolean;
  onProductEdit?: (productId: string) => void;
}

const stockLabels = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

const stockColors = {
  'in-stock': 'bg-green-100 text-green-800',
  'low-stock': 'bg-yellow-100 text-yellow-800',
  'out-of-stock': 'bg-red-100 text-red-800',
};

export const ProductsTable = memo(({
  products,
  loading = false,
  onProductEdit,
}: ProductsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false }, // Default sort by name A-Z
  ]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const columns: ColumnDef<ProductDisplay>[] = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            toggleRow(row.id);
          }}
        >
          {expandedRows[row.id] ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
    },
    {
      id: 'image',
      header: '',
      cell: ({ row }) => (
        <div className="w-12 h-12">
          <ProductImage
            src={row.original.image}
            alt={row.original.name}
            productName={row.original.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-md object-cover"
            priority={false}
            showLoadingState={false}
          />
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent"
          >
            Name
            {column.getIsSorted() === 'asc' && ' ▲'}
            {column.getIsSorted() === 'desc' && ' ▼'}
            {!column.getIsSorted() && ' ⇅'}
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.name}</span>
            {row.original.featured && (
              <Badge className="bg-blue-600 text-white text-xs">Featured</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent"
          >
            Category
            {column.getIsSorted() === 'asc' && ' ▲'}
            {column.getIsSorted() === 'desc' && ' ▼'}
            {!column.getIsSorted() && ' ⇅'}
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.category}</span>
      ),
    },
    {
      accessorKey: 'price',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent"
          >
            Price
            {column.getIsSorted() === 'asc' && ' ▲'}
            {column.getIsSorted() === 'desc' && ' ▼'}
            {!column.getIsSorted() && ' ⇅'}
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold">${row.original.price}</span>
            {row.original.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${row.original.originalPrice}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'stock',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent"
          >
            Stock
            {column.getIsSorted() === 'asc' && ' ▲'}
            {column.getIsSorted() === 'desc' && ' ▼'}
            {!column.getIsSorted() && ' ⇅'}
          </Button>
        );
      },
      cell: ({ row }) => (
        <Badge className={stockColors[row.original.stock]} variant="outline">
          {stockLabels[row.original.stock]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (onProductEdit) {
              onProductEdit(row.original.id);
            }
          }}
          disabled={!onProductEdit}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your filters or search query
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                {/* Main Row */}
                <TableRow
                  className={cn(
                    'cursor-pointer transition-colors',
                    expandedRows[row.id] && 'bg-muted/50'
                  )}
                  onClick={() => toggleRow(row.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === 'name' && 'font-medium',
                        cell.column.id === 'expand' && 'w-12',
                        cell.column.id === 'image' && 'w-16',
                        cell.column.id === 'actions' && 'w-24'
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Expanded Card Row */}
                {expandedRows[row.id] && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={columns.length} className="p-6 bg-muted/30">
                      <div className="max-w-sm mx-auto">
                        <ProductCard
                          product={row.original}
                          onEdit={onProductEdit ? () => onProductEdit(row.original.id) : undefined}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Products Count */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {products.length} product{products.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
});

ProductsTable.displayName = 'ProductsTable';

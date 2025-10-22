'use client';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import {
  Search,
  Filter,
  FolderTree,
} from 'lucide-react';

interface Category {
  value: string;
  label: string;
  count?: number;
  icon?: string;
  color?: string;
}

interface ProductsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  activeFilter: 'all' | 'active';
  onFilterChange: (filter: 'all' | 'active') => void;
  onManageCategories: () => void;
}

export function ProductsToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  activeFilter,
  onFilterChange,
  onManageCategories,
}: ProductsToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      {/* Left side: Search and Filters */}
      <div className="flex flex-1 flex-col sm:flex-row gap-4 w-full lg:w-auto">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
                {category.count !== undefined && ` (${category.count})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right side: View Controls and Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter Toggle: All Products / Active on Site */}
        <ToggleGroup
          type="single"
          value={activeFilter}
          onValueChange={(value) => value && onFilterChange(value as 'all' | 'active')}
          className="border rounded-md"
        >
          <ToggleGroupItem value="all" aria-label="All products" className="px-4">
            All Products
          </ToggleGroupItem>
          <ToggleGroupItem value="active" aria-label="Active on site" className="px-4">
            Active on Site
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Manage Categories */}
        <Button variant="outline" size="sm" onClick={onManageCategories}>
          <FolderTree className="h-4 w-4 mr-2" />
          Categories
        </Button>
      </div>
    </div>
  );
}

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
import { Checkbox } from '@/src/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import {
  Search,
  Grid3X3,
  List,
  Filter,
  Download,
  Upload,
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
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  showBulkSelection: boolean;
  onToggleBulkMode: () => void;
  allSelected: boolean;
  indeterminate: boolean;
  onSelectAll: () => void;
  hasSelection: boolean;
  onImportExport: () => void;
  onManageCategories: () => void;
}

export function ProductsToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  viewMode,
  onViewModeChange,
  showBulkSelection,
  onToggleBulkMode,
  allSelected,
  indeterminate,
  onSelectAll,
  hasSelection,
  onImportExport,
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
        {/* Bulk Selection Checkbox */}
        {showBulkSelection && (
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              ref={(ref) => {
                if (ref) {
                  (ref as HTMLButtonElement).indeterminate = indeterminate;
                }
              }}
            />
            <span className="text-sm">Select All</span>
          </div>
        )}

        {/* Bulk Mode Toggle */}
        <Button
          variant={showBulkSelection ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleBulkMode}
        >
          {showBulkSelection ? 'Exit Bulk Mode' : 'Bulk Select'}
        </Button>

        {/* Import/Export */}
        <Button variant="outline" size="sm" onClick={onImportExport}>
          <Download className="h-4 w-4 mr-2" />
          Import/Export
        </Button>

        {/* Manage Categories */}
        <Button variant="outline" size="sm" onClick={onManageCategories}>
          <FolderTree className="h-4 w-4 mr-2" />
          Categories
        </Button>

        {/* View Mode Toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && onViewModeChange(value as 'grid' | 'list')}
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid3X3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}

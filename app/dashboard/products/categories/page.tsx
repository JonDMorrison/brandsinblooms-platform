'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CategoryEditor } from '@/components/categories/CategoryEditor';
import {
  useCategoriesHierarchy,
  useCreateCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch categories (showing all categories - no filtering)
  const {
    data,
    loading,
    error
  } = useCategoriesHierarchy({
    includeInactive: true, // Show all categories (both active and inactive)
  });
  const categories = data ?? [];

  // Get selected category for editing
  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  // Mutations
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory(selectedCategory || '');

  // Handlers
  const handleCreateCategory = async (data: any) => {
    try {
      await createCategory.mutateAsync(data);
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleUpdateCategory = async (data: any) => {
    if (!selectedCategory) return;

    try {
      await updateCategory.mutateAsync(data);
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };


  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Error loading categories</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Categories</h1>
          <p className="text-gray-500">
            Organize your products with hierarchical categories
          </p>
        </div>
        <Button className="btn-gradient-primary" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h2 className="font-semibold">Categories</h2>
          <p className="text-sm text-gray-500">
            Click a category to edit its details
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No categories found. Create your first category to get started.
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[50%] sm:w-auto">
                    Category
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%] sm:w-32">
                    Status
                  </th>
                  <th className="pl-2 pr-4 sm:pl-6 sm:pr-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%] sm:w-24">
                    Products
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setIsEditDialogOpen(true);
                    }}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{category.name}</div>
                      {category.description && (
                        <div className="text-xs sm:text-sm text-gray-500 line-clamp-1 truncate hidden sm:block">{category.description}</div>
                      )}
                    </td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4">
                      <Badge variant={category.is_active ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="pl-2 pr-4 sm:pl-6 sm:pr-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 text-right whitespace-nowrap">
                      {category.product_count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">Create New Category</DialogTitle>
          <DialogDescription className="sr-only">
            Add a new category to organize your products
          </DialogDescription>
          <CategoryEditor
            availableParents={categories}
            onSave={handleCreateCategory}
            onCancel={() => setIsCreateDialogOpen(false)}
            loading={createCategory.loading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">Edit Category</DialogTitle>
          <DialogDescription className="sr-only">
            Update category information and settings
          </DialogDescription>
          {selectedCategoryData && (
            <CategoryEditor
              category={selectedCategoryData}
              availableParents={categories}
              onSave={handleUpdateCategory}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedCategory(null);
              }}
              loading={updateCategory.loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Plus, Settings, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CategoryTree } from '@/components/categories/CategoryTree';
import { CategoryEditor } from '@/components/categories/CategoryEditor';
import { CategoryBreadcrumb } from '@/components/categories/CategoryBreadcrumb';
import { 
  useCategoriesHierarchy, 
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '@/hooks/useCategories';
import type { 
  CreateCategoryData as CreateCategoryInput,
  UpdateCategoryData as UpdateCategoryInput 
} from '@/lib/validations/categories';
import type { CategoryWithChildren as CategoryHierarchy } from '@/lib/queries/domains/categories';

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories
  const { 
    data: categories = [], 
    isLoading, 
    error 
  } = useCategoriesHierarchy({
    active: !showInactive,
  });

  // Fetch selected category details
  const { 
    data: categoryDetails,
    isLoading: isLoadingDetails,
  } = useCategory(selectedCategory || undefined, true);

  // Mutations
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory(selectedCategory || '');
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();

  // Handlers
  const handleCreateCategory = async (data: Omit<CreateCategoryInput, 'site_id'>) => {
    try {
      await createCategory.mutateAsync(data);
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleUpdateCategory = async (data: UpdateCategoryInput) => {
    if (!selectedCategory) return;
    
    try {
      await updateCategory.mutateAsync(data);
      setIsEditDialogOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDeleteCategory = async (categoryId: string, reassignToId?: string) => {
    try {
      await deleteCategory.mutateAsync({ categoryId, reassignToId });
      setSelectedCategory(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleReorder = async (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    // Find the categories involved
    const findCategory = (id: string, cats: CategoryHierarchy[]): CategoryHierarchy | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        const found = findCategory(id, cat.children);
        if (found) return found;
      }
      return null;
    };

    const dragged = findCategory(draggedId, categories);
    const target = findCategory(targetId, categories);

    if (!dragged || !target) return;

    // Prepare reorder data
    let newParentId: string | null = null;
    let newSortOrder = 0;

    if (position === 'inside') {
      newParentId = targetId;
      newSortOrder = 0; // First child
    } else {
      newParentId = target.parent_id;
      newSortOrder = target.sort_order + (position === 'after' ? 1 : 0);
    }

    try {
      await reorderCategories.mutateAsync({
        category_id: draggedId,
        new_parent_id: newParentId,
        new_sort_order: newSortOrder,
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Calculate statistics
  const totalCategories = categories.length;
  const totalProducts = categories.reduce((sum, cat) => {
    const countProducts = (c: CategoryHierarchy): number => {
      return (c.product_count || 0) + (c.children || []).reduce((s, child) => s + countProducts(child), 0);
    };
    return sum + countProducts(cat);
  }, 0);

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
          <p className="text-muted-foreground">
            Organize your products with hierarchical categories
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{totalCategories}</div>
          <p className="text-xs text-muted-foreground">Total Categories</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">Total Products</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {categories.filter(c => c.children.length > 0).length}
          </div>
          <p className="text-xs text-muted-foreground">Parent Categories</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {categories.length > 0 ? Math.max(...categories.map(c => c.level + 1)) : 0}
          </div>
          <p className="text-xs text-muted-foreground">Max Depth</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Tree */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border">
            <div className="border-b p-4">
              <h2 className="font-semibold">Category Hierarchy</h2>
              <p className="text-sm text-muted-foreground">
                Drag and drop to reorganize categories
              </p>
            </div>
            <div className="p-4">
              <CategoryTree
                categories={categories}
                onSelect={setSelectedCategory}
                onEdit={(id) => {
                  setSelectedCategory(id);
                  setIsEditDialogOpen(true);
                }}
                onDelete={handleDeleteCategory}
                onReorder={handleReorder}
                selectedId={selectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                showInactive={showInactive}
                onShowInactiveChange={setShowInactive}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Category Details */}
        <div className="space-y-6">
          {selectedCategory && categoryDetails ? (
            <div className="rounded-lg border">
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Category Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Breadcrumb */}
                {categoryDetails.ancestors && categoryDetails.ancestors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Path</p>
                    <CategoryBreadcrumb
                      ancestors={categoryDetails.ancestors}
                      current={categoryDetails}
                    />
                  </div>
                )}

                {/* Basic Info */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Name</p>
                  <p className="font-medium">{categoryDetails.name}</p>
                </div>

                {categoryDetails.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{categoryDetails.description}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Badge variant={categoryDetails.is_active ? 'default' : 'secondary'}>
                    {categoryDetails.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">
                    {categoryDetails.product_count || 0} products
                  </Badge>
                </div>

                {/* Visual */}
                {(categoryDetails.icon || categoryDetails.color) && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-4">
                      {categoryDetails.icon && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Icon</p>
                          <span className="text-2xl">{categoryDetails.icon}</span>
                        </div>
                      )}
                      {categoryDetails.color && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Color</p>
                          <div 
                            className="h-8 w-8 rounded border"
                            style={{ backgroundColor: categoryDetails.color }}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* SEO */}
                {(categoryDetails.meta_title || categoryDetails.meta_description) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      {categoryDetails.meta_title && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">SEO Title</p>
                          <p className="text-sm">{categoryDetails.meta_title}</p>
                        </div>
                      )}
                      {categoryDetails.meta_description && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">SEO Description</p>
                          <p className="text-sm">{categoryDetails.meta_description}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">
                Select a category to view details
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-medium mb-2">Quick Actions</h3>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled={!selectedCategory}
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Edit Selected
            </Button>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your products
            </DialogDescription>
          </DialogHeader>
          <CategoryEditor
            mode="create"
            categories={categories}
            onSubmit={handleCreateCategory}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={createCategory.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information and settings
            </DialogDescription>
          </DialogHeader>
          {categoryDetails && (
            <CategoryEditor
              mode="edit"
              category={categoryDetails}
              categories={categories}
              onSubmit={handleUpdateCategory}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={updateCategory.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
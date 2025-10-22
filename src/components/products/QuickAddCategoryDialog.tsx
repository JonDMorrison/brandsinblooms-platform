'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateCategory } from '@/src/hooks/useCategories';
import { useCategoriesList } from '@/src/hooks/useCategories';
import { sanitizeSlug } from '@/src/lib/utils/slug';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Loader2, Plus } from 'lucide-react';

const quickAddCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  parent_id: z.string().nullable().optional(),
});

type QuickAddCategoryForm = z.infer<typeof quickAddCategorySchema>;

interface QuickAddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated: (categoryId: string) => void;
}

export function QuickAddCategoryDialog({
  open,
  onOpenChange,
  onCategoryCreated,
}: QuickAddCategoryDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const createCategory = useCreateCategory();
  const { data: categories = [] } = useCategoriesList();

  const form = useForm<QuickAddCategoryForm>({
    resolver: zodResolver(quickAddCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      parent_id: null,
    },
  });

  const handleSubmit = async (data: QuickAddCategoryForm) => {
    setIsCreating(true);
    const toastId = toast.loading('Creating category...');

    try {
      // Generate slug from name
      const slug = sanitizeSlug(data.name);

      // Create the category
      const newCategory = await createCategory.mutateAsync({
        name: data.name,
        slug,
        description: data.description || null,
        parent_id: data.parent_id || null,
        is_active: true,
        sort_order: 0,
      });

      toast.success('Category created successfully!', { id: toastId });

      // Reset form
      form.reset();

      // Close dialog and notify parent
      onOpenChange(false);

      // Pass the new category ID back to parent
      if (newCategory?.id) {
        onCategoryCreated(newCategory.id);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        id: toastId,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Add Category
          </DialogTitle>
          <DialogDescription>
            Create a new category to organize your products. You can add more details later in the
            Categories page.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    Category Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Seasonal Flowers, Bouquets, Indoor Plants"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    A clear, descriptive name for this category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this category..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Help customers understand what products belong here
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="None - Top Level Category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None - Top Level Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {'  '.repeat(category.level || 0)}
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Organize as a subcategory under another category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isCreating}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Separator } from '@/src/components/ui/separator';
import {
  X,
  ChevronDown,
  Check,
  CheckSquare,
  Square,
  Trash2,
  Copy,
  Tag,
  DollarSign,
  Download,
  Upload,
  Star,
  StarOff,
  Power,
  PowerOff,
} from 'lucide-react';
import { useProductSelection } from '@/contexts/ProductSelectionContext';
import { useProductBulkOperations } from '@/hooks/useProductBulkOperations';
import { useProductCategories } from '@/hooks/useProducts';
import { BulkPriceUpdate } from '@/src/lib/queries/domains/products-bulk';
import { toast } from 'sonner';

interface BulkActionsToolbarProps {
  className?: string;
}

type ConfirmDialog = 'delete' | 'activate' | 'deactivate' | null;
type UpdateDialog = 'category' | 'pricing' | null;

export function BulkActionsToolbar({ className = '' }: BulkActionsToolbarProps) {
  const { selectedIds, selectedCount, clearSelection, hasSelection } = useProductSelection();
  const bulkOps = useProductBulkOperations();
  const { data: categoriesData = [] } = useProductCategories();
  
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const [updateDialog, setUpdateDialog] = useState<UpdateDialog>(null);
  
  // Category update state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  
  // Pricing update state
  const [priceType, setPriceType] = useState<'percentage' | 'fixed'>('percentage');
  const [priceOperation, setPriceOperation] = useState<'increase' | 'decrease'>('increase');
  const [priceValue, setPriceValue] = useState('');

  const categories = (categoriesData || []).map(cat => 
    typeof cat === 'string' ? cat : cat.category
  ).filter(Boolean);

  if (!hasSelection) {
    return null;
  }

  // Action handlers
  const handleDelete = () => {
    bulkOps.deleteProducts(selectedIds);
    setConfirmDialog(null);
    clearSelection();
  };

  const handleDuplicate = () => {
    bulkOps.duplicateProducts(selectedIds);
    clearSelection();
  };

  const handleActivate = () => {
    bulkOps.activateProducts(selectedIds);
    setConfirmDialog(null);
    clearSelection();
  };

  const handleDeactivate = () => {
    bulkOps.deactivateProducts(selectedIds);
    setConfirmDialog(null);
    clearSelection();
  };

  const handleSetFeatured = (featured: boolean) => {
    bulkOps.setFeatured({ productIds: selectedIds, featured });
    clearSelection();
  };

  const handleUpdateCategory = () => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }

    bulkOps.updateCategory({
      productIds: selectedIds,
      category: selectedCategory,
      subcategory: selectedSubcategory || undefined,
    });
    
    setUpdateDialog(null);
    setSelectedCategory('');
    setSelectedSubcategory('');
    clearSelection();
  };

  const handleUpdatePricing = () => {
    const value = parseFloat(priceValue);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid price value');
      return;
    }

    const priceUpdate: BulkPriceUpdate = {
      type: priceType,
      value,
      operation: priceOperation,
    };

    bulkOps.updatePrices({ productIds: selectedIds, priceUpdate });
    
    setUpdateDialog(null);
    setPriceValue('');
    clearSelection();
  };

  const handleExport = () => {
    bulkOps.export({ productIds: selectedIds, filename: 'selected-products' });
  };

  return (
    <>
      {/* Floating Toolbar */}
      <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
        <Card className="shadow-lg border bg-white/95 backdrop-blur-sm">
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Selection count */}
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {selectedCount} selected
                </span>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDialog('activate')}
                  disabled={bulkOps.isLoading}
                >
                  <Power className="h-4 w-4 mr-1" />
                  Activate
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDialog('deactivate')}
                  disabled={bulkOps.isLoading}
                >
                  <PowerOff className="h-4 w-4 mr-1" />
                  Deactivate
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicate}
                  disabled={bulkOps.isLoading}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* More actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    More
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSetFeatured(true)}>
                    <Star className="h-4 w-4 mr-2" />
                    Set Featured
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetFeatured(false)}>
                    <StarOff className="h-4 w-4 mr-2" />
                    Unset Featured
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setUpdateDialog('category')}>
                    <Tag className="h-4 w-4 mr-2" />
                    Update Category
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setUpdateDialog('pricing')}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Update Pricing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setConfirmDialog('delete')}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6" />

              {/* Clear selection */}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialogs */}
      <Dialog open={confirmDialog === 'delete'} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Products</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} product{selectedCount === 1 ? '' : 's'}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={bulkOps.isLoading}>
              Delete {selectedCount} Product{selectedCount === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog === 'activate'} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Products</DialogTitle>
            <DialogDescription>
              Activate {selectedCount} product{selectedCount === 1 ? '' : 's'}? 
              They will become visible on your site.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleActivate} disabled={bulkOps.isLoading}>
              Activate {selectedCount} Product{selectedCount === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog === 'deactivate'} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Products</DialogTitle>
            <DialogDescription>
              Deactivate {selectedCount} product{selectedCount === 1 ? '' : 's'}? 
              They will be hidden from your site.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleDeactivate} disabled={bulkOps.isLoading}>
              Deactivate {selectedCount} Product{selectedCount === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialogs */}
      <Dialog open={updateDialog === 'category'} onOpenChange={() => setUpdateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Category</DialogTitle>
            <DialogDescription>
              Update the category for {selectedCount} product{selectedCount === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subcategory">Subcategory (Optional)</Label>
              <Input
                id="subcategory"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                placeholder="Enter subcategory"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={bulkOps.isLoading || !selectedCategory}>
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={updateDialog === 'pricing'} onOpenChange={() => setUpdateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Pricing</DialogTitle>
            <DialogDescription>
              Update prices for {selectedCount} product{selectedCount === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Price Update Type</Label>
              <Select value={priceType} onValueChange={(value: 'percentage' | 'fixed') => setPriceType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operation</Label>
              <Select value={priceOperation} onValueChange={(value: 'increase' | 'decrease') => setPriceOperation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase</SelectItem>
                  <SelectItem value="decrease">Decrease</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priceValue">
                Value {priceType === 'percentage' ? '(%)' : '($)'}
              </Label>
              <Input
                id="priceValue"
                type="number"
                step={priceType === 'percentage' ? '1' : '0.01'}
                min="0"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                placeholder={priceType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePricing} disabled={bulkOps.isLoading || !priceValue}>
              Update Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateProductModal } from '@/src/components/products/CreateProductModal';

interface ProductsHeaderProps {
  onProductCreated?: () => void;
}

export function ProductsHeader({ onProductCreated }: ProductsHeaderProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-500">
            Manage your product catalog and site products
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <CreateProductModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onProductCreated={onProductCreated}
      />
    </>
  );
}

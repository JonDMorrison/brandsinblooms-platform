'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { CreateProductModal } from '@/src/components/products/CreateProductModal';
import { ImportExportDialog } from '@/src/components/products/ImportExportDialog';

interface ProductsHeaderProps {
  onProductCreated?: () => void;
}

export function ProductsHeader({ onProductCreated }: ProductsHeaderProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'export' | 'import'>('export');

  const handleExportClick = () => {
    setDefaultTab('export');
    setImportExportOpen(true);
  };

  const handleImportClick = () => {
    setDefaultTab('import');
    setImportExportOpen(true);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-500">
            Manage your product catalog and site products
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportClick}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button className="btn-gradient-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <CreateProductModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onProductCreated={onProductCreated}
      />

      <ImportExportDialog
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
        defaultTab={defaultTab}
        onImportComplete={onProductCreated}
      />
    </>
  );
}

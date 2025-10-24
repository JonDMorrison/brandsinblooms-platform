'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  Download,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useExportProducts, useImportProducts } from '@/hooks/useProductBulkOperations';
import { ImportResult, ImportError } from '@/lib/queries/domains/products-bulk';
import { toast } from 'sonner';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductIds?: string[];
  defaultTab?: 'export' | 'import';
  onImportComplete?: () => void;
}

export function ImportExportDialog({
  open,
  onOpenChange,
  selectedProductIds = [],
  defaultTab = 'export',
  onImportComplete
}: ImportExportDialogProps) {
  const exportProducts = useExportProducts();
  const importProducts = useImportProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Export handlers
  const handleExportAll = () => {
    exportProducts.mutate({ filename: 'all-products' });
  };

  const handleExportSelected = () => {
    if (selectedProductIds.length === 0) {
      toast.error('No products selected for export');
      return;
    }
    exportProducts.mutate({ 
      productIds: selectedProductIds, 
      filename: 'selected-products' 
    });
  };

  const handleExportTemplate = () => {
    const templateHeaders = [
      'Name',
      'Description', 
      'SKU',
      'Category',
      'Subcategory',
      'Price',
      'Compare At Price',
      'Inventory Count',
      'In Stock',
      'Active',
      'Featured'
    ];

    const csvContent = templateHeaders.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'product-import-template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    toast.success('Template downloaded successfully');
  };

  // Import handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImportResult(null);

    try {
      const fileContent = await importFile.text();

      if (!fileContent || !fileContent.trim()) {
        toast.error('CSV file is empty');
        return;
      }

      // Call the real import function
      const result = await importProducts.mutateAsync(fileContent);
      setImportResult(result);

      // Call the onImportComplete callback if provided
      if (result.successful > 0 && onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    setImportFile(null);
    setImportResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Import / Export Products</DialogTitle>
          <DialogDescription>
            Export your products to CSV or import products from a CSV file.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Products
                  </CardTitle>
                  <CardDescription>
                    Download your product data as a CSV file
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleExportAll}
                    disabled={exportProducts.isPending}
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Products
                  </Button>
                  
                  {selectedProductIds.length > 0 && (
                    <Button 
                      onClick={handleExportSelected}
                      disabled={exportProducts.isPending}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected Products ({selectedProductIds.length})
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Template
                  </CardTitle>
                  <CardDescription>
                    Download a template CSV file for importing products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleExportTemplate}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Import Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Products
                </CardTitle>
                <CardDescription>
                  Upload a CSV file to import products in bulk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Make sure your CSV file follows the template format. Download the template first if needed.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full justify-start"
                    disabled={importProducts.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {importFile ? `Selected: ${importFile.name}` : 'Select CSV File'}
                  </Button>

                  {importFile && (
                    <Button
                      onClick={handleImport}
                      disabled={importProducts.isPending}
                      className="w-full"
                    >
                      {importProducts.isPending ? 'Importing...' : 'Import Products'}
                    </Button>
                  )}
                </div>

                {importProducts.isPending && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing products...</span>
                    </div>
                    <Progress value={undefined} className="animate-pulse" />
                  </div>
                )}

                {importResult && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Successful: {importResult.successful}</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>Failed: {importResult.failed}</span>
                      </div>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Import Errors
                        </h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {importResult.errors.slice(0, 10).map((error, index) => (
                            <div key={index} className="text-sm text-red-600">
                              Row {error.row} ({error.product_name}): {error.message}
                            </div>
                          ))}
                          {importResult.errors.length > 10 && (
                            <div className="text-sm text-gray-500">
                              ... and {importResult.errors.length - 10} more errors
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
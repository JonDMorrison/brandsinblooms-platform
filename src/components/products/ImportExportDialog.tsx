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
import { useExportProducts } from '@/hooks/useProductBulkOperations';
import { toast } from 'sonner';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductIds?: string[];
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: ImportError[];
}

export function ImportExportDialog({ 
  open, 
  onOpenChange, 
  selectedProductIds = [] 
}: ImportExportDialogProps) {
  const exportProducts = useExportProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

  const parseCSV = (csvText: string): Record<string, string>[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1);

    return rows.map(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      const item: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        item[header] = values[index] || '';
      });
      
      return item;
    });
  };

  const validateRow = (row: Record<string, string>, index: number): ImportError[] => {
    const errors: ImportError[] = [];
    
    if (!row.Name?.trim()) {
      errors.push({ row: index + 1, field: 'Name', message: 'Name is required' });
    }
    
    if (row.Price && isNaN(parseFloat(row.Price))) {
      errors.push({ row: index + 1, field: 'Price', message: 'Invalid price format' });
    }
    
    if (row['Compare At Price'] && isNaN(parseFloat(row['Compare At Price']))) {
      errors.push({ row: index + 1, field: 'Compare At Price', message: 'Invalid price format' });
    }
    
    if (row['Inventory Count'] && isNaN(parseInt(row['Inventory Count']))) {
      errors.push({ row: index + 1, field: 'Inventory Count', message: 'Invalid inventory count' });
    }

    return errors;
  };

  const simulateImport = async (data: Record<string, string>[]): Promise<ImportResult> => {
    const errors: ImportError[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors = validateRow(row, i);
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        failed++;
      } else {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 50));
        successful++;
      }
      
      setImportProgress(((i + 1) / data.length) * 100);
    }

    return { successful, failed, errors };
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const fileContent = await importFile.text();
      const parsedData = parseCSV(fileContent);
      
      if (parsedData.length === 0) {
        toast.error('No valid data found in CSV file');
        return;
      }

      const result = await simulateImport(parsedData);
      setImportResult(result);
      
      if (result.successful > 0) {
        toast.success(`Successfully imported ${result.successful} products`);
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} products`);
      }
      
    } catch (error) {
      toast.error('Failed to process CSV file');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setImportFile(null);
    setImportProgress(0);
    setImportResult(null);
    setIsImporting(false);
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

        <Tabs defaultValue="export" className="w-full">
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
                    disabled={isImporting}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {importFile ? `Selected: ${importFile.name}` : 'Select CSV File'}
                  </Button>

                  {importFile && (
                    <Button
                      onClick={handleImport}
                      disabled={isImporting}
                      className="w-full"
                    >
                      {isImporting ? 'Importing...' : 'Import Products'}
                    </Button>
                  )}
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing products...</span>
                      <span>{Math.round(importProgress)}%</span>
                    </div>
                    <Progress value={importProgress} />
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
                        <div className="max-h-32 overflow-y-auto">
                          {importResult.errors.slice(0, 10).map((error, index) => (
                            <div key={index} className="text-sm text-red-600">
                              Row {error.row}, {error.field}: {error.message}
                            </div>
                          ))}
                          {importResult.errors.length > 10 && (
                            <div className="text-sm text-muted-foreground">
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
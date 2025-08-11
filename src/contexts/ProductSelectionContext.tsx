'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface ProductSelectionContextType {
  // Selection state
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  selectedCount: number;
  hasSelection: boolean;

  // Selection actions
  selectProduct: (id: string) => void;
  deselectProduct: (id: string) => void;
  toggleProduct: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  selectMultiple: (ids: string[]) => void;
  deselectMultiple: (ids: string[]) => void;

  // Bulk selection helpers
  isAllSelected: (availableIds: string[]) => boolean;
  isIndeterminate: (availableIds: string[]) => boolean;
  toggleAll: (availableIds: string[]) => void;
}

const ProductSelectionContext = createContext<ProductSelectionContextType | undefined>(undefined);

interface ProductSelectionProviderProps {
  children: React.ReactNode;
}

export function ProductSelectionProvider({ children }: ProductSelectionProviderProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Basic selection actions
  const selectProduct = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const deselectProduct = useCallback((id: string) => {
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  }, []);

  const toggleProduct = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const newIds = ids.filter(id => !prev.includes(id));
      return [...prev, ...newIds];
    });
  }, []);

  const deselectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
  }, []);

  // Helper functions
  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const isAllSelected = useCallback((availableIds: string[]) => {
    if (availableIds.length === 0) return false;
    return availableIds.every(id => selectedIds.includes(id));
  }, [selectedIds]);

  const isIndeterminate = useCallback((availableIds: string[]) => {
    if (availableIds.length === 0) return false;
    const selectedInAvailable = availableIds.filter(id => selectedIds.includes(id));
    return selectedInAvailable.length > 0 && selectedInAvailable.length < availableIds.length;
  }, [selectedIds]);

  const toggleAll = useCallback((availableIds: string[]) => {
    const allSelected = isAllSelected(availableIds);
    
    if (allSelected) {
      // Deselect all available items
      setSelectedIds(prev => prev.filter(id => !availableIds.includes(id)));
    } else {
      // Select all available items
      setSelectedIds(prev => {
        const newIds = availableIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  }, [isAllSelected]);

  // Computed values
  const selectedCount = selectedIds.length;
  const hasSelection = selectedCount > 0;

  const value: ProductSelectionContextType = useMemo(() => ({
    // Selection state
    selectedIds,
    isSelected,
    selectedCount,
    hasSelection,

    // Selection actions
    selectProduct,
    deselectProduct,
    toggleProduct,
    selectAll,
    clearSelection,
    selectMultiple,
    deselectMultiple,

    // Bulk selection helpers
    isAllSelected,
    isIndeterminate,
    toggleAll,
  }), [
    selectedIds,
    isSelected,
    selectedCount,
    hasSelection,
    selectProduct,
    deselectProduct,
    toggleProduct,
    selectAll,
    clearSelection,
    selectMultiple,
    deselectMultiple,
    isAllSelected,
    isIndeterminate,
    toggleAll,
  ]);

  return (
    <ProductSelectionContext.Provider value={value}>
      {children}
    </ProductSelectionContext.Provider>
  );
}

export function useProductSelection() {
  const context = useContext(ProductSelectionContext);
  if (context === undefined) {
    throw new Error('useProductSelection must be used within a ProductSelectionProvider');
  }
  return context;
}

export default ProductSelectionContext;
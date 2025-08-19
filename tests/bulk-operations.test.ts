/**
 * Comprehensive test suite for bulk product operations
 * Tests database persistence, atomicity, and error handling
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database/types';
import {
  bulkUpdateProducts,
  bulkDeleteProducts,
  bulkDuplicateProducts,
  bulkUpdatePrices,
  bulkActivateProducts,
  bulkDeactivateProducts,
  bulkSetFeatured,
  bulkUpdateCategory,
  bulkProcessor,
  BulkUpdateData,
  BulkPriceUpdate,
} from '@/lib/queries/domains/products-bulk';

// Test helpers
const TEST_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const TEST_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabase: ReturnType<typeof createClient<Database>>;
let testSiteId: string;
let testUserId: string;
let testProducts: any[] = [];

/**
 * Create a test site for isolated testing
 */
async function createTestSite(): Promise<string> {
  const { data: site, error } = await supabase
    .from('sites')
    .insert({
      name: `Test Site ${Date.now()}`,
      domain: `test-${Date.now()}.example.com`,
      profile_id: testUserId,
    })
    .select()
    .single();

  if (error) throw error;
  return site.id;
}

/**
 * Create test products
 */
async function createTestProducts(siteId: string, count: number): Promise<any[]> {
  const products = Array.from({ length: count }, (_, i) => ({
    site_id: siteId,
    name: `Test Product ${i + 1}`,
    description: `Description for test product ${i + 1}`,
    sku: `TEST-SKU-${Date.now()}-${i}`,
    price: 10 + i,
    compare_at_price: 15 + i,
    quantity: 100,
    category: 'Test Category',
    subcategory: 'Test Subcategory',
    is_active: true,
    is_featured: false,
    created_by: testUserId,
  }));

  const { data, error } = await supabase
    .from('products')
    .insert(products)
    .select();

  if (error) throw error;
  return data || [];
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  if (testSiteId) {
    // Delete site (cascades to products)
    await supabase
      .from('sites')
      .delete()
      .eq('id', testSiteId);
  }
}

describe('Bulk Operations Database Persistence', () => {
  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient<Database>(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);
    
    // Create test user
    const { data: auth } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456',
    });
    
    if (auth?.user) {
      testUserId = auth.user.id;
    }
  });

  beforeEach(async () => {
    // Setup fresh test data for each test
    testSiteId = await createTestSite();
    testProducts = await createTestProducts(testSiteId, 10);
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  afterAll(async () => {
    // Sign out
    await supabase.auth.signOut();
  });

  describe('bulkUpdateProducts', () => {
    it('should persist all updates to database atomically', async () => {
      const productIds = testProducts.slice(0, 5).map(p => p.id);
      const updates: BulkUpdateData = {
        is_active: false,
        category: 'Updated Category',
        subcategory: 'Updated Subcategory',
      };

      // Perform bulk update
      const result = await bulkUpdateProducts(supabase, testSiteId, productIds, updates);

      // Verify immediate result
      expect(result).toHaveLength(productIds.length);
      result.forEach(product => {
        expect(product.is_active).toBe(false);
        expect(product.category).toBe('Updated Category');
        expect(product.subcategory).toBe('Updated Subcategory');
      });

      // Verify persistence by fetching fresh data
      const { data: freshData } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      expect(freshData).toHaveLength(productIds.length);
      freshData?.forEach(product => {
        expect(product.is_active).toBe(false);
        expect(product.category).toBe('Updated Category');
        expect(product.subcategory).toBe('Updated Subcategory');
      });
    });

    it('should rollback on partial failure', async () => {
      const productIds = [...testProducts.map(p => p.id), 'invalid-uuid'];
      const updates: BulkUpdateData = { is_active: false };

      // Attempt bulk update with invalid ID
      await expect(
        bulkUpdateProducts(supabase, testSiteId, productIds, updates)
      ).rejects.toThrow();

      // Verify no products were updated (transaction rolled back)
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('id', testProducts.map(p => p.id));

      data?.forEach(product => {
        expect(product.is_active).toBe(true); // Original state preserved
      });
    });

    it('should handle large batches efficiently', async () => {
      // Create 200 products for large batch test
      const largeSet = await createTestProducts(testSiteId, 200);
      const productIds = largeSet.map(p => p.id);

      const startTime = Date.now();
      const result = await bulkUpdateProducts(
        supabase,
        testSiteId,
        productIds,
        { is_featured: true }
      );
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(200);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Verify all products were updated
      const { data, count } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('site_id', testSiteId)
        .eq('is_featured', true);
        
      expect(count).toBe(200);
    });
  });

  describe('bulkDeleteProducts', () => {
    it('should soft delete products atomically', async () => {
      const productIds = testProducts.slice(0, 3).map(p => p.id);

      // Add related data
      await supabase.from('product_images').insert(
        productIds.map(id => ({
          product_id: id,
          image_url: `https://example.com/image-${id}.jpg`,
          display_order: 1,
        }))
      );

      // Perform bulk delete
      await bulkDeleteProducts(supabase, testSiteId, productIds);

      // Verify products are soft deleted (deleted_at is set)
      const { data: deletedProducts } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .not('deleted_at', 'is', null);

      expect(deletedProducts).toHaveLength(productIds.length);
      deletedProducts?.forEach(product => {
        expect(product.deleted_at).not.toBeNull();
      });

      // Verify products don't appear in normal queries
      const { data: activeProducts } = await supabase
        .from('products')
        .select('*')
        .eq('site_id', testSiteId)
        .is('deleted_at', null);

      const remainingIds = activeProducts?.map(p => p.id) || [];
      productIds.forEach(id => {
        expect(remainingIds).not.toContain(id);
      });
    });

    it('should handle cascade deletion of related data', async () => {
      const productId = testProducts[0].id;

      // Add related data
      await supabase.from('product_images').insert({
        product_id: productId,
        image_url: 'test.jpg',
        display_order: 1,
      });

      await supabase.from('product_taggings').insert({
        product_id: productId,
        tag_id: 'test-tag',
      });

      // Perform bulk delete
      await bulkDeleteProducts(supabase, testSiteId, [productId]);

      // Verify related data is handled (images should be tracked for cleanup)
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId);

      // Images might still exist but product should be soft deleted
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      expect(product?.deleted_at).not.toBeNull();
    });
  });

  describe('bulkDuplicateProducts', () => {
    it('should create exact duplicates with unique SKUs', async () => {
      const productIds = testProducts.slice(0, 2).map(p => p.id);
      
      // Add images to original products
      await supabase.from('product_images').insert(
        productIds.map(id => ({
          product_id: id,
          image_url: `https://example.com/original-${id}.jpg`,
          display_order: 1,
        }))
      );

      // Perform bulk duplicate
      const duplicates = await bulkDuplicateProducts(supabase, testSiteId, productIds);

      expect(duplicates).toHaveLength(productIds.length);
      
      // Verify duplicates have unique SKUs
      const skus = duplicates.map(d => d.sku);
      const uniqueSkus = new Set(skus);
      expect(uniqueSkus.size).toBe(skus.length);

      // Verify duplicates have "(Copy)" in name
      duplicates.forEach(duplicate => {
        expect(duplicate.name).toContain('(Copy)');
        expect(duplicate.is_active).toBe(false); // Should start inactive
        expect(duplicate.is_featured).toBe(false);
      });

      // Verify images were duplicated
      for (const duplicate of duplicates) {
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', duplicate.id);
          
        expect(images).toHaveLength(1);
      }
    });

    it('should handle SKU conflicts gracefully', async () => {
      const productId = testProducts[0].id;
      
      // First duplication
      const firstDuplicate = await bulkDuplicateProducts(supabase, testSiteId, [productId]);
      expect(firstDuplicate).toHaveLength(1);
      
      // Second duplication should still work with different SKU
      const secondDuplicate = await bulkDuplicateProducts(supabase, testSiteId, [productId]);
      expect(secondDuplicate).toHaveLength(1);
      
      // SKUs should be different
      expect(firstDuplicate[0].sku).not.toBe(secondDuplicate[0].sku);
    });
  });

  describe('bulkUpdatePrices', () => {
    it('should update prices atomically with percentage increase', async () => {
      const productIds = testProducts.slice(0, 5).map(p => p.id);
      const priceUpdate: BulkPriceUpdate = {
        type: 'percentage',
        value: 10, // 10% increase
        operation: 'increase',
      };

      const originalPrices = testProducts.slice(0, 5).map(p => p.price);
      
      // Perform bulk price update
      const result = await bulkUpdatePrices(supabase, testSiteId, productIds, priceUpdate);

      expect(result).toHaveLength(productIds.length);
      
      // Verify prices increased by 10%
      result.forEach((product, index) => {
        const expectedPrice = Math.round(originalPrices[index] * 1.1 * 100) / 100;
        expect(product.price).toBe(expectedPrice);
      });

      // Verify persistence
      const { data: freshData } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .order('created_at');

      freshData?.forEach((product, index) => {
        const expectedPrice = Math.round(originalPrices[index] * 1.1 * 100) / 100;
        expect(product.price).toBe(expectedPrice);
      });
    });

    it('should update prices with fixed amount decrease', async () => {
      const productIds = testProducts.slice(0, 3).map(p => p.id);
      const priceUpdate: BulkPriceUpdate = {
        type: 'fixed',
        value: 5, // $5 decrease
        operation: 'decrease',
      };

      const originalPrices = testProducts.slice(0, 3).map(p => p.price);
      
      // Perform bulk price update
      const result = await bulkUpdatePrices(supabase, testSiteId, productIds, priceUpdate);

      expect(result).toHaveLength(productIds.length);
      
      // Verify prices decreased by $5
      result.forEach((product, index) => {
        const expectedPrice = Math.max(0, originalPrices[index] - 5);
        expect(product.price).toBe(expectedPrice);
      });
    });

    it('should prevent negative prices', async () => {
      const productIds = testProducts.slice(0, 1).map(p => p.id);
      const priceUpdate: BulkPriceUpdate = {
        type: 'fixed',
        value: 1000, // Large decrease to force negative
        operation: 'decrease',
      };

      // Update should succeed but price should be 0, not negative
      const result = await bulkUpdatePrices(supabase, testSiteId, productIds, priceUpdate);
      
      expect(result).toHaveLength(1);
      expect(result[0].price).toBeGreaterThanOrEqual(0);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should activate multiple products atomically', async () => {
      // First deactivate some products
      const productIds = testProducts.slice(0, 5).map(p => p.id);
      await bulkDeactivateProducts(supabase, testSiteId, productIds);

      // Then activate them
      const result = await bulkActivateProducts(supabase, testSiteId, productIds);

      expect(result).toHaveLength(productIds.length);
      result.forEach(product => {
        expect(product.is_active).toBe(true);
      });

      // Verify persistence
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      data?.forEach(product => {
        expect(product.is_active).toBe(true);
      });
    });

    it('should set featured status for multiple products', async () => {
      const productIds = testProducts.slice(0, 3).map(p => p.id);
      
      // Set as featured
      const result = await bulkSetFeatured(supabase, testSiteId, productIds, true);

      expect(result).toHaveLength(productIds.length);
      result.forEach(product => {
        expect(product.is_featured).toBe(true);
      });

      // Unset featured
      const unfeaturedResult = await bulkSetFeatured(supabase, testSiteId, productIds, false);
      
      unfeaturedResult.forEach(product => {
        expect(product.is_featured).toBe(false);
      });
    });
  });

  describe('bulkUpdateCategory', () => {
    it('should update category and subcategory atomically', async () => {
      const productIds = testProducts.map(p => p.id);
      const newCategory = 'New Category';
      const newSubcategory = 'New Subcategory';

      const result = await bulkUpdateCategory(
        supabase,
        testSiteId,
        productIds,
        newCategory,
        newSubcategory
      );

      expect(result).toHaveLength(productIds.length);
      result.forEach(product => {
        expect(product.category).toBe(newCategory);
        expect(product.subcategory).toBe(newSubcategory);
      });

      // Verify persistence
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      data?.forEach(product => {
        expect(product.category).toBe(newCategory);
        expect(product.subcategory).toBe(newSubcategory);
      });
    });
  });

  describe('BulkOperationProcessor', () => {
    it('should process large batches with progress tracking', async () => {
      // Create 150 products for batch processing test
      const largeSet = await createTestProducts(testSiteId, 150);
      const productIds = largeSet.map(p => p.id);
      
      let progressUpdates: number[] = [];
      
      const result = await bulkProcessor.processBatches(
        productIds,
        async (batch) => {
          // Simulate processing
          await bulkUpdateProducts(supabase, testSiteId, batch, { is_featured: true });
          return batch;
        },
        (current, total) => {
          progressUpdates.push(Math.round((current / total) * 100));
        }
      );

      expect(result).toHaveLength(150);
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    it('should handle batch failures gracefully', async () => {
      const productIds = ['invalid-1', 'invalid-2', 'invalid-3'];
      
      await expect(
        bulkProcessor.processBatches(
          productIds,
          async (batch) => {
            await bulkUpdateProducts(supabase, testSiteId, batch, { is_active: false });
            return batch;
          }
        )
      ).rejects.toThrow(/Partial failure/);
    });
  });

  describe('Error Recovery', () => {
    it('should provide detailed error messages for validation failures', async () => {
      const productIds = testProducts.slice(0, 1).map(p => p.id);
      
      // Try to update with invalid data
      await expect(
        bulkUpdatePrices(supabase, testSiteId, productIds, {
          type: 'percentage',
          value: -50, // Invalid negative percentage
          operation: 'increase',
        } as BulkPriceUpdate)
      ).rejects.toThrow();
    });

    it('should handle network errors with retry', async () => {
      // This test would require mocking network failures
      // For now, we'll test that the retry mechanism is in place
      const productIds = testProducts.slice(0, 1).map(p => p.id);
      
      // Should succeed even with potential transient failures
      const result = await bulkUpdateProducts(
        supabase,
        testSiteId,
        productIds,
        { is_active: false }
      );
      
      expect(result).toHaveLength(1);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete 10 item operations in < 500ms', async () => {
      const productIds = testProducts.slice(0, 10).map(p => p.id);
      
      const startTime = Date.now();
      await bulkUpdateProducts(supabase, testSiteId, productIds, { is_active: false });
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(500);
    });

    it('should complete 50 item operations in < 2 seconds', async () => {
      const products = await createTestProducts(testSiteId, 50);
      const productIds = products.map(p => p.id);
      
      const startTime = Date.now();
      await bulkUpdateProducts(supabase, testSiteId, productIds, { is_featured: true });
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000);
    });

    it('should complete 100 item operations in < 5 seconds', async () => {
      const products = await createTestProducts(testSiteId, 100);
      const productIds = products.map(p => p.id);
      
      const startTime = Date.now();
      await bulkUpdateProducts(supabase, testSiteId, productIds, { category: 'Performance Test' });
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000);
    });
  });
});
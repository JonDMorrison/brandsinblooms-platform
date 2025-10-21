/**
 * Products Query Module
 *
 * Re-exports all product-related query functions.
 * This file maintains backwards compatibility while splitting functionality.
 */

// Re-export everything from the main products file
export * from '../products';

// Note: In a future refactor, this module can be split into:
// - read.ts: getProducts, getProductById, getProductsByCategory, searchProducts
// - write.ts: createProduct, updateProduct, deleteProduct
// - categories.ts: getProductCategories, category-related queries
// - validation.ts: checkSkuAvailability, generateUniqueSlug, validateSlug
// - stats.ts: Analytics and stats queries
// - transforms.ts: Data transformation utilities

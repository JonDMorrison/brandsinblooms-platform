/**
 * Pricing Utilities
 *
 * Utilities for price calculations, formatting, and validation.
 */

/**
 * Format price for display
 */
export function formatPrice(
  price: number | null | undefined,
  options: {
    currency?: string;
    showSymbol?: boolean;
    decimals?: number;
  } = {}
): string {
  const {
    currency = 'USD',
    showSymbol = true,
    decimals = 2,
  } = options;

  if (price === null || price === undefined) {
    return showSymbol ? '$0.00' : '0.00';
  }

  const formatted = price.toFixed(decimals);

  if (!showSymbol) {
    return formatted;
  }

  // Simple USD formatting for now
  // Can be extended to use Intl.NumberFormat for other currencies
  return `$${formatted}`;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  salePrice: number
): number {
  if (originalPrice <= 0 || salePrice >= originalPrice) {
    return 0;
  }

  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Calculate savings amount
 */
export function calculateSavings(
  originalPrice: number,
  salePrice: number
): number {
  if (salePrice >= originalPrice) {
    return 0;
  }

  return originalPrice - salePrice;
}

/**
 * Get effective price (sale price if available, otherwise regular price)
 */
export function getEffectivePrice(
  price: number,
  salePrice?: number | null
): number {
  if (salePrice !== null && salePrice !== undefined && salePrice > 0 && salePrice < price) {
    return salePrice;
  }

  return price;
}

/**
 * Check if product is on sale
 */
export function isOnSale(
  price: number,
  salePrice?: number | null
): boolean {
  return salePrice !== null &&
         salePrice !== undefined &&
         salePrice > 0 &&
         salePrice < price;
}

/**
 * Check if compare at price should be displayed
 * Only shows when compareAtPrice is valid and higher than current price
 */
export function shouldShowCompareAtPrice(
  price: number,
  compareAtPrice?: number | null
): boolean {
  return (
    compareAtPrice !== null &&
    compareAtPrice !== undefined &&
    compareAtPrice > 0 &&
    compareAtPrice > price
  );
}

/**
 * Apply percentage change to price
 */
export function applyPercentageChange(
  price: number,
  percentage: number,
  operation: 'increase' | 'decrease'
): number {
  const multiplier = operation === 'increase'
    ? 1 + percentage / 100
    : 1 - percentage / 100;

  const newPrice = price * multiplier;

  // Ensure price doesn't go negative
  return Math.max(0, Number(newPrice.toFixed(2)));
}

/**
 * Apply fixed amount change to price
 */
export function applyFixedChange(
  price: number,
  amount: number,
  operation: 'increase' | 'decrease'
): number {
  const newPrice = operation === 'increase'
    ? price + amount
    : price - amount;

  // Ensure price doesn't go negative
  return Math.max(0, Number(newPrice.toFixed(2)));
}

/**
 * Calculate total inventory value
 */
export function calculateInventoryValue(
  price: number,
  inventoryCount: number
): number {
  return Number((price * inventoryCount).toFixed(2));
}

/**
 * Validate price range
 */
export function isValidPriceRange(
  minPrice?: number,
  maxPrice?: number
): boolean {
  if (minPrice === undefined && maxPrice === undefined) {
    return true;
  }

  if (minPrice !== undefined && minPrice < 0) {
    return false;
  }

  if (maxPrice !== undefined && maxPrice < 0) {
    return false;
  }

  if (minPrice !== undefined && maxPrice !== undefined) {
    return minPrice <= maxPrice;
  }

  return true;
}

/**
 * Parse price string to number
 */
export function parsePrice(priceStr: string | number): number | null {
  if (typeof priceStr === 'number') {
    return priceStr;
  }

  // Remove currency symbols and whitespace
  const cleaned = priceStr.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? null : parsed;
}

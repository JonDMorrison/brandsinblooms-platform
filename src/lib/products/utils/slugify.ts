/**
 * Slug Generation Utilities
 *
 * Utilities for generating and validating URL-friendly slugs.
 */

/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if a slug is valid (format-wise)
 */
export function isValidSlug(slug: string): boolean {
  // Must contain only lowercase letters, numbers, and hyphens
  // Cannot start or end with a hyphen
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Ensure slug uniqueness by appending a number if needed
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Generate a product slug from product name
 * Handles special characters, truncation, and common patterns
 */
export function generateProductSlug(name: string, maxLength: number = 100): string {
  const slug = slugify(name);

  // Truncate if too long, but ensure we don't cut in the middle of a word
  if (slug.length > maxLength) {
    const truncated = slug.substring(0, maxLength);
    const lastHyphen = truncated.lastIndexOf('-');

    // If we find a hyphen, cut there; otherwise just use the truncated version
    return lastHyphen > maxLength * 0.7
      ? truncated.substring(0, lastHyphen)
      : truncated;
  }

  return slug;
}

/**
 * Parse slug to extract product information if encoded
 */
export function parseSlug(slug: string): { base: string; variant?: string } {
  const parts = slug.split('-');

  // Check if last part looks like a variant (e.g., "red", "blue", "small")
  if (parts.length > 1) {
    return {
      base: parts.slice(0, -1).join('-'),
      variant: parts[parts.length - 1],
    };
  }

  return { base: slug };
}

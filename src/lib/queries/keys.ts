/**
 * Centralized query key factory for React Query
 * Ensures consistent and type-safe query keys across the application
 */

export const queryKeys = {
  all: ['supabase'] as const,
  
  // Auth queries
  auth: {
    all: () => [...queryKeys.all, 'auth'] as const,
    user: () => [...queryKeys.auth.all(), 'user'] as const,
    session: () => [...queryKeys.auth.all(), 'session'] as const,
  },
  
  // Site queries
  sites: {
    all: () => [...queryKeys.all, 'sites'] as const,
    lists: () => [...queryKeys.sites.all(), 'list'] as const,
    list: (filters?: { userId?: string; active?: boolean }) => 
      [...queryKeys.sites.lists(), filters] as const,
    details: () => [...queryKeys.sites.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.sites.details(), id] as const,
    memberships: (siteId: string) => 
      [...queryKeys.sites.detail(siteId), 'memberships'] as const,
  },
  
  // Content queries
  content: {
    all: (siteId: string) => [...queryKeys.all, 'content', siteId] as const,
    lists: (siteId: string) => [...queryKeys.content.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: { 
      type?: 'page' | 'blog_post' | 'event';
      published?: boolean;
      featured?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }) => [...queryKeys.content.lists(siteId), filters] as const,
    details: (siteId: string) => [...queryKeys.content.all(siteId), 'detail'] as const,
    detail: (siteId: string, id: string) => 
      [...queryKeys.content.details(siteId), id] as const,
    bySlug: (siteId: string, slug: string) => 
      [...queryKeys.content.all(siteId), 'slug', slug] as const,
  },
  
  // Product queries
  products: {
    all: (siteId: string) => [...queryKeys.all, 'products', siteId] as const,
    lists: (siteId: string) => [...queryKeys.products.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: {
      category?: string;
      subcategory?: string;
      featured?: boolean;
      inStock?: boolean;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      page?: number;
      limit?: number;
    }) => [...queryKeys.products.lists(siteId), filters] as const,
    details: (siteId: string) => [...queryKeys.products.all(siteId), 'detail'] as const,
    detail: (siteId: string, id: string) => 
      [...queryKeys.products.details(siteId), id] as const,
    bySlug: (siteId: string, slug: string) => 
      [...queryKeys.products.all(siteId), 'slug', slug] as const,
    bySku: (siteId: string, sku: string) => 
      [...queryKeys.products.all(siteId), 'sku', sku] as const,
    categories: (siteId: string) => 
      [...queryKeys.products.all(siteId), 'categories'] as const,
  },
  
  // Tag queries
  tags: {
    all: (siteId: string) => [...queryKeys.all, 'tags', siteId] as const,
    lists: (siteId: string) => [...queryKeys.tags.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: { search?: string }) => 
      [...queryKeys.tags.lists(siteId), filters] as const,
    byContent: (siteId: string, contentId: string) => 
      [...queryKeys.tags.all(siteId), 'content', contentId] as const,
    byProduct: (siteId: string, productId: string) => 
      [...queryKeys.tags.all(siteId), 'product', productId] as const,
  },
  
  // Media queries
  media: {
    all: (siteId: string) => [...queryKeys.all, 'media', siteId] as const,
    lists: (siteId: string) => [...queryKeys.media.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: {
      type?: 'image' | 'video' | 'document';
      page?: number;
      limit?: number;
    }) => [...queryKeys.media.lists(siteId), filters] as const,
    detail: (siteId: string, id: string) => 
      [...queryKeys.media.all(siteId), 'detail', id] as const,
  },
  
  // Dashboard statistics
  dashboard: {
    all: (siteId: string) => [...queryKeys.all, 'dashboard', siteId] as const,
    stats: (siteId: string) => [...queryKeys.dashboard.all(siteId), 'stats'] as const,
    metrics: (siteId: string) => [...queryKeys.dashboard.all(siteId), 'metrics'] as const,
    revenue: (siteId: string, period?: string) => 
      [...queryKeys.dashboard.all(siteId), 'revenue', period] as const,
    contentAnalytics: (siteId: string) => 
      [...queryKeys.dashboard.all(siteId), 'contentAnalytics'] as const,
    productAnalytics: (siteId: string) => 
      [...queryKeys.dashboard.all(siteId), 'productAnalytics'] as const,
    customerAnalytics: (siteId: string) => 
      [...queryKeys.dashboard.all(siteId), 'customerAnalytics'] as const,
    analytics: (siteId: string, range?: { start: Date; end: Date }) => 
      [...queryKeys.dashboard.all(siteId), 'analytics', range] as const,
    activity: (siteId: string, limit?: number) => 
      [...queryKeys.dashboard.all(siteId), 'activity', limit] as const,
    performance: (siteId: string) => 
      [...queryKeys.dashboard.all(siteId), 'performance'] as const,
  },
  
  // Site statistics (standalone)
  siteStatistics: (siteId: string) => [...queryKeys.all, 'siteStatistics', siteId] as const,
  
  // Contact inquiries
  inquiries: {
    all: (siteId: string) => [...queryKeys.all, 'inquiries', siteId] as const,
    lists: (siteId: string) => [...queryKeys.inquiries.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: {
      status?: 'new' | 'read' | 'responded';
      type?: string;
      page?: number;
      limit?: number;
    }) => [...queryKeys.inquiries.lists(siteId), filters] as const,
    detail: (siteId: string, id: string) => 
      [...queryKeys.inquiries.all(siteId), 'detail', id] as const,
  },
  
  // Import batches
  imports: {
    all: (siteId: string) => [...queryKeys.all, 'imports', siteId] as const,
    lists: (siteId: string) => [...queryKeys.imports.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: {
      status?: string;
      page?: number;
      limit?: number;
    }) => [...queryKeys.imports.lists(siteId), filters] as const,
    detail: (siteId: string, id: string) => 
      [...queryKeys.imports.all(siteId), 'detail', id] as const,
  },
} as const;

// Type exports for use in components
export type QueryKeys = typeof queryKeys;
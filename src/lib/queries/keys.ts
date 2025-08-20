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
    placeholderSettings: (siteId: string) => 
      [...queryKeys.sites.detail(siteId), 'placeholder-settings'] as const,
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
    images: (siteId: string, productId: string) => 
      [...queryKeys.products.detail(siteId, productId), 'images'] as const,
    reviews: (siteId: string, productId: string) => 
      [...queryKeys.products.detail(siteId, productId), 'reviews'] as const,
    reviewsList: (siteId: string, productId: string, filters?: {
      rating?: number;
      verified?: boolean;
      approved?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => [...queryKeys.products.reviews(siteId, productId), 'list', filters] as const,
    rating: (siteId: string, productId: string) => 
      [...queryKeys.products.detail(siteId, productId), 'rating'] as const,
    userReview: (siteId: string, productId: string, profileId: string) => 
      [...queryKeys.products.reviews(siteId, productId), 'user', profileId] as const,
    placeholders: (siteId: string) => 
      [...queryKeys.products.all(siteId), 'placeholder'] as const,
    placeholder: (siteId: string, cacheKey: string) => 
      [...queryKeys.products.placeholders(siteId), cacheKey] as const,
    stats: (siteId: string) => 
      [...queryKeys.products.all(siteId), 'stats'] as const,
  },

  // Category queries
  categories: {
    all: (siteId: string) => [...queryKeys.all, 'categories', siteId] as const,
    lists: (siteId: string) => [...queryKeys.categories.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: {
      active?: boolean;
      parentId?: string | null;
      level?: number;
      includeInactive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => [...queryKeys.categories.lists(siteId), filters] as const,
    details: (siteId: string) => [...queryKeys.categories.all(siteId), 'detail'] as const,
    detail: (siteId: string, id: string) => 
      [...queryKeys.categories.details(siteId), id] as const,
    hierarchy: (siteId: string, filters?: {
      active?: boolean;
      includeInactive?: boolean;
    }) => [...queryKeys.categories.all(siteId), 'hierarchy', filters] as const,
    ancestors: (siteId: string, categoryId: string) => 
      [...queryKeys.categories.detail(siteId, categoryId), 'ancestors'] as const,
    products: (siteId: string, categoryId: string) => 
      [...queryKeys.categories.detail(siteId, categoryId), 'products'] as const,
    productsList: (siteId: string, categoryId: string, filters?: {
      page?: number;
      limit?: number;
      includeInactive?: boolean;
      primaryOnly?: boolean;
    }) => [...queryKeys.categories.products(siteId, categoryId), 'list', filters] as const,
  },

  // Review queries
  reviews: {
    all: (siteId: string) => [...queryKeys.all, 'reviews', siteId] as const,
    lists: (siteId: string) => [...queryKeys.reviews.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: {
      rating?: number;
      verified?: boolean;
      approved?: boolean;
      page?: number;
      limit?: number;
    }) => [...queryKeys.reviews.lists(siteId), filters] as const,
    details: (siteId: string) => [...queryKeys.reviews.all(siteId), 'detail'] as const,
    detail: (siteId: string, id: string) => 
      [...queryKeys.reviews.details(siteId), id] as const,
    byProfile: (siteId: string, profileId: string) => 
      [...queryKeys.reviews.all(siteId), 'profile', profileId] as const,
    stats: (siteId: string) => [...queryKeys.reviews.all(siteId), 'stats'] as const,
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
  
  // Order queries
  orders: {
    all: (siteId: string) => [...queryKeys.all, 'orders', siteId] as const,
    lists: (siteId: string) => [...queryKeys.orders.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: {
      status?: 'processing' | 'shipped' | 'delivered' | 'cancelled';
      paymentStatus?: string;
      customerId?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
      cursor?: string;
    }) => [...queryKeys.orders.lists(siteId), filters] as const,
    details: (siteId: string) => [...queryKeys.orders.all(siteId), 'detail'] as const,
    detail: (siteId: string, id: string) => 
      [...queryKeys.orders.details(siteId), id] as const,
    fullDetails: (siteId: string, id: string) => 
      [...queryKeys.orders.detail(siteId, id), 'full'] as const,
    items: (siteId: string, orderId: string) => 
      [...queryKeys.orders.detail(siteId, orderId), 'items'] as const,
    statusHistory: (siteId: string, orderId: string) => 
      [...queryKeys.orders.detail(siteId, orderId), 'status-history'] as const,
    payments: (siteId: string, orderId: string) => 
      [...queryKeys.orders.detail(siteId, orderId), 'payments'] as const,
    shipments: (siteId: string, orderId: string) => 
      [...queryKeys.orders.detail(siteId, orderId), 'shipments'] as const,
    stats: (siteId: string) => [...queryKeys.orders.all(siteId), 'stats'] as const,
    trends: (siteId: string, days?: number) => 
      [...queryKeys.orders.stats(siteId), 'trends', days] as const,
    metrics: (siteId: string) => [...queryKeys.orders.stats(siteId), 'metrics'] as const,
    distribution: (siteId: string) => [...queryKeys.orders.stats(siteId), 'distribution'] as const,
    recentActivity: (siteId: string, limit?: number) => 
      [...queryKeys.orders.all(siteId), 'recent-activity', limit] as const,
    customerOrders: (siteId: string, customerId: string) => 
      [...queryKeys.orders.all(siteId), 'customer', customerId] as const,
    search: (siteId: string, searchTerm: string) => 
      [...queryKeys.orders.all(siteId), 'search', searchTerm] as const,
    byStatus: (siteId: string, status: string) => 
      [...queryKeys.orders.lists(siteId), 'status', status] as const,
  },
  
  // Customer queries
  customers: {
    all: (siteId: string) => [...queryKeys.all, 'customers', siteId] as const,
    lists: (siteId: string) => [...queryKeys.customers.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: {
      status?: 'active' | 'inactive';
      search?: string;
      sortBy?: 'name' | 'orders' | 'spent' | 'lastOrder';
      page?: number;
      limit?: number;
    }) => [...queryKeys.customers.lists(siteId), filters] as const,
    details: (siteId: string) => [...queryKeys.customers.all(siteId), 'detail'] as const,
    detail: (siteId: string, id: string) => 
      [...queryKeys.customers.details(siteId), id] as const,
    stats: (siteId: string) => [...queryKeys.customers.all(siteId), 'stats'] as const,
  },
  
  // Activity feed queries
  activity: {
    all: (siteId: string) => [...queryKeys.all, 'activity', siteId] as const,
    lists: (siteId: string) => [...queryKeys.activity.all(siteId), 'list'] as const,
    list: (siteId: string, filters?: {
      type?: string;
      entityType?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      cursor?: string;
      limit?: number;
    }) => [...queryKeys.activity.lists(siteId), filters] as const,
    byEntity: (siteId: string, entityType: string, entityId: string) => 
      [...queryKeys.activity.all(siteId), 'entity', entityType, entityId] as const,
  },
  
  // Metrics queries
  metrics: {
    all: (siteId: string) => [...queryKeys.all, 'metrics', siteId] as const,
    current: (siteId: string) => [...queryKeys.metrics.all(siteId), 'current'] as const,
    history: (siteId: string, days?: number) => 
      [...queryKeys.metrics.all(siteId), 'history', days] as const,
    byDate: (siteId: string, date: string) => 
      [...queryKeys.metrics.all(siteId), 'date', date] as const,
  },
  
  // Theme queries
  theme: {
    all: (siteId: string) => [...queryKeys.all, 'theme', siteId] as const,
    settings: (siteId: string) => [...queryKeys.theme.all(siteId), 'settings'] as const,
  },
  
  // Notification queries
  notifications: {
    all: (siteId: string, userId: string) => [...queryKeys.all, 'notifications', siteId, userId] as const,
    lists: (siteId: string, userId: string) => [...queryKeys.notifications.all(siteId, userId), 'list'] as const,
    list: (siteId: string, userId: string, filters?: {
      isRead?: boolean;
      isArchived?: boolean;
      category?: string;
      type?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      relatedEntityType?: string;
      relatedEntityId?: string;
      dateFrom?: string;
      dateTo?: string;
      cursor?: string;
      limit?: number;
    }) => [...queryKeys.notifications.lists(siteId, userId), filters] as const,
    details: (siteId: string, userId: string) => [...queryKeys.notifications.all(siteId, userId), 'detail'] as const,
    detail: (siteId: string, userId: string, id: string) => 
      [...queryKeys.notifications.details(siteId, userId), id] as const,
    unreadCount: (siteId: string, userId: string) => 
      [...queryKeys.notifications.all(siteId, userId), 'unread-count'] as const,
    stats: (siteId: string, userId: string) => 
      [...queryKeys.notifications.all(siteId, userId), 'stats'] as const,
    byEntity: (siteId: string, userId: string, entityType: string, entityId: string) => 
      [...queryKeys.notifications.all(siteId, userId), 'entity', entityType, entityId] as const,
    byCategory: (siteId: string, userId: string, category: string) => 
      [...queryKeys.notifications.all(siteId, userId), 'category', category] as const,
    byType: (siteId: string, userId: string, type: string) => 
      [...queryKeys.notifications.all(siteId, userId), 'type', type] as const,
  },
} as const;

// Type exports for use in components
export type QueryKeys = typeof queryKeys;
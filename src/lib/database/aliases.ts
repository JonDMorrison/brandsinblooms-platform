import type { Database } from './types';

// Helper types
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// Site types
export type Site = Tables['sites']['Row'];
export type SiteInsert = Tables['sites']['Insert'];
export type SiteUpdate = Tables['sites']['Update'];
export type SiteMembership = Tables['site_memberships']['Row'];
export type SiteMembershipInsert = Tables['site_memberships']['Insert'];
export type SiteMembershipUpdate = Tables['site_memberships']['Update'];

// Content types
export type Content = Tables['content']['Row'];
export type ContentInsert = Tables['content']['Insert'];
export type ContentUpdate = Tables['content']['Update'];
export type InsertContent = ContentInsert; // Alias for backward compatibility

// Product types
export type Product = Tables['products']['Row'];
export type ProductInsert = Tables['products']['Insert'];
export type ProductUpdate = Tables['products']['Update'];

// Order types
export type Order = Tables['orders']['Row'];
export type OrderInsert = Tables['orders']['Insert'];
export type OrderUpdate = Tables['orders']['Update'];

// Order status enum (derived from check constraint)
export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Order item types
export type OrderItem = Tables['order_items']['Row'];
export type OrderItemInsert = Tables['order_items']['Insert'];
export type OrderItemUpdate = Tables['order_items']['Update'];

// Profile types
export type Profile = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

// Activity log types
export type ActivityLog = Tables['activity_logs']['Row'];
export type ActivityLogInsert = Tables['activity_logs']['Insert'];
export type ActivityLogUpdate = Tables['activity_logs']['Update'];

// Media types
export type MediaFile = Tables['media_files']['Row'];
export type MediaFileInsert = Tables['media_files']['Insert'];
export type MediaFileUpdate = Tables['media_files']['Update'];

// Tag types
export type Tag = Tables['tags']['Row'];
export type TagInsert = Tables['tags']['Insert'];
export type TagUpdate = Tables['tags']['Update'];

// Tagging types
export type Tagging = Tables['taggings']['Row'];
export type TaggingInsert = Tables['taggings']['Insert'];
export type TaggingUpdate = Tables['taggings']['Update'];

// Site metrics types
export type SiteMetrics = Tables['site_metrics']['Row'];
export type SiteMetricsInsert = Tables['site_metrics']['Insert'];
export type SiteMetricsUpdate = Tables['site_metrics']['Update'];

// Alias for backward compatibility
export type SiteMetricsData = SiteMetrics;

// Metrics data interface
export type MetricData = {
  score: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
};

// Contact inquiry types
export type ContactInquiry = Tables['contact_inquiries']['Row'];
export type ContactInquiryInsert = Tables['contact_inquiries']['Insert'];
export type ContactInquiryUpdate = Tables['contact_inquiries']['Update'];

// Import batch types
export type ImportBatch = Tables['import_batches']['Row'];
export type ImportBatchInsert = Tables['import_batches']['Insert'];
export type ImportBatchUpdate = Tables['import_batches']['Update'];

// Extended types (commonly used combinations)
export interface SiteWithMembership {
  site: Site;
  membership: SiteMembership;
}

export interface ProductWithTags extends Product {
  tags?: Tag[];
}

export interface ContentWithTags extends Content {
  tags?: Tag[];
}

export interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}
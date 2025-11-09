import type { Database } from './types';
import type { PerformanceMetricsData, ProductFeatures } from './json-types';

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

// Product types with proper Json typing
export type Product = Tables['products']['Row'] & {
  features: ProductFeatures | null;
};
export type ProductInsert = Tables['products']['Insert'];
export type ProductUpdate = Tables['products']['Update'];

// Order types
export type Order = Tables['orders']['Row'];
export type OrderInsert = Tables['orders']['Insert'];
export type OrderUpdate = Tables['orders']['Update'];

// Order status enum (derived from check constraint)
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

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

// Product review types
export type ProductReview = Tables['product_reviews']['Row'];
export type ProductReviewInsert = Tables['product_reviews']['Insert'];
export type ProductReviewUpdate = Tables['product_reviews']['Update'];

// Site metrics types - Note: site-domains uses individual columns instead of JSON
export type SiteMetric = Tables['site_metrics']['Row'];
export type SiteMetrics = SiteMetric;
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
export interface SiteWithMembership extends Site {
  membership?: SiteMembership;
}

export interface ProductWithTags extends Product {
  tags?: Tag[];
}

export interface ContentWithTags extends Content {
  tags?: Tag[];
}

export interface ProductReviewWithProfile extends ProductReview {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

// Admin types
export type AdminAction = Tables['admin_actions']['Row'];
export type AdminActionInsert = Tables['admin_actions']['Insert'];
export type AdminActionUpdate = Tables['admin_actions']['Update'];

export type AdminImpersonationSession = Tables['admin_impersonation_sessions']['Row'];
export type AdminImpersonationSessionInsert = Tables['admin_impersonation_sessions']['Insert'];
export type AdminImpersonationSessionUpdate = Tables['admin_impersonation_sessions']['Update'];

// Site health and performance types
export type SiteHealthCheck = Tables['site_health_checks']['Row'];
export type SiteHealthCheckInsert = Tables['site_health_checks']['Insert'];
export type SiteHealthCheckUpdate = Tables['site_health_checks']['Update'];

export type SitePerformanceMetrics = Tables['site_performance_metrics']['Row'];
export type SitePerformanceMetricsInsert = Tables['site_performance_metrics']['Insert'];
export type SitePerformanceMetricsUpdate = Tables['site_performance_metrics']['Update'];

// Site template types
export type SiteTemplate = Tables['site_templates']['Row'];
export type SiteTemplateInsert = Tables['site_templates']['Insert'];
export type SiteTemplateUpdate = Tables['site_templates']['Update'];

// Extended types
export type SiteWithMemberships = Site & {
  site_memberships: SiteMembership[];
};

export type SiteWithTemplate = Site & {
  template?: SiteTemplate;
};

// Event types
export type Event = Tables['events']['Row'];
export type EventInsert = Tables['events']['Insert'];
export type EventUpdate = Tables['events']['Update'];
export type EventMedia = Tables['event_media']['Row'];
export type EventMediaInsert = Tables['event_media']['Insert'];
export type EventMediaUpdate = Tables['event_media']['Update'];
export type EventAttachment = Tables['event_attachments']['Row'];
export type EventAttachmentInsert = Tables['event_attachments']['Insert'];
export type EventAttachmentUpdate = Tables['event_attachments']['Update'];
export type EventAssociation = Tables['event_associations']['Row'];
export type EventAssociationInsert = Tables['event_associations']['Insert'];
export type EventAssociationUpdate = Tables['event_associations']['Update'];

// Event status type
export type EventStatus = 'draft' | 'published' | 'unpublished';

// Extended event types
export type EventWithRelations = Event & {
  media?: EventMedia[];
  attachments?: EventAttachment[];
  associations?: EventAssociation[];
};

// Role types
export type SiteMembershipRole = 'owner' | 'editor' | 'viewer';
export type UserRole = 'platform_admin' | 'site_owner' | 'customer';
export type UserType = 'platform_admin' | 'site_owner' | 'customer';
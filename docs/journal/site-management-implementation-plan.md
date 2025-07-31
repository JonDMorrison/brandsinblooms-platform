# Site Management Implementation Plan

## Overview
Implementation plan for comprehensive site management features within the platform admin system. This builds upon the completed admin authentication system (`/admin`) to provide full site management capabilities for platform administrators.

## Requirements Analysis

### Core Admin Site Management Capabilities
Based on `@docs/admin-experience.md`, the admin system requires:

1. **Global Site Dashboard**: View all sites with search, filter, and status indicators
2. **Site Management**: Direct management of any site's content and products  
3. **Site Creation**: Ability to create new sites for customers
4. **Domain Management**: Handle custom domains and subdomain assignment
5. **Site Impersonation**: Access sites as if logged in as the site owner
6. **Site Analytics**: Basic metrics and health monitoring per site

### Current Database Schema Context
From the existing schema migration `20250729120000_create_refined_schema.sql`:
- `sites` table with comprehensive site data
- `site_memberships` for user-site relationships with roles
- `profiles` table with role-based access (`admin`, `site_owner`, `customer`)
- Complete multi-tenant isolation with RLS policies

## Implementation Milestones

### Milestone 1: Site List & Search Infrastructure
**Goal**: Implement comprehensive site listing with search and filtering capabilities

#### Database Extensions
```sql
-- Add site status fields for admin management
ALTER TABLE public.sites 
ADD COLUMN admin_notes TEXT,
ADD COLUMN last_activity_at TIMESTAMPTZ,
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Add site metrics tracking table
CREATE TABLE public.site_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    unique_visitors INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    content_count INTEGER DEFAULT 0,
    product_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(site_id, metric_date)
);

-- Create indexes for admin queries
CREATE INDEX idx_sites_created_at ON public.sites(created_at DESC);
CREATE INDEX idx_sites_last_activity ON public.sites(last_activity_at DESC NULLS LAST);
CREATE INDEX idx_site_metrics_date ON public.site_metrics(site_id, metric_date DESC);

-- Admin function to get site stats
CREATE OR REPLACE FUNCTION public.get_site_summary_stats(site_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Only allow admins to access this function
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    SELECT json_build_object(
        'total_content', (SELECT COUNT(*) FROM public.content WHERE site_id = site_uuid),
        'published_content', (SELECT COUNT(*) FROM public.content WHERE site_id = site_uuid AND is_published = true),
        'total_products', (SELECT COUNT(*) FROM public.products WHERE site_id = site_uuid),
        'active_products', (SELECT COUNT(*) FROM public.products WHERE site_id = site_uuid AND is_active = true),
        'total_inquiries', (SELECT COUNT(*) FROM public.contact_inquiries WHERE site_id = site_uuid),
        'recent_inquiries', (SELECT COUNT(*) FROM public.contact_inquiries WHERE site_id = site_uuid AND created_at > NOW() - INTERVAL '30 days'),
        'site_owners', (SELECT COUNT(*) FROM public.site_memberships WHERE site_id = site_uuid AND role = 'owner' AND is_active = true)
    ) INTO result;
    
    RETURN result;
END;
$$;
```

#### React Components
1. **SiteListView** (`src/components/admin/sites/SiteListView.tsx`)
   - Comprehensive site table with sortable columns
   - Real-time search by name, subdomain, custom domain
   - Filter by status (active/inactive, published/draft)
   - Pagination for large site collections
   - Bulk actions for status changes

2. **SiteSearchFilters** (`src/components/admin/sites/SiteSearchFilters.tsx`)
   - Advanced filtering interface
   - Date range filters for creation/activity
   - Status toggle filters
   - Tag-based filtering

3. **SiteCard** (`src/components/admin/sites/SiteCard.tsx`)
   - Quick site overview component
   - Key metrics display (content, products, inquiries)
   - Quick action buttons (edit, view, impersonate)

#### API Layer
1. **Admin Sites Service** (`src/lib/admin/sites.ts`)
   - `getAllSites()` with pagination and filtering
   - `searchSites(query, filters)` with advanced search
   - `getSiteStats(siteId)` for metrics display
   - `updateSiteStatus(siteId, status)` for admin control

#### Admin Route
- `/admin/sites` - Main site management page
- `/admin/sites/search` - Advanced search interface

**Deliverables**:
- Complete site listing with search/filter UI
- Database schema updates for admin management
- API services for site data retrieval
- Comprehensive site metrics display

---

### Milestone 2: Site Creation & Configuration
**Goal**: Enable admins to create and configure new sites

#### Database Extensions
```sql
-- Site creation template system
CREATE TABLE public.site_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default site templates
INSERT INTO public.site_templates (name, description, template_data) VALUES
('Garden Center Basic', 'Basic template for garden centers', '{
    "pages": [
        {"title": "Home", "slug": "home", "content_type": "page", "is_published": true},
        {"title": "About Us", "slug": "about", "content_type": "page", "is_published": false},
        {"title": "Contact", "slug": "contact", "content_type": "page", "is_published": true}
    ],
    "default_categories": ["Plants", "Tools", "Fertilizers", "Seeds"],
    "theme_settings": {
        "primary_color": "#22c55e",
        "business_hours": {"mon-fri": "8:00-17:00", "sat": "8:00-15:00", "sun": "closed"}
    }
}'),
('Plant Nursery', 'Specialized template for plant nurseries', '{
    "pages": [
        {"title": "Home", "slug": "home", "content_type": "page", "is_published": true},  
        {"title": "Our Plants", "slug": "plants", "content_type": "page", "is_published": true},
        {"title": "Care Guides", "slug": "care-guides", "content_type": "page", "is_published": true},
        {"title": "Contact", "slug": "contact", "content_type": "page", "is_published": true}
    ],
    "default_categories": ["Indoor Plants", "Outdoor Plants", "Succulents", "Herbs"],
    "theme_settings": {
        "primary_color": "#16a34a"
    }
}');

-- Site creation function with template support
CREATE OR REPLACE FUNCTION public.create_site_with_template(
    site_name TEXT,
    subdomain_name TEXT,
    owner_email TEXT,
    template_id UUID DEFAULT NULL,
    business_info JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_site_id UUID;
    owner_user_id UUID;
    template_data JSONB;
    page_data JSONB;
BEGIN
    -- Only allow admins to create sites
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Find or create site owner
    SELECT id INTO owner_user_id FROM public.profiles WHERE email = owner_email;
    IF owner_user_id IS NULL THEN
        RAISE EXCEPTION 'Site owner email not found: %', owner_email;
    END IF;
    
    -- Create the site
    INSERT INTO public.sites (
        name, subdomain, 
        business_name, business_email,
        primary_color, business_hours,
        created_by, is_active, is_published
    ) VALUES (
        site_name, subdomain_name,
        COALESCE(business_info->>'business_name', site_name),
        COALESCE(business_info->>'business_email', owner_email),
        COALESCE(business_info->>'primary_color', '#22c55e'),
        COALESCE(business_info->'business_hours', '{"mon-fri": "8:00-17:00", "sat": "8:00-15:00", "sun": "closed"}'::jsonb),
        auth.uid(), true, false
    ) RETURNING id INTO new_site_id;
    
    -- Add owner membership
    INSERT INTO public.site_memberships (user_id, site_id, role, is_active)
    VALUES (owner_user_id, new_site_id, 'owner', true);
    
    -- Apply template if provided
    IF template_id IS NOT NULL THEN
        SELECT template_data INTO template_data FROM public.site_templates WHERE id = template_id;
        IF template_data IS NOT NULL THEN
            -- Create template pages
            FOR page_data IN SELECT * FROM jsonb_array_elements(template_data->'pages')
            LOOP
                INSERT INTO public.content (
                    site_id, title, slug, content_type, 
                    content, is_published, author_id
                ) VALUES (
                    new_site_id,
                    page_data->>'title',
                    page_data->>'slug', 
                    page_data->>'content_type',
                    '{"blocks": []}'::jsonb,
                    (page_data->>'is_published')::boolean,
                    owner_user_id
                );
            END LOOP;
        END IF;
    END IF;
    
    RETURN new_site_id;
END;
$$;
```

#### React Components
1. **SiteCreationWizard** (`src/components/admin/sites/SiteCreationWizard.tsx`)
   - Multi-step site creation form
   - Template selection with previews
   - Business information collection
   - Owner assignment interface
   - Subdomain availability checking

2. **SiteConfigurationForm** (`src/components/admin/sites/SiteConfigurationForm.tsx`)
   - Complete site settings management
   - Business details, branding, contact info
   - Domain configuration (subdomain/custom)
   - Site status and visibility controls

3. **TemplateSelector** (`src/components/admin/sites/TemplateSelector.tsx`)
   - Visual template selection interface
   - Template preview capabilities
   - Custom template creation tools

#### Admin Routes
- `/admin/sites/new` - Site creation wizard
- `/admin/sites/[id]/edit` - Site configuration editing
- `/admin/sites/templates` - Template management

**Deliverables**:
- Complete site creation workflow
- Template system for consistent site setup
- Advanced site configuration management
- Owner assignment and permission system

---

### Milestone 3: Site Content & Product Management
**Goal**: Direct content and product management capabilities for any site

#### Database Extensions
```sql
-- Admin action logging for audit trail
CREATE TABLE public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    target_site_id UUID REFERENCES public.sites(id),
    target_resource_type VARCHAR(50) NOT NULL,
    target_resource_id UUID,
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_admin_actions_site ON public.admin_actions(target_site_id, created_at DESC);
CREATE INDEX idx_admin_actions_admin ON public.admin_actions(admin_user_id, created_at DESC);

-- Enhanced content management for admins
CREATE OR REPLACE FUNCTION public.admin_update_content(
    content_id UUID,
    updates JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    site_id UUID;
BEGIN
    -- Only allow admins
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Get site_id for logging
    SELECT c.site_id INTO site_id FROM public.content c WHERE c.id = content_id;
    
    -- Update content with provided fields
    UPDATE public.content 
    SET
        title = COALESCE(updates->>'title', title),
        content = COALESCE(updates->'content', content),
        is_published = COALESCE((updates->>'is_published')::boolean, is_published),
        is_featured = COALESCE((updates->>'is_featured')::boolean, is_featured),
        updated_at = NOW()
    WHERE id = content_id;
    
    -- Log admin action
    INSERT INTO public.admin_actions (
        admin_user_id, target_site_id, target_resource_type, 
        target_resource_id, action_type, action_details
    ) VALUES (
        auth.uid(), site_id, 'content', 
        content_id, 'update', updates
    );
    
    RETURN TRUE;
END;
$$;

-- Similar function for product management
CREATE OR REPLACE FUNCTION public.admin_update_product(
    product_id UUID,
    updates JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    site_id UUID;
BEGIN
    -- Only allow admins
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Get site_id for logging
    SELECT p.site_id INTO site_id FROM public.products p WHERE p.id = product_id;
    
    -- Update product with provided fields
    UPDATE public.products 
    SET
        name = COALESCE(updates->>'name', name),
        description = COALESCE(updates->>'description', description),
        price = COALESCE((updates->>'price')::decimal, price),
        is_active = COALESCE((updates->>'is_active')::boolean, is_active),
        is_featured = COALESCE((updates->>'is_featured')::boolean, is_featured),
        updated_at = NOW()
    WHERE id = product_id;
    
    -- Log admin action
    INSERT INTO public.admin_actions (
        admin_user_id, target_site_id, target_resource_type, 
        target_resource_id, action_type, action_details
    ) VALUES (
        auth.uid(), site_id, 'product', 
        product_id, 'update', updates
    );
    
    RETURN TRUE;
END;
$$;
```

#### React Components
1. **SiteContentManager** (`src/components/admin/sites/SiteContentManager.tsx`)
   - Integrated content management for any site
   - Content listing with inline editing capabilities
   - Bulk content operations (publish/unpublish, feature)
   - Content creation with template support

2. **SiteProductManager** (`src/components/admin/sites/SiteProductManager.tsx`)
   - Complete product catalog management
   - Advanced product search and filtering
   - Bulk product operations and CSV import
   - Product category and pricing management

3. **AdminActionLog** (`src/components/admin/sites/AdminActionLog.tsx`)
   - Audit trail for admin actions on sites
   - Filterable action history
   - Rollback capabilities for certain changes

#### API Services
1. **Admin Content Service** (`src/lib/admin/content.ts`)
   - Cross-site content management functions
   - Bulk content operations
   - Content analytics and performance metrics

2. **Admin Product Service** (`src/lib/admin/products.ts`)
   - Cross-site product management
   - Inventory tracking and alerts
   - Pricing analysis and recommendations

#### Admin Routes
- `/admin/sites/[id]/content` - Site content management
- `/admin/sites/[id]/products` - Site product management
- `/admin/sites/[id]/activity` - Admin action audit log

**Deliverables**:
- Direct content management for any site
- Complete product catalog administration
- Audit logging for all admin actions
- Bulk operation capabilities

---

### Milestone 4: Site Impersonation & Direct Access
**Goal**: Secure impersonation system allowing admins to access sites as owners

#### Database Extensions
```sql
-- Impersonation session tracking
CREATE TABLE public.admin_impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id),
    target_site_id UUID NOT NULL REFERENCES public.sites(id),
    impersonated_as_user_id UUID NOT NULL REFERENCES auth.users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_impersonation_sessions_token ON public.admin_impersonation_sessions(session_token);
CREATE INDEX idx_impersonation_sessions_admin ON public.admin_impersonation_sessions(admin_user_id, is_active);

-- Function to start impersonation session
CREATE OR REPLACE FUNCTION public.start_admin_impersonation(
    target_site_id UUID,
    impersonate_user_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_token TEXT;
    target_user_id UUID;
BEGIN
    -- Only allow admins
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- If no specific user provided, use site owner
    IF impersonate_user_id IS NULL THEN
        SELECT sm.user_id INTO target_user_id 
        FROM public.site_memberships sm 
        WHERE sm.site_id = target_site_id AND sm.role = 'owner' AND sm.is_active = true
        LIMIT 1;
    ELSE
        target_user_id := impersonate_user_id;
    END IF;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'No valid target user found for impersonation';
    END IF;
    
    -- Generate secure session token
    session_token := encode(gen_random_bytes(32), 'base64');
    
    -- End any existing active sessions for this admin/site combo
    UPDATE public.admin_impersonation_sessions 
    SET is_active = false, ended_at = NOW()
    WHERE admin_user_id = auth.uid() 
      AND target_site_id = start_admin_impersonation.target_site_id 
      AND is_active = true;
    
    -- Create new impersonation session (2 hour expiry)
    INSERT INTO public.admin_impersonation_sessions (
        admin_user_id, target_site_id, impersonated_as_user_id,
        session_token, expires_at
    ) VALUES (
        auth.uid(), target_site_id, target_user_id,
        session_token, NOW() + INTERVAL '2 hours'
    );
    
    RETURN session_token;
END;
$$;

-- Function to validate and get impersonation context
CREATE OR REPLACE FUNCTION public.get_impersonation_context(token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    context JSON;
BEGIN
    SELECT json_build_object(
        'admin_user_id', ais.admin_user_id,
        'site_id', ais.target_site_id,
        'impersonated_user_id', ais.impersonated_as_user_id,
        'site_subdomain', s.subdomain,
        'site_name', s.name,
        'expires_at', ais.expires_at
    ) INTO context
    FROM public.admin_impersonation_sessions ais
    JOIN public.sites s ON s.id = ais.target_site_id
    WHERE ais.session_token = token 
      AND ais.is_active = true 
      AND ais.expires_at > NOW();
    
    RETURN context;
END;
$$;
```

#### Middleware & Context Updates
1. **Impersonation Middleware** (`src/middleware/impersonation.ts`)
   - Detect impersonation tokens in requests
   - Validate impersonation sessions
   - Set appropriate user context for impersonated requests

2. **Admin Impersonation Context** (`src/contexts/AdminImpersonationContext.tsx`)
   - Track active impersonation sessions
   - Provide impersonation controls in admin interface
   - Session management and security

#### React Components
1. **SiteImpersonationControls** (`src/components/admin/sites/SiteImpersonationControls.tsx`)
   - Impersonation start/stop interface
   - User selection for impersonation targets
   - Session status and time remaining display

2. **ImpersonationBanner** (`src/components/admin/ImpersonationBanner.tsx`)
   - Visible banner when in impersonation mode
   - Quick admin return and session controls
   - Security reminder and session info

3. **SiteAccessPortal** (`src/components/admin/sites/SiteAccessPortal.tsx`)
   - Direct site access options
   - Site preview capabilities
   - Quick management shortcuts

#### Security Features
- Time-limited impersonation sessions (2 hours max)
- Audit logging for all impersonation activities
- Clear visual indicators when in impersonation mode
- Automatic session expiry and cleanup

**Deliverables**:
- Secure site impersonation system
- Direct site access for troubleshooting
- Complete audit trail for security
- User-friendly impersonation interface

---

### Milestone 5: Site Analytics & Health Monitoring
**Goal**: Comprehensive site health and performance monitoring

#### Database Extensions
```sql
-- Detailed site health metrics
CREATE TABLE public.site_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    check_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    message TEXT,
    details JSONB,
    checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_site_health_site_status ON public.site_health_checks(site_id, status, checked_at DESC);

-- Site performance metrics
CREATE TABLE public.site_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    metric_period VARCHAR(20) NOT NULL CHECK (metric_period IN ('hourly', 'daily', 'weekly', 'monthly')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Traffic metrics
    unique_visitors INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    avg_session_duration INTERVAL,
    
    -- Content metrics  
    content_views JSONB DEFAULT '{}',
    popular_pages JSONB DEFAULT '[]',
    
    -- Product metrics
    product_views JSONB DEFAULT '{}',
    popular_products JSONB DEFAULT '[]',
    
    -- Engagement metrics
    inquiry_count INTEGER DEFAULT 0,
    newsletter_signups INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(site_id, metric_period, period_start)
);

-- Site health monitoring function
CREATE OR REPLACE FUNCTION public.check_site_health(site_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    health_report JSON;
    content_count INTEGER;
    product_count INTEGER;
    recent_activity TIMESTAMPTZ;
    issues JSONB := '[]'::jsonb;
BEGIN
    -- Only allow admins
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Check content health
    SELECT COUNT(*) INTO content_count FROM public.content WHERE site_id = site_uuid AND is_published = true;
    IF content_count = 0 THEN
        issues := issues || '{"type": "content", "severity": "warning", "message": "No published content found"}'::jsonb;
    END IF;
    
    -- Check product catalog health
    SELECT COUNT(*) INTO product_count FROM public.products WHERE site_id = site_uuid AND is_active = true;
    IF product_count = 0 THEN
        issues := issues || '{"type": "products", "severity": "warning", "message": "No active products found"}'::jsonb;
    END IF;
    
    -- Check recent activity
    SELECT MAX(updated_at) INTO recent_activity 
    FROM (
        SELECT updated_at FROM public.content WHERE site_id = site_uuid
        UNION ALL
        SELECT updated_at FROM public.products WHERE site_id = site_uuid
        UNION ALL
        SELECT created_at FROM public.contact_inquiries WHERE site_id = site_uuid
    ) as activity;
    
    IF recent_activity < NOW() - INTERVAL '30 days' THEN
        issues := issues || '{"type": "activity", "severity": "warning", "message": "No recent activity detected"}'::jsonb;
    END IF;
    
    -- Build health report
    SELECT json_build_object(
        'site_id', site_uuid,
        'checked_at', NOW(),
        'overall_status', CASE 
            WHEN jsonb_array_length(issues) = 0 THEN 'healthy'
            WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(issues) issue WHERE issue->>'severity' = 'critical') THEN 'critical'
            ELSE 'warning'
        END,
        'content_count', content_count,
        'product_count', product_count,
        'last_activity', recent_activity,
        'issues', issues
    ) INTO health_report;
    
    -- Store health check result
    INSERT INTO public.site_health_checks (site_id, check_type, status, details)
    VALUES (site_uuid, 'comprehensive', 
            (health_report->>'overall_status')::VARCHAR, 
            health_report);
    
    RETURN health_report;
END;
$$;
```

#### React Components
1. **SiteHealthDashboard** (`src/components/admin/sites/SiteHealthDashboard.tsx`)
   - Overall platform health overview
   - Site health status indicators
   - Critical issue alerts and recommendations

2. **SiteAnalytics** (`src/components/admin/sites/SiteAnalytics.tsx`)
   - Comprehensive site performance metrics
   - Traffic analysis and trends
   - Content and product performance data

3. **SiteHealthDetails** (`src/components/admin/sites/SiteHealthDetails.tsx`)
   - Detailed health analysis for individual sites
   - Issue diagnosis and resolution suggestions
   - Historical health tracking

#### API Services
1. **Site Monitoring Service** (`src/lib/admin/monitoring.ts`)
   - Automated health check scheduling
   - Performance metric collection
   - Alert and notification management

2. **Analytics Service** (`src/lib/admin/analytics.ts`)
   - Cross-site analytics aggregation
   - Trend analysis and reporting
   - Performance benchmarking

#### Admin Routes
- `/admin/sites/health` - Platform health overview
- `/admin/sites/[id]/analytics` - Individual site analytics
- `/admin/sites/[id]/health` - Site health details

**Deliverables**:
- Automated site health monitoring
- Comprehensive analytics dashboard
- Performance trend analysis
- Alert system for critical issues

---

## Implementation Sequence & Dependencies

### Phase 1: Foundation (Milestones 1-2)
- Database schema extensions for site management
- Core site listing and search functionality  
- Site creation and configuration system
- **Dependencies**: Completed admin authentication system

### Phase 2: Management (Milestones 3-4)  
- Content and product management capabilities
- Site impersonation and direct access system
- **Dependencies**: Phase 1 completion, security review

### Phase 3: Intelligence (Milestone 5)
- Analytics and health monitoring system
- Performance optimization recommendations
- **Dependencies**: Phase 2 completion, data collection infrastructure

## Technical Architecture Decisions

### Database Design Principles
- **Audit Trail**: All admin actions logged for security and compliance
- **Performance**: Optimized indexes for admin query patterns
- **Security**: All admin functions use `SECURITY DEFINER` with role checks
- **Scalability**: Partitioned metrics tables for high-volume data

### React Architecture
- **Modular Components**: Each feature as self-contained component tree
- **Consistent State**: TanStack Query for server state management
- **Type Safety**: Full TypeScript coverage with generated database types
- **Reusable Patterns**: Shared components for common admin operations

### Security Implementation
- **Multi-layered**: Database RLS + API validation + client-side checks
- **Audit Logging**: Complete trail of admin activities
- **Session Management**: Secure impersonation with time limits
- **Role Enforcement**: Consistent admin role verification across all operations

## Testing Strategy

### Unit Testing
- Database function testing with test data
- Component testing with mocked admin contexts
- API service testing with mock database responses

### Integration Testing  
- End-to-end admin workflows
- Cross-site operation testing
- Security boundary testing

### Security Testing
- Admin privilege escalation prevention
- Impersonation session security
- Audit log integrity verification

## Performance Considerations

### Database Optimization
- Indexed queries for admin operations
- Efficient pagination for large datasets
- Query optimization for cross-site analytics

### Frontend Performance
- Lazy loading for complex admin interfaces
- Optimistic updates for frequent operations
- Efficient state management with TanStack Query

### Scalability Planning
- Metric data partitioning strategy
- Background job processing for analytics
- CDN integration for admin assets

## Deployment & Rollout

### Migration Strategy
1. Database migrations applied during maintenance window
2. Feature flags for gradual rollout of admin features
3. Admin user training and documentation

### Monitoring & Observability
- Admin action monitoring and alerting
- Performance metrics for admin operations  
- Error tracking and logging

### Documentation Requirements
- Admin user guides for each feature
- API documentation for admin endpoints
- Security procedures and best practices

## Success Metrics

### Functional Metrics
- **Site Management Efficiency**: Time to complete common admin tasks
- **Error Reduction**: Decrease in site-related support tickets
- **Feature Adoption**: Usage metrics for each admin feature

### Technical Metrics
- **Performance**: Admin page load times < 2 seconds
- **Reliability**: 99.9% uptime for admin functionality
- **Security**: Zero admin privilege escalation incidents

### User Experience Metrics
- **Admin Satisfaction**: User feedback and satisfaction scores
- **Training Effectiveness**: Time to proficiency for new admins
- **Support Reduction**: Decrease in admin-related support requests

---

This implementation plan provides a complete, milestone-based approach to building comprehensive site management capabilities within the admin system. Each milestone delivers tangible value while building toward the full vision of powerful, user-friendly site administration tools.
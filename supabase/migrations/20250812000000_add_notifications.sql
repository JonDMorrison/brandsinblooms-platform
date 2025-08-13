-- Migration: Add Notifications System
-- Description: Create notifications table with multi-tenant RLS, indexes, and order status triggers

-- =============================================
-- 1. CREATE NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('order', 'product', 'system', 'marketing', 'security')),
    priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- 2. CREATE PERFORMANCE INDEXES
-- =============================================

-- Index for user notifications within a site, ordered by creation time
CREATE INDEX idx_notifications_user_site_created ON notifications(user_id, site_id, created_at DESC);

-- Index for unread notifications by user
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE;

-- Index for site and category filtering
CREATE INDEX idx_notifications_site_category ON notifications(site_id, category, created_at DESC);

-- Index for related entity lookups
CREATE INDEX idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id) WHERE related_entity_type IS NOT NULL;

-- Index for priority filtering
CREATE INDEX idx_notifications_priority ON notifications(priority, created_at DESC) WHERE priority IN ('high', 'urgent');

-- =============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Site members can view notifications for their sites
CREATE POLICY "site_members_view_notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM site_memberships sm
            WHERE sm.site_id = notifications.site_id
            AND sm.user_id = auth.uid()
            AND sm.is_active = true
        )
    );

-- Site members can update notifications they own
CREATE POLICY "users_update_own_notifications" ON notifications
    FOR UPDATE USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM site_memberships sm
            WHERE sm.site_id = notifications.site_id
            AND sm.user_id = auth.uid()
            AND sm.is_active = true
        )
    );

-- Site owners and editors can create notifications for their sites
CREATE POLICY "site_members_create_notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM site_memberships sm
            WHERE sm.site_id = notifications.site_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('owner', 'editor')
            AND sm.is_active = true
        )
    );

-- Site owners and editors can delete notifications for their sites
CREATE POLICY "site_members_delete_notifications" ON notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM site_memberships sm
            WHERE sm.site_id = notifications.site_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('owner', 'editor')
            AND sm.is_active = true
        )
    );

-- =============================================
-- 4. CREATE TRIGGER FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Automatically set read_at when is_read changes to true
    IF OLD.is_read = FALSE AND NEW.is_read = TRUE AND NEW.read_at IS NULL THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for updated_at
CREATE TRIGGER update_notifications_updated_at_trigger
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Function to create order status change notifications
CREATE OR REPLACE FUNCTION create_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_type TEXT;
    target_user_id UUID;
    site_owner_id UUID;
BEGIN
    -- Only process status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Determine notification content based on status
        CASE NEW.status
            WHEN 'processing' THEN
                notification_title := 'Order is being processed';
                notification_message := 'Your order #' || NEW.order_number || ' is now being processed.';
                notification_type := 'order_processing';
            WHEN 'shipped' THEN
                notification_title := 'Order shipped';
                notification_message := 'Your order #' || NEW.order_number || ' has been shipped and is on its way!';
                notification_type := 'order_shipped';
            WHEN 'delivered' THEN
                notification_title := 'Order delivered';
                notification_message := 'Your order #' || NEW.order_number || ' has been delivered. Thank you for your business!';
                notification_type := 'order_delivered';
            WHEN 'cancelled' THEN
                notification_title := 'Order cancelled';
                notification_message := 'Your order #' || NEW.order_number || ' has been cancelled.';
                notification_type := 'order_cancelled';
            WHEN 'refunded' THEN
                notification_title := 'Order refunded';
                notification_message := 'Your order #' || NEW.order_number || ' has been refunded.';
                notification_type := 'order_refunded';
            ELSE
                -- Don't create notifications for other status changes
                RETURN NEW;
        END CASE;

        -- Create notification for the customer
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO notifications (
                site_id,
                user_id,
                type,
                category,
                priority,
                title,
                message,
                action_url,
                data,
                related_entity_type,
                related_entity_id
            ) VALUES (
                NEW.site_id,
                NEW.customer_id,
                notification_type,
                'order',
                CASE 
                    WHEN NEW.status IN ('cancelled', 'refunded') THEN 'high'
                    WHEN NEW.status = 'delivered' THEN 'normal'
                    ELSE 'normal'
                END,
                notification_title,
                notification_message,
                '/orders/' || NEW.id,
                jsonb_build_object(
                    'order_number', NEW.order_number,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'total_amount', NEW.total_amount,
                    'currency', COALESCE(NEW.currency, 'USD')
                ),
                'order',
                NEW.id
            );
        END IF;

        -- Create notification for site owner/managers about important status changes
        IF NEW.status IN ('cancelled', 'refunded') THEN
            -- Get site owner
            SELECT sm.user_id INTO site_owner_id
            FROM site_memberships sm
            WHERE sm.site_id = NEW.site_id
            AND sm.role = 'owner'
            AND sm.is_active = true
            LIMIT 1;

            IF site_owner_id IS NOT NULL AND site_owner_id != NEW.customer_id THEN
                INSERT INTO notifications (
                    site_id,
                    user_id,
                    type,
                    category,
                    priority,
                    title,
                    message,
                    action_url,
                    data,
                    related_entity_type,
                    related_entity_id
                ) VALUES (
                    NEW.site_id,
                    site_owner_id,
                    'order_status_alert',
                    'order',
                    'high',
                    'Order ' || NEW.status,
                    'Order #' || NEW.order_number || ' from ' || COALESCE(NEW.customer_name, 'Unknown') || ' has been ' || NEW.status || '.',
                    '/admin/orders/' || NEW.id,
                    jsonb_build_object(
                        'order_number', NEW.order_number,
                        'customer_name', NEW.customer_name,
                        'customer_email', NEW.customer_email,
                        'old_status', OLD.status,
                        'new_status', NEW.status,
                        'total_amount', NEW.total_amount,
                        'currency', COALESCE(NEW.currency, 'USD')
                    ),
                    'order',
                    NEW.id
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply order status notification trigger
DROP TRIGGER IF EXISTS create_order_status_notification_trigger ON orders;
CREATE TRIGGER create_order_status_notification_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_order_status_notification();

-- =============================================
-- 5. CREATE UTILITY FUNCTIONS
-- =============================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
    WHERE id = notification_id 
    AND user_id = auth.uid()
    AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user in a site
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_site_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
    WHERE site_id = p_site_id 
    AND user_id = auth.uid()
    AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_site_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE site_id = p_site_id
        AND user_id = auth.uid()
        AND is_read = FALSE
        AND is_archived = FALSE
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- 6. CREATE VIEWS FOR COMMON QUERIES
-- =============================================

-- View for unread notifications with site info
CREATE OR REPLACE VIEW public.unread_notifications AS
SELECT 
    n.*,
    s.name as site_name,
    s.subdomain,
    s.custom_domain
FROM notifications n
JOIN sites s ON n.site_id = s.id
WHERE n.is_read = FALSE 
AND n.is_archived = FALSE;

-- View for notification summary by category
CREATE OR REPLACE VIEW public.notification_summary AS
SELECT 
    site_id,
    user_id,
    category,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_read = FALSE) as unread_count,
    COUNT(*) FILTER (WHERE priority IN ('high', 'urgent')) as high_priority_count,
    MAX(created_at) as latest_notification
FROM notifications
WHERE is_archived = FALSE
GROUP BY site_id, user_id, category;

-- =============================================
-- 7. GRANTS AND PERMISSIONS
-- =============================================

-- Grant permissions to authenticated users
GRANT ALL ON notifications TO authenticated;
GRANT SELECT ON unread_notifications TO authenticated;
GRANT SELECT ON notification_summary TO authenticated;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- =============================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE notifications IS 'System notifications for users within sites';
COMMENT ON COLUMN notifications.type IS 'Specific notification type for programmatic handling';
COMMENT ON COLUMN notifications.category IS 'High-level category for filtering and organization';
COMMENT ON COLUMN notifications.priority IS 'Notification priority level affecting display order';
COMMENT ON COLUMN notifications.data IS 'Additional structured data for the notification';
COMMENT ON COLUMN notifications.related_entity_type IS 'Type of entity this notification relates to (order, product, etc.)';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID of the related entity';

COMMENT ON VIEW unread_notifications IS 'Active unread notifications with site information';
COMMENT ON VIEW notification_summary IS 'Aggregated notification statistics by category';

COMMENT ON FUNCTION mark_notification_read IS 'Mark a specific notification as read for the current user';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Mark all notifications as read for a user in a specific site';
COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for a user in a specific site';
COMMENT ON FUNCTION create_order_status_notification IS 'Automatically create notifications when order status changes';
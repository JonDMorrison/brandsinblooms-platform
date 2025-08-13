-- Seed data for notifications testing
-- This script creates various types of notifications for testing the notification system

-- Clean existing test notifications (optional - comment out if you want to keep existing ones)
-- DELETE FROM public.notifications WHERE site_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Insert varied notifications for testing
-- Note: Replace the user_id with your actual test user ID after checking the profiles table

DO $$
DECLARE
    test_user_id UUID;
    test_site_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
    -- Get the first available user from profiles (or you can specify a specific one)
    SELECT user_id INTO test_user_id 
    FROM public.profiles 
    WHERE email IS NOT NULL
    LIMIT 1;
    
    -- If no user exists, use the default test user
    IF test_user_id IS NULL THEN
        test_user_id := '22222222-2222-2222-2222-222222222222'::uuid;
        
        -- Ensure the test user exists in profiles
        INSERT INTO public.profiles (user_id, email, full_name, created_at, updated_at)
        VALUES (test_user_id, 'test@example.com', 'Test User', NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Insert various notification types
    
    -- Order notifications (unread, high priority)
    INSERT INTO public.notifications (site_id, user_id, type, category, priority, title, message, action_url, is_read, created_at) VALUES
    (test_site_id, test_user_id, 'order_shipped', 'orders', 'high', 'Order Shipped! 📦', 'Your order #ORD-2024-001 has been shipped and is on its way!', '/dashboard/orders/123', false, NOW() - INTERVAL '2 hours'),
    (test_site_id, test_user_id, 'order_delivered', 'orders', 'normal', 'Order Delivered ✅', 'Your order #ORD-2024-002 has been successfully delivered.', '/dashboard/orders/124', false, NOW() - INTERVAL '1 day'),
    (test_site_id, test_user_id, 'order_processing', 'orders', 'normal', 'Order Being Processed', 'Your order #ORD-2024-003 is currently being processed.', '/dashboard/orders/125', true, NOW() - INTERVAL '2 days');

    -- Payment notifications (mixed read status)
    INSERT INTO public.notifications (site_id, user_id, type, category, priority, title, message, action_url, is_read, created_at) VALUES
    (test_site_id, test_user_id, 'payment_received', 'payments', 'high', 'Payment Received 💰', 'Payment of $299.99 has been successfully received for order #ORD-2024-001.', '/dashboard/orders/123', false, NOW() - INTERVAL '3 hours'),
    (test_site_id, test_user_id, 'payment_failed', 'payments', 'urgent', 'Payment Failed ⚠️', 'Payment processing failed for order #ORD-2024-004. Please update your payment method.', '/dashboard/settings', false, NOW() - INTERVAL '30 minutes'),
    (test_site_id, test_user_id, 'refund_processed', 'payments', 'normal', 'Refund Processed', 'Your refund of $49.99 has been processed and will appear in 3-5 business days.', '/dashboard/orders/122', true, NOW() - INTERVAL '3 days');

    -- Product notifications
    INSERT INTO public.notifications (site_id, user_id, type, category, priority, title, message, action_url, is_read, created_at) VALUES
    (test_site_id, test_user_id, 'low_stock_alert', 'products', 'high', 'Low Stock Alert 📉', 'Product "Premium Bouquet" is running low on stock (only 3 left).', '/dashboard/products/456', false, NOW() - INTERVAL '4 hours'),
    (test_site_id, test_user_id, 'product_review', 'products', 'normal', 'New Product Review ⭐', 'A customer left a 5-star review on "Rose Garden Collection".', '/dashboard/products/457', false, NOW() - INTERVAL '6 hours'),
    (test_site_id, test_user_id, 'product_question', 'products', 'normal', 'Customer Question', 'A customer asked a question about "Seasonal Flowers Package".', '/dashboard/products/458', true, NOW() - INTERVAL '1 day');

    -- Message notifications
    INSERT INTO public.notifications (site_id, user_id, type, category, priority, title, message, action_url, is_read, created_at) VALUES
    (test_site_id, test_user_id, 'new_message', 'messages', 'normal', 'New Message 💬', 'You have a new message from Sarah Johnson regarding custom arrangements.', '/dashboard/messages/789', false, NOW() - INTERVAL '45 minutes'),
    (test_site_id, test_user_id, 'contact_form', 'messages', 'normal', 'Contact Form Submission', 'New contact form submission from potential customer about wedding flowers.', '/dashboard/messages/790', false, NOW() - INTERVAL '2 hours'),
    (test_site_id, test_user_id, 'customer_inquiry', 'messages', 'high', 'Urgent Customer Inquiry', 'A customer needs help with their bulk order for an event tomorrow.', '/dashboard/messages/791', false, NOW() - INTERVAL '15 minutes');

    -- System notifications
    INSERT INTO public.notifications (site_id, user_id, type, category, priority, title, message, action_url, is_read, created_at) VALUES
    (test_site_id, test_user_id, 'system_update', 'system', 'low', 'System Update 🔧', 'New features have been added to your dashboard. Check them out!', '/dashboard', true, NOW() - INTERVAL '5 days'),
    (test_site_id, test_user_id, 'maintenance_scheduled', 'system', 'normal', 'Scheduled Maintenance', 'System maintenance is scheduled for Sunday 2AM-4AM EST.', NULL, true, NOW() - INTERVAL '7 days'),
    (test_site_id, test_user_id, 'feature_announcement', 'system', 'low', 'New Feature Available', 'Analytics dashboard has been upgraded with new insights.', '/dashboard', false, NOW() - INTERVAL '1 day');

    -- Marketing notifications
    INSERT INTO public.notifications (site_id, user_id, type, category, priority, title, message, action_url, is_read, created_at) VALUES
    (test_site_id, test_user_id, 'campaign_results', 'marketing', 'normal', 'Campaign Results 📊', 'Your email campaign "Spring Sale" reached 1,250 customers with 23% open rate.', '/dashboard/marketing', false, NOW() - INTERVAL '8 hours'),
    (test_site_id, test_user_id, 'seo_improvement', 'marketing', 'normal', 'SEO Ranking Improved', 'Your site moved up 5 positions for "flower delivery" keyword.', '/dashboard/settings', true, NOW() - INTERVAL '2 days'),
    (test_site_id, test_user_id, 'social_milestone', 'marketing', 'low', 'Social Media Milestone 🎉', 'Your Instagram account reached 1,000 followers!', NULL, false, NOW() - INTERVAL '12 hours');

    -- Security notifications
    INSERT INTO public.notifications (site_id, user_id, type, category, priority, title, message, action_url, is_read, created_at) VALUES
    (test_site_id, test_user_id, 'login_new_device', 'security', 'high', 'New Device Login 🔐', 'Your account was accessed from a new device in New York, NY.', '/dashboard/settings', false, NOW() - INTERVAL '1 hour'),
    (test_site_id, test_user_id, 'password_changed', 'security', 'high', 'Password Changed', 'Your account password was successfully changed.', NULL, true, NOW() - INTERVAL '10 days'),
    (test_site_id, test_user_id, 'suspicious_activity', 'security', 'urgent', 'Suspicious Activity Detected ⚠️', 'Multiple failed login attempts detected. Please verify your account security.', '/dashboard/settings', false, NOW() - INTERVAL '20 minutes');

    -- Content notifications
    INSERT INTO public.notifications (site_id, user_id, type, category, priority, title, message, action_url, is_read, created_at) VALUES
    (test_site_id, test_user_id, 'content_published', 'content', 'normal', 'Content Published 📝', 'Your blog post "Spring Flower Care Tips" is now live.', '/dashboard/content/321', true, NOW() - INTERVAL '4 days'),
    (test_site_id, test_user_id, 'content_scheduled', 'content', 'low', 'Content Scheduled', 'Blog post "Mother''s Day Specials" scheduled for May 1st.', '/dashboard/content/322', false, NOW() - INTERVAL '3 days'),
    (test_site_id, test_user_id, 'comment_moderation', 'content', 'normal', 'Comment Awaiting Moderation', 'A new comment on "Wedding Bouquet Ideas" needs your approval.', '/dashboard/content/323', false, NOW() - INTERVAL '5 hours');

    -- Add some archived notifications for testing archive functionality
    INSERT INTO public.notifications (site_id, user_id, type, category, priority, title, message, is_read, is_archived, created_at) VALUES
    (test_site_id, test_user_id, 'old_order', 'orders', 'normal', 'Old Order Completed', 'Order from last month was completed successfully.', true, true, NOW() - INTERVAL '30 days'),
    (test_site_id, test_user_id, 'old_message', 'messages', 'normal', 'Archived Message', 'This is an old archived message.', true, true, NOW() - INTERVAL '25 days');

    RAISE NOTICE 'Successfully created test notifications for user %', test_user_id;
END $$;

-- Verify the notifications were created
SELECT 
    category,
    priority,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_read = false) as unread_count
FROM public.notifications
WHERE site_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND is_archived = false
GROUP BY category, priority
ORDER BY category, priority;

-- Show sample of created notifications
SELECT 
    title,
    category,
    priority,
    is_read,
    created_at
FROM public.notifications
WHERE site_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY created_at DESC
LIMIT 10;
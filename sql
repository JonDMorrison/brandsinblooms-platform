SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '7eca5b7f-1d3b-4ae2-8e5c-f08d8e9c5baa', '{"action":"login","actor_id":"22222222-2222-2222-2222-222222222222","actor_name":"Site Owner","actor_username":"owner@test.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-19 04:38:06.897178+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ec104c91-29eb-491b-b543-808495fb04e2', '{"action":"token_refreshed","actor_id":"22222222-2222-2222-2222-222222222222","actor_name":"Site Owner","actor_username":"owner@test.com","actor_via_sso":false,"log_type":"token"}', '2025-08-19 05:37:49.691916+00', ''),
	('00000000-0000-0000-0000-000000000000', '71d719c8-fada-4c71-a4cc-2e0f8091afad', '{"action":"token_revoked","actor_id":"22222222-2222-2222-2222-222222222222","actor_name":"Site Owner","actor_username":"owner@test.com","actor_via_sso":false,"log_type":"token"}', '2025-08-19 05:37:49.692963+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b61a05bb-e236-4a25-b684-5b201d5ea0e8', '{"action":"token_refreshed","actor_id":"22222222-2222-2222-2222-222222222222","actor_name":"Site Owner","actor_username":"owner@test.com","actor_via_sso":false,"log_type":"token"}', '2025-08-19 18:54:13.204804+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b3e8f810-9b0a-4415-b536-bd89504199d6', '{"action":"token_revoked","actor_id":"22222222-2222-2222-2222-222222222222","actor_name":"Site Owner","actor_username":"owner@test.com","actor_via_sso":false,"log_type":"token"}', '2025-08-19 18:54:13.205651+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f98d6c97-6629-4c39-abd9-562a3faa8c12', '{"action":"token_refreshed","actor_id":"22222222-2222-2222-2222-222222222222","actor_name":"Site Owner","actor_username":"owner@test.com","actor_via_sso":false,"log_type":"token"}', '2025-08-19 19:58:56.121597+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f891f2ec-3bae-4cd9-83b4-9dd3cb87c83c', '{"action":"token_revoked","actor_id":"22222222-2222-2222-2222-222222222222","actor_name":"Site Owner","actor_username":"owner@test.com","actor_via_sso":false,"log_type":"token"}', '2025-08-19 19:58:56.122152+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin@test.com', '$2a$06$gZsiLkrXKajXaVqGSXRrN.HaKBlVXDt.609MRMplI1ZHOwSZSDYeW', '2025-08-19 04:36:53.369381+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Admin User"}', NULL, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'editor@test.com', '$2a$06$130uZX3SE8eDZgTx2o5xZeYsg.4Kubw.aHLKyW8hiPQTtBDNVgORa', '2025-08-19 04:36:53.369381+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Editor User"}', NULL, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'viewer@test.com', '$2a$06$aRO7gs71acDnM8J8PbYdFOkpPKjXEK.Ihkno6mlb7i3feBUp5LwDa', '2025-08-19 04:36:53.369381+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Viewer User"}', NULL, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'owner@test.com', '$2a$06$hYDw1JQDy/jVXsJbY2pjS.xba3WS0T5.QxftcCxg80Ara4Wj9YN7u', '2025-08-19 04:36:53.369381+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-08-19 04:38:06.89864+00', '{"provider": "email", "providers": ["email"]}', '{"full_name": "Site Owner"}', NULL, '2025-08-19 04:36:53.369381+00', '2025-08-19 19:58:56.123378+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('2a9f0793-0ceb-4fb5-a9dc-79fd1932d88c', '22222222-2222-2222-2222-222222222222', '2025-08-19 04:38:06.898737+00', '2025-08-19 19:58:56.124171+00', NULL, 'aal1', NULL, '2025-08-19 19:58:56.124143', 'Next.js Middleware', '172.25.0.1', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('2a9f0793-0ceb-4fb5-a9dc-79fd1932d88c', '2025-08-19 04:38:06.902278+00', '2025-08-19 04:38:06.902278+00', 'password', '396cb3d8-4a4b-4925-bf8e-9c3643e359bd');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, '7c5l5duzlwzi', '22222222-2222-2222-2222-222222222222', true, '2025-08-19 04:38:06.899876+00', '2025-08-19 05:37:49.693721+00', NULL, '2a9f0793-0ceb-4fb5-a9dc-79fd1932d88c'),
	('00000000-0000-0000-0000-000000000000', 2, '22x6celeqaq5', '22222222-2222-2222-2222-222222222222', true, '2025-08-19 05:37:49.694895+00', '2025-08-19 18:54:13.206161+00', '7c5l5duzlwzi', '2a9f0793-0ceb-4fb5-a9dc-79fd1932d88c'),
	('00000000-0000-0000-0000-000000000000', 3, '6d4ugl6vtpij', '22222222-2222-2222-2222-222222222222', true, '2025-08-19 18:54:13.206631+00', '2025-08-19 19:58:56.122366+00', '22x6celeqaq5', '2a9f0793-0ceb-4fb5-a9dc-79fd1932d88c'),
	('00000000-0000-0000-0000-000000000000', 4, 'ixv6uy2zjugj', '22222222-2222-2222-2222-222222222222', false, '2025-08-19 19:58:56.12277+00', '2025-08-19 19:58:56.12277+00', '6d4ugl6vtpij', '2a9f0793-0ceb-4fb5-a9dc-79fd1932d88c');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sites" ("id", "subdomain", "custom_domain", "name", "description", "logo_url", "primary_color", "business_name", "business_email", "business_phone", "business_address", "business_hours", "latitude", "longitude", "timezone", "is_active", "is_published", "created_at", "updated_at", "theme_settings", "admin_notes", "last_activity_at", "created_by") VALUES
	('00000000-0000-0000-0000-000000000001', 'dev', NULL, 'Development Site', 'Main development site for testing', NULL, '#3B82F6', 'Dev Corp', 'dev@test.com', '555-0100', NULL, NULL, NULL, NULL, 'America/New_York', true, true, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', '{"logo": {"url": null, "size": "medium", "position": "left"}, "colors": {"accent": "#F59E0B", "primary": "#8B5CF6", "secondary": "#06B6D4", "background": "#FFFFFF"}, "layout": {"menuStyle": "horizontal", "footerStyle": "minimal", "headerStyle": "modern"}, "typography": {"bodyFont": "Inter", "fontSize": "medium", "headingFont": "Inter"}}', NULL, '2025-08-19 05:21:27.669064+00', NULL),
	('14a3a999-b698-437f-90a8-f89842f10d08', 'greenthumb', NULL, 'Green Thumb Gardens', 'Your local gardening experts', NULL, '#10B981', 'Green Thumb LLC', 'info@greenthumb.com', '555-0200', NULL, NULL, NULL, NULL, 'America/New_York', true, true, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', '{"logo": {"url": null, "size": "medium", "position": "left"}, "colors": {"accent": "#F59E0B", "primary": "#8B5CF6", "secondary": "#06B6D4", "background": "#FFFFFF"}, "layout": {"menuStyle": "horizontal", "footerStyle": "minimal", "headerStyle": "modern"}, "typography": {"bodyFont": "Inter", "fontSize": "medium", "headingFont": "Inter"}}', NULL, '2025-08-19 04:36:53.369381+00', NULL),
	('55555555-5555-5555-5555-555555555555', 'techshop', NULL, 'Tech Shop Pro', 'Electronics and gadgets store', NULL, '#8B5CF6', 'Tech Shop Inc', 'sales@techshop.com', '555-0300', NULL, NULL, NULL, NULL, 'America/New_York', true, true, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', '{"logo": {"url": null, "size": "medium", "position": "left"}, "colors": {"accent": "#F59E0B", "primary": "#8B5CF6", "secondary": "#06B6D4", "background": "#FFFFFF"}, "layout": {"menuStyle": "horizontal", "footerStyle": "minimal", "headerStyle": "modern"}, "typography": {"bodyFont": "Inter", "fontSize": "medium", "headingFont": "Inter"}}', NULL, '2025-08-19 04:36:53.369381+00', NULL);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."activity_logs" ("id", "site_id", "user_id", "activity_type", "entity_type", "entity_id", "title", "description", "metadata", "created_at") VALUES
	('087dbb7e-25e5-45e8-92c0-60c7fdc18f60', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'create', 'content', '406e2a3a-6d74-48d0-a464-d234d3c52116', 'Created new blog post', 'User created "Spring Tips" blog post', '{"action": "create_content"}', '2025-08-19 04:36:53.369381+00'),
	('de04efe1-b59f-4bc4-b0de-d31309c38041', '00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'update', 'product', 'a67ab78a-5ab4-46f9-abd1-1c8746e547f8', 'Updated product price', 'Changed price from $29.99 to $24.99', '{"action": "update_product"}', '2025-08-19 04:36:53.369381+00'),
	('e0452182-c51f-4bf9-a1f3-311039fc5885', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'create', 'order', '5913e6d7-b25e-4d25-9808-9bd3ba0df7b8', 'New order received', 'Order #001 from John Doe', '{"action": "process_order"}', '2025-08-19 04:36:53.369381+00'),
	('ee8c3027-ebc2-4162-9ed5-2adc38907165', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'update', 'site', '00000000-0000-0000-0000-000000000001', 'Site settings updated', 'Business hours changed', '{"action": "update_settings"}', '2025-08-19 04:36:53.369381+00');


--
-- Data for Name: admin_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: admin_impersonation_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: content; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."content" ("id", "site_id", "author_id", "content_type", "title", "slug", "content", "meta_data", "is_published", "is_featured", "sort_order", "created_at", "updated_at", "published_at") VALUES
	('7411be16-d316-488b-9197-37fc7e992a47', '00000000-0000-0000-0000-000000000001', NULL, 'page', 'Welcome to Dev Site', 'welcome', '{"blocks": [{"type": "paragraph", "content": "This is the development site content."}]}', '{}', true, false, 0, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', NULL),
	('a73e9e86-7ea1-4a4f-865c-e6f2b167a444', '00000000-0000-0000-0000-000000000001', NULL, 'page', 'About Us', 'about', '{"blocks": [{"type": "paragraph", "content": "Learn more about our development team."}]}', '{}', true, false, 0, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', NULL),
	('c662c476-06e8-4a09-8ead-a21c749288ae', '14a3a999-b698-437f-90a8-f89842f10d08', NULL, 'blog_post', 'Spring Gardening Tips', 'spring-tips', '{"blocks": [{"type": "paragraph", "content": "Get your garden ready for spring!"}]}', '{}', true, false, 0, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', NULL),
	('0e00f08e-f345-429f-b18b-7eec94d97d8b', '55555555-5555-5555-5555-555555555555', NULL, 'blog_post', 'Latest Tech Deals', 'deals', '{"blocks": [{"type": "paragraph", "content": "Check out our amazing deals!"}]}', '{}', true, false, 0, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', NULL);


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."products" ("id", "site_id", "sku", "name", "description", "care_instructions", "category", "subcategory", "price", "sale_price", "unit_of_measure", "is_active", "is_featured", "in_stock", "stock_status", "slug", "meta_description", "attributes", "images", "import_source", "import_batch_id", "created_at", "updated_at", "inventory_count", "low_stock_threshold", "rating", "review_count", "compare_at_price", "favorite_count") VALUES
	('a65cb1a9-ec18-4764-a889-a3744b6877b3', '00000000-0000-0000-0000-000000000001', 'TEST-001', 'Test Product 1', 'A test product', NULL, 'Electronics', NULL, 29.99, NULL, NULL, true, false, true, 'in_stock', 'test-product-1', NULL, '{}', '[]', NULL, NULL, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', 0, 10, 0.0, 0, NULL, 0),
	('3e326542-8594-4678-bb6d-c019dbbfcdce', '00000000-0000-0000-0000-000000000001', 'TEST-002', 'Test Product 2', 'Another test product', NULL, 'Books', NULL, 49.99, NULL, NULL, true, false, true, 'in_stock', 'test-product-2', NULL, '{}', '[]', NULL, NULL, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', 0, 10, 0.0, 0, NULL, 0),
	('3cfc8752-63c2-4145-8071-99282e167a97', '14a3a999-b698-437f-90a8-f89842f10d08', 'GARDEN-001', 'Garden Hose', '50ft expandable garden hose', NULL, 'Garden Tools', NULL, 34.99, NULL, NULL, true, false, true, 'in_stock', 'garden-hose', NULL, '{}', '[]', NULL, NULL, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', 0, 10, 0.0, 0, NULL, 0),
	('3dd9c1e9-755f-4cf2-aced-35a5afd4e216', '14a3a999-b698-437f-90a8-f89842f10d08', 'FERT-001', 'Plant Food', 'Organic plant fertilizer', NULL, 'Fertilizers', NULL, 12.99, NULL, NULL, true, false, true, 'in_stock', 'plant-food', NULL, '{}', '[]', NULL, NULL, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', 0, 10, 0.0, 0, NULL, 0),
	('7d6f1eac-e10b-429d-8447-6546f0946a35', '55555555-5555-5555-5555-555555555555', 'TECH-001', 'Laptop', 'High-performance laptop', NULL, 'Computers', NULL, 999.99, NULL, NULL, true, false, true, 'in_stock', 'laptop', NULL, '{}', '[]', NULL, NULL, '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00', 0, 10, 0.0, 0, NULL, 0),
	('1cf5c19f-1652-4dbd-a352-829c891cf179', '00000000-0000-0000-0000-000000000001', '111-111-111-111', 'test', 'test', NULL, 'Books', NULL, 100.00, 50.00, '1', true, false, true, 'in_stock', 'test', NULL, '{}', '[]', NULL, NULL, '2025-08-19 04:42:50.793141+00', '2025-08-19 04:42:50.793141+00', 10, 2, 0.0, 0, 10.00, 0),
	('9f0f933f-87f5-47b7-96b2-55413d967939', '00000000-0000-0000-0000-000000000001', '123-111-111-1111', 'Test 02', '', NULL, 'Other', NULL, 10.00, 10.00, NULL, true, false, true, 'in_stock', 'test-02', NULL, '{}', '[]', NULL, NULL, '2025-08-19 04:58:13.497938+00', '2025-08-19 04:58:13.497938+00', 5, 10, 0.0, 0, 10.00, 0),
	('e8781a1a-3a9c-486b-b4f4-2dc8765216b0', '00000000-0000-0000-0000-000000000001', '123-333-444-555', 'Test03', 'test', NULL, 'Other', NULL, 10.00, NULL, NULL, true, false, true, 'in_stock', 't', NULL, '{}', '[]', NULL, NULL, '2025-08-19 05:17:16.078514+00', '2025-08-19 05:17:16.078514+00', 10, 10, 0.0, 0, NULL, 0),
	('5bac394f-f606-4dde-8104-cfed6a221cca', '00000000-0000-0000-0000-000000000001', '123-333-321-233', 'Test', '', NULL, 'Other', NULL, 10.00, 10.00, NULL, true, false, true, 'in_stock', 'test-1', NULL, '{}', '[]', NULL, NULL, '2025-08-19 05:21:27.669064+00', '2025-08-19 05:21:27.669064+00', 10, 10, 0.0, 0, NULL, 0);


--
-- Data for Name: contact_inquiries; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: import_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: media_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: migration_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: migration_locks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "user_id", "username", "full_name", "avatar_url", "bio", "email", "phone", "role", "created_at", "updated_at") VALUES
	('ce8e8ed5-d6c7-4412-ad0a-af4a74f5b847', '11111111-1111-1111-1111-111111111111', 'admin', 'Admin User', NULL, 'Platform administrator', 'admin@test.com', NULL, 'admin', '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00'),
	('31579847-bca9-4bec-91c9-ec1a9cb41cf7', '22222222-2222-2222-2222-222222222222', 'siteowner', 'Site Owner', NULL, 'Owns multiple sites', 'owner@test.com', NULL, 'site_owner', '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00'),
	('68f4c655-9af8-473e-9006-0ce38d19a2e5', '33333333-3333-3333-3333-333333333333', 'editor', 'Editor User', NULL, 'Content editor', 'editor@test.com', NULL, 'user', '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00'),
	('8bef7ad7-6f77-496f-81e2-975a8f860f1f', '44444444-4444-4444-4444-444444444444', 'viewer', 'Viewer User', NULL, 'Read-only access', 'viewer@test.com', NULL, 'user', '2025-08-19 04:36:53.369381+00', '2025-08-19 04:36:53.369381+00');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: order_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: order_shipments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: site_health_checks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: site_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."site_memberships" ("id", "user_id", "site_id", "role", "is_active", "created_at") VALUES
	('958f8681-6645-462e-9e1f-081b3a312c90', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'owner', true, '2025-08-19 04:36:53.369381+00'),
	('3b2ef867-5dcf-4471-86b0-2b9ae126c5d5', '11111111-1111-1111-1111-111111111111', '14a3a999-b698-437f-90a8-f89842f10d08', 'owner', true, '2025-08-19 04:36:53.369381+00'),
	('081fcc6d-39b8-4c8d-b35b-f9ff8f631fbd', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'owner', true, '2025-08-19 04:36:53.369381+00'),
	('17786485-f2ad-4d2e-b162-ad6c5e72fa18', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'owner', true, '2025-08-19 04:36:53.369381+00'),
	('cef6ad4a-ddb5-475a-a111-6c78fc03feb3', '22222222-2222-2222-2222-222222222222', '14a3a999-b698-437f-90a8-f89842f10d08', 'owner', true, '2025-08-19 04:36:53.369381+00'),
	('1de483e7-1d09-4542-bd28-1435f6498d51', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'editor', true, '2025-08-19 04:36:53.369381+00'),
	('ee2fd7c1-c739-4a85-9652-61992fb50443', '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'viewer', true, '2025-08-19 04:36:53.369381+00');


--
-- Data for Name: site_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."site_metrics" ("id", "site_id", "metric_date", "created_at", "unique_visitors", "page_views", "content_count", "product_count", "inquiry_count", "updated_at") VALUES
	('eb157684-c03e-46ee-a231-56b6cdf33e30', '00000000-0000-0000-0000-000000000001', '2025-08-19', '2025-08-19 04:36:53.369381+00', 45, 150, 2, 2, 5, '2025-08-19 04:36:53.369381+00'),
	('6aaad23a-9f40-4095-801c-a2f4ed39f624', '00000000-0000-0000-0000-000000000001', '2025-08-18', '2025-08-19 04:36:53.369381+00', 38, 120, 2, 2, 3, '2025-08-19 04:36:53.369381+00'),
	('be1cab27-72b6-41ac-8f2d-967a448ea7d1', '00000000-0000-0000-0000-000000000001', '2025-08-17', '2025-08-19 04:36:53.369381+00', 55, 180, 2, 2, 8, '2025-08-19 04:36:53.369381+00'),
	('170725d2-a315-440c-832e-65dbfb98fb19', '00000000-0000-0000-0000-000000000001', '2025-08-16', '2025-08-19 04:36:53.369381+00', 62, 200, 2, 2, 10, '2025-08-19 04:36:53.369381+00'),
	('00f6247a-958f-4b72-bb07-b6bf46c328ae', '00000000-0000-0000-0000-000000000001', '2025-08-15', '2025-08-19 04:36:53.369381+00', 30, 95, 2, 2, 2, '2025-08-19 04:36:53.369381+00'),
	('7fdc779e-c2ea-4461-a166-9b6d57108b30', '00000000-0000-0000-0000-000000000001', '2025-08-14', '2025-08-19 04:36:53.369381+00', 35, 110, 2, 2, 4, '2025-08-19 04:36:53.369381+00'),
	('d88d6e57-d036-4c9d-b706-a1b38cec55d9', '00000000-0000-0000-0000-000000000001', '2025-08-13', '2025-08-19 04:36:53.369381+00', 42, 140, 2, 2, 6, '2025-08-19 04:36:53.369381+00'),
	('8eaa5ed7-79e1-476f-a80b-5c98397f508b', '00000000-0000-0000-0000-000000000001', '2025-08-12', '2025-08-19 04:36:53.369381+00', 48, 160, 2, 2, 7, '2025-08-19 04:36:53.369381+00'),
	('22ed5421-737c-4515-8474-86206b6f9cd1', '00000000-0000-0000-0000-000000000001', '2025-08-05', '2025-08-19 04:36:53.369381+00', 40, 130, 2, 2, 5, '2025-08-19 04:36:53.369381+00'),
	('c7bb3df7-414a-42f4-b4e7-a6540c7841ce', '00000000-0000-0000-0000-000000000001', '2025-07-20', '2025-08-19 04:36:53.369381+00', 32, 100, 2, 2, 3, '2025-08-19 04:36:53.369381+00'),
	('14c075e0-bee8-4bc7-b14b-301045b8bbbc', '14a3a999-b698-437f-90a8-f89842f10d08', '2025-08-19', '2025-08-19 04:36:53.369381+00', 65, 200, 1, 2, 12, '2025-08-19 04:36:53.369381+00'),
	('4ae0beaa-40f1-4f8b-855b-40a338b82108', '55555555-5555-5555-5555-555555555555', '2025-08-19', '2025-08-19 04:36:53.369381+00', 110, 350, 1, 1, 20, '2025-08-19 04:36:53.369381+00');


--
-- Data for Name: site_performance_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."site_performance_metrics" ("id", "site_id", "recorded_at", "unique_visitors", "page_views", "sessions", "bounce_rate", "avg_session_duration_seconds", "avg_page_load_time_ms", "avg_server_response_time_ms", "total_requests", "error_rate", "avg_first_contentful_paint_ms", "avg_largest_contentful_paint_ms", "avg_cumulative_layout_shift", "avg_first_input_delay_ms", "bandwidth_used_bytes", "storage_used_bytes", "cdn_cache_hit_rate", "total_content_items", "total_products", "active_content_items", "form_submissions", "contact_inquiries", "product_views", "top_countries", "top_referrers", "top_pages", "device_breakdown", "browser_breakdown", "search_impressions", "search_clicks", "avg_search_position", "period_type", "period_start", "period_end", "raw_data", "created_at") VALUES
	('30dfcb1b-93d5-49f4-8792-1d786daa1086', '00000000-0000-0000-0000-000000000001', '2025-08-19 04:36:53.369381+00', 45, 150, 50, 35.50, 185, 1200, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 0, 0, 0, 0, 0, '[]', '[]', '[]', '{}', '{}', 0, 0, NULL, 'daily', NULL, NULL, '{}', '2025-08-19 04:36:53.369381+00'),
	('4b4dc285-6c3c-4eb1-b563-6c393940ca21', '00000000-0000-0000-0000-000000000001', '2025-08-19 03:36:53.369381+00', 42, 140, 48, 36.20, 180, 1300, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 0, 0, 0, 0, 0, '[]', '[]', '[]', '{}', '{}', 0, 0, NULL, 'daily', NULL, NULL, '{}', '2025-08-19 04:36:53.369381+00'),
	('9cc0a044-82ff-44b8-a8c6-92ac6759796a', '00000000-0000-0000-0000-000000000001', '2025-08-19 02:36:53.369381+00', 50, 165, 55, 32.80, 195, 1100, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 0, 0, 0, 0, 0, '[]', '[]', '[]', '{}', '{}', 0, 0, NULL, 'daily', NULL, NULL, '{}', '2025-08-19 04:36:53.369381+00'),
	('fc7044eb-3323-4877-ab9d-3f36c393c7c1', '14a3a999-b698-437f-90a8-f89842f10d08', '2025-08-19 04:36:53.369381+00', 65, 200, 70, 28.50, 220, 1000, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 0, 0, 0, 0, 0, '[]', '[]', '[]', '{}', '{}', 0, 0, NULL, 'daily', NULL, NULL, '{}', '2025-08-19 04:36:53.369381+00'),
	('0fa58d85-b15c-4527-adbf-533a68d174e9', '55555555-5555-5555-5555-555555555555', '2025-08-19 04:36:53.369381+00', 110, 350, 120, 25.00, 250, 1500, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, 0, 0, 0, 0, 0, 0, '[]', '[]', '[]', '{}', '{}', 0, 0, NULL, 'daily', NULL, NULL, '{}', '2025-08-19 04:36:53.369381+00');


--
-- Data for Name: site_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."site_templates" ("id", "name", "slug", "description", "category", "preview_image_url", "template_config", "default_content", "default_products", "default_business_hours", "is_active", "created_at", "updated_at", "created_by") VALUES
	('e9b64d87-1ed8-46ab-b176-5224d1c9a5bc', 'Garden Center Basic', 'garden-center-basic', 'A clean, professional template perfect for garden centers and landscaping businesses. Features product showcases, service pages, and contact forms.', 'garden_center', '/templates/garden-center-basic-preview.jpg', '{
        "primary_color": "#22c55e",
        "secondary_color": "#16a34a",
        "font_family": "Inter",
        "layout_style": "modern",
        "header_style": "centered",
        "navigation_style": "horizontal"
    }', '[
        {
            "title": "Welcome to Your Garden Center",
            "slug": "home",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "hero",
                        "content": {
                            "title": "Beautiful Gardens Start Here",
                            "subtitle": "Discover premium plants, expert advice, and everything you need to create your perfect outdoor space.",
                            "button_text": "Shop Now",
                            "button_link": "/products"
                        }
                    },
                    {
                        "type": "features",
                        "content": {
                            "title": "Why Choose Us",
                            "features": [
                                {
                                    "title": "Expert Advice",
                                    "description": "Our knowledgeable staff helps you choose the right plants for your space."
                                },
                                {
                                    "title": "Quality Plants",
                                    "description": "We source only the healthiest plants from trusted local growers."
                                },
                                {
                                    "title": "Full Service",
                                    "description": "From selection to planting, we provide complete garden solutions."
                                }
                            ]
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 1
        },
        {
            "title": "About Us",
            "slug": "about",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "text",
                        "content": {
                            "title": "Our Story",
                            "text": "Founded with a passion for helping people create beautiful outdoor spaces, our garden center has been serving the community for over 20 years. We believe that everyone deserves a thriving garden, and we are here to make that dream a reality."
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 2
        },
        {
            "title": "Services",
            "slug": "services",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "services",
                        "content": {
                            "title": "Our Services",
                            "services": [
                                {
                                    "title": "Garden Design",
                                    "description": "Professional landscape design tailored to your space and style."
                                },
                                {
                                    "title": "Plant Installation",
                                    "description": "Expert planting services to ensure your garden thrives."
                                },
                                {
                                    "title": "Maintenance",
                                    "description": "Ongoing care to keep your garden looking its best year-round."
                                }
                            ]
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 3
        },
        {
            "title": "Contact Us",
            "slug": "contact",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "contact",
                        "content": {
                            "title": "Get In Touch",
                            "subtitle": "Ready to start your garden journey? Contact us today!"
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 4
        }
    ]', '[
        {
            "name": "Fiddle Leaf Fig",
            "slug": "fiddle-leaf-fig",
            "description": "A stunning indoor plant with large, glossy leaves that make a bold statement in any room.",
            "category": "indoor_plants",
            "price": 49.99,
            "is_active": true,
            "is_featured": true,
            "in_stock": true
        },
        {
            "name": "Snake Plant",
            "slug": "snake-plant",
            "description": "Low-maintenance succulent perfect for beginners. Tolerates low light and infrequent watering.",
            "category": "indoor_plants",
            "price": 24.99,
            "is_active": true,
            "is_featured": false,
            "in_stock": true
        },
        {
            "name": "Lavender Plant",
            "slug": "lavender-plant",
            "description": "Fragrant perennial herb perfect for gardens and containers. Attracts pollinators and deters pests.",
            "category": "herbs",
            "price": 12.99,
            "is_active": true,
            "is_featured": true,
            "in_stock": true
        },
        {
            "name": "Rose Bush - Red",
            "slug": "rose-bush-red",
            "description": "Classic red roses that bloom throughout the growing season. Perfect for gardens and cutting.",
            "category": "flowers",
            "price": 32.99,
            "is_active": true,
            "is_featured": false,
            "in_stock": true
        }
    ]', '{
        "monday": {"open": "08:00", "close": "18:00", "closed": false},
        "tuesday": {"open": "08:00", "close": "18:00", "closed": false},
        "wednesday": {"open": "08:00", "close": "18:00", "closed": false},
        "thursday": {"open": "08:00", "close": "18:00", "closed": false},
        "friday": {"open": "08:00", "close": "18:00", "closed": false},
        "saturday": {"open": "08:00", "close": "17:00", "closed": false},
        "sunday": {"open": "09:00", "close": "16:00", "closed": false}
    }', true, '2025-08-19 04:36:53.113837+00', '2025-08-19 04:36:53.113837+00', NULL),
	('cf0d949d-6ec1-486f-bd7b-d85d0c8245c1', 'Plant Nursery Professional', 'plant-nursery-professional', 'A comprehensive template designed for plant nurseries and wholesale operations. Includes detailed product catalogs, growing guides, and bulk ordering features.', 'nursery', '/templates/plant-nursery-professional-preview.jpg', '{
        "primary_color": "#059669",
        "secondary_color": "#047857",
        "font_family": "Inter",
        "layout_style": "professional",
        "header_style": "left_aligned",
        "navigation_style": "horizontal"
    }', '[
        {
            "title": "Professional Plant Nursery",
            "slug": "home",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "hero",
                        "content": {
                            "title": "Premium Plants for Professionals",
                            "subtitle": "Supplying landscape professionals, garden centers, and serious gardeners with the highest quality plants since 1985.",
                            "button_text": "View Catalog",
                            "button_link": "/products"
                        }
                    },
                    {
                        "type": "stats",
                        "content": {
                            "stats": [
                                {"label": "Plant Varieties", "value": "2000+"},
                                {"label": "Years Experience", "value": "35+"},
                                {"label": "Satisfied Customers", "value": "500+"},
                                {"label": "Growing Acres", "value": "50+"}
                            ]
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 1
        },
        {
            "title": "Our Nursery",
            "slug": "about",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "text",
                        "content": {
                            "title": "Three Generations of Growing Excellence",
                            "text": "Our family-owned nursery has been cultivating premium plants for over three decades. We specialize in native species, drought-tolerant varieties, and hard-to-find specimens that landscape professionals and discerning gardeners demand."
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 2
        },
        {
            "title": "Growing Guides",
            "slug": "growing-guides",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "text",
                        "content": {
                            "title": "Expert Growing Information",
                            "text": "Access our comprehensive library of growing guides, planting calendars, and care instructions developed by our horticulture experts."
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 3
        },
        {
            "title": "Wholesale Inquiries",
            "slug": "wholesale",
            "content_type": "page",
            "content": {
                "blocks": [
                    {
                        "type": "contact",
                        "content": {
                            "title": "Wholesale & Trade Sales",
                            "subtitle": "Special pricing available for landscape professionals, garden centers, and volume purchasers."
                        }
                    }
                ]
            },
            "is_published": true,
            "sort_order": 4
        }
    ]', '[
        {
            "name": "California Native Oak - Coast Live Oak",
            "slug": "coast-live-oak",
            "description": "Majestic native oak tree, drought tolerant once established. Excellent for large landscapes and wildlife habitat.",
            "category": "native_trees",
            "price": 89.99,
            "is_active": true,
            "is_featured": true,
            "in_stock": true
        },
        {
            "name": "Purple Sage",
            "slug": "purple-sage",
            "description": "Drought-tolerant native shrub with silvery foliage and purple flower spikes. Perfect for xeriscaping.",
            "category": "native_shrubs",
            "price": 16.99,
            "is_active": true,
            "is_featured": true,
            "in_stock": true
        },
        {
            "name": "Japanese Maple - Bloodgood",
            "slug": "japanese-maple-bloodgood",
            "description": "Stunning ornamental tree with deep red foliage. Excellent specimen plant for gardens and containers.",
            "category": "ornamental_trees",
            "price": 124.99,
            "is_active": true,
            "is_featured": false,
            "in_stock": true
        },
        {
            "name": "Agave Century Plant",
            "slug": "agave-century-plant",
            "description": "Dramatic succulent with blue-green rosettes. Extremely drought tolerant and architectural.",
            "category": "succulents",
            "price": 34.99,
            "is_active": true,
            "is_featured": false,
            "in_stock": true
        },
        {
            "name": "California Poppy Seeds",
            "slug": "california-poppy-seeds",
            "description": "Native wildflower seeds perfect for naturalizing. Bright orange blooms attract butterflies.",
            "category": "seeds",
            "price": 4.99,
            "is_active": true,
            "is_featured": false,
            "in_stock": true
        }
    ]', '{
        "monday": {"open": "07:00", "close": "16:00", "closed": false},
        "tuesday": {"open": "07:00", "close": "16:00", "closed": false},
        "wednesday": {"open": "07:00", "close": "16:00", "closed": false},
        "thursday": {"open": "07:00", "close": "16:00", "closed": false},
        "friday": {"open": "07:00", "close": "16:00", "closed": false},
        "saturday": {"open": "08:00", "close": "15:00", "closed": false},
        "sunday": {"open": "closed", "close": "closed", "closed": true}
    }', true, '2025-08-19 04:36:53.113837+00', '2025-08-19 04:36:53.113837+00', NULL);


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: taggings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('product-images', 'product-images', NULL, '2025-08-19 04:36:53.343593+00', '2025-08-19 04:36:53.343593+00', true, false, 5242880, '{image/jpeg,image/png,image/webp,image/avif}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 4, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;

-- Create a test user properly through Supabase Auth
-- This should be run after the main seed.sql

-- First, let's clean up any existing user with this email
DELETE FROM auth.users WHERE email = 'test@example.com';

-- Create a new test user with a known password
-- Using raw SQL to insert into auth.users with proper password hashing
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('Test123!', gen_salt('bf')),
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test User"}',
    NOW(),
    NOW(),
    false,
    NULL
) ON CONFLICT (email) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

-- Get the user ID for updating the profile
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@example.com' LIMIT 1;
    
    -- Update the profile
    UPDATE public.profiles 
    SET 
        username = 'testuser',
        full_name = 'Test User',
        bio = 'Test account for development',
        role = 'user'
    WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Test user created/updated successfully!';
    RAISE NOTICE 'Email: test@example.com';
    RAISE NOTICE 'Password: Test123!';
END $$;
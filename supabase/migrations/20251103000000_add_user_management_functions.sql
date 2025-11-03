-- User Management Functions Migration
-- Implements admin user management functions for listing, searching, and updating users
-- Adds user deactivation support and comprehensive user querying capabilities

-- =====================================================
-- 1. ADD USER DEACTIVATION SUPPORT
-- =====================================================

-- Add is_active column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
    END IF;
END $$;

COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active - admins can deactivate accounts';

-- =====================================================
-- 2. USER LISTING AND SEARCH FUNCTIONS
-- =====================================================

-- Function to get all users with search and filtering
-- Returns paginated list of users for admin user management interface
CREATE OR REPLACE FUNCTION public.get_all_users(
    search_query TEXT DEFAULT NULL,
    role_filter TEXT DEFAULT NULL,
    status_filter BOOLEAN DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    username TEXT,
    avatar_url TEXT,
    role TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Only allow admins to call this function
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can access user list';
    END IF;

    RETURN QUERY
    SELECT
        p.user_id,
        p.email,
        p.full_name,
        p.username,
        p.avatar_url,
        p.role,
        p.is_active,
        p.created_at,
        p.updated_at,
        au.last_sign_in_at
    FROM public.profiles p
    LEFT JOIN auth.users au ON p.user_id = au.id
    WHERE
        -- Search filter: matches email, full_name, or username
        (search_query IS NULL OR (
            p.email ILIKE '%' || search_query || '%' OR
            p.full_name ILIKE '%' || search_query || '%' OR
            p.username ILIKE '%' || search_query || '%'
        ))
        -- Role filter: matches specific role
        AND (role_filter IS NULL OR p.role = role_filter)
        -- Status filter: matches active/inactive status
        AND (status_filter IS NULL OR p.is_active = status_filter)
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_all_users IS 'Admin function to list all users with search, filtering, and pagination';

-- =====================================================
-- 3. USER COUNT FUNCTION (FOR PAGINATION)
-- =====================================================

-- Function to count total users matching search/filter criteria
CREATE OR REPLACE FUNCTION public.admin_count_users(
    search_query TEXT DEFAULT NULL,
    role_filter TEXT DEFAULT NULL,
    status_filter BOOLEAN DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Only allow admins to call this function
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can access user count';
    END IF;

    SELECT COUNT(*)::INTEGER INTO user_count
    FROM public.profiles p
    WHERE
        -- Search filter
        (search_query IS NULL OR (
            p.email ILIKE '%' || search_query || '%' OR
            p.full_name ILIKE '%' || search_query || '%' OR
            p.username ILIKE '%' || search_query || '%'
        ))
        -- Role filter
        AND (role_filter IS NULL OR p.role = role_filter)
        -- Status filter
        AND (status_filter IS NULL OR p.is_active = status_filter);

    RETURN user_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.admin_count_users IS 'Admin function to count users matching search/filter criteria';

-- =====================================================
-- 4. USER PROFILE UPDATE FUNCTION
-- =====================================================

-- Function to update user profile (admin only)
-- Validates role changes and prevents last admin demotion
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
    target_user_id UUID,
    new_email TEXT DEFAULT NULL,
    new_full_name TEXT DEFAULT NULL,
    new_username TEXT DEFAULT NULL,
    new_phone TEXT DEFAULT NULL,
    new_role TEXT DEFAULT NULL,
    new_is_active BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    admin_count INTEGER;
    current_role TEXT;
BEGIN
    -- Only allow admins to call this function
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can update user profiles';
    END IF;

    -- Verify the target user exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = target_user_id) THEN
        RAISE EXCEPTION 'User with ID % does not exist', target_user_id;
    END IF;

    -- Get current role
    SELECT role INTO current_role FROM public.profiles WHERE user_id = target_user_id;

    -- If changing role from admin, ensure at least one other admin exists
    IF new_role IS NOT NULL AND new_role != 'admin' AND current_role = 'admin' THEN
        SELECT COUNT(*) INTO admin_count
        FROM public.profiles
        WHERE role = 'admin' AND user_id != target_user_id AND is_active = true;

        IF admin_count < 1 THEN
            RAISE EXCEPTION 'Cannot demote the last active admin. At least one admin must remain.';
        END IF;
    END IF;

    -- Validate role if provided
    IF new_role IS NOT NULL AND new_role NOT IN ('user', 'site_owner', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: %. Must be user, site_owner, or admin', new_role;
    END IF;

    -- Update the profile
    UPDATE public.profiles
    SET
        email = COALESCE(new_email, email),
        full_name = COALESCE(new_full_name, full_name),
        username = COALESCE(new_username, username),
        phone = COALESCE(new_phone, phone),
        role = COALESCE(new_role, role),
        is_active = COALESCE(new_is_active, is_active),
        updated_at = NOW()
    WHERE user_id = target_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.admin_update_user_profile IS 'Admin function to update user profile data with validation';

-- =====================================================
-- 5. USER DEACTIVATION TOGGLE FUNCTION
-- =====================================================

-- Function to toggle user active status
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(
    target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status BOOLEAN;
    current_role TEXT;
    admin_count INTEGER;
    new_status BOOLEAN;
BEGIN
    -- Only allow admins to call this function
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can toggle user status';
    END IF;

    -- Get current status and role
    SELECT is_active, role INTO current_status, current_role
    FROM public.profiles
    WHERE user_id = target_user_id;

    -- If deactivating an admin, ensure at least one other admin remains active
    IF current_status = true AND current_role = 'admin' THEN
        SELECT COUNT(*) INTO admin_count
        FROM public.profiles
        WHERE role = 'admin' AND user_id != target_user_id AND is_active = true;

        IF admin_count < 1 THEN
            RAISE EXCEPTION 'Cannot deactivate the last active admin. At least one admin must remain.';
        END IF;
    END IF;

    -- Toggle the status
    new_status := NOT current_status;

    UPDATE public.profiles
    SET
        is_active = new_status,
        updated_at = NOW()
    WHERE user_id = target_user_id;

    RETURN new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.admin_toggle_user_status IS 'Admin function to activate or deactivate a user account';

-- =====================================================
-- 6. GET SINGLE USER DETAILS (ADMIN)
-- =====================================================

-- Function to get detailed information about a specific user
CREATE OR REPLACE FUNCTION public.admin_get_user_details(
    target_user_id UUID
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    role TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    site_count BIGINT
) AS $$
BEGIN
    -- Only allow admins to call this function
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can access user details';
    END IF;

    RETURN QUERY
    SELECT
        p.user_id,
        p.email,
        p.full_name,
        p.username,
        p.avatar_url,
        p.bio,
        p.phone,
        p.role,
        p.is_active,
        p.created_at,
        p.updated_at,
        au.last_sign_in_at,
        au.email_confirmed_at,
        COUNT(DISTINCT sm.site_id) as site_count
    FROM public.profiles p
    LEFT JOIN auth.users au ON p.user_id = au.id
    LEFT JOIN public.site_memberships sm ON p.user_id = sm.user_id AND sm.is_active = true
    WHERE p.user_id = target_user_id
    GROUP BY p.user_id, p.email, p.full_name, p.username, p.avatar_url,
             p.bio, p.phone, p.role, p.is_active, p.created_at, p.updated_at,
             au.last_sign_in_at, au.email_confirmed_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.admin_get_user_details IS 'Admin function to get detailed information about a specific user';

-- =====================================================
-- 7. ENHANCED RLS POLICIES FOR USER DEACTIVATION
-- =====================================================

-- Update existing RLS policies to consider is_active status
-- Deactivated users should not be able to access the system

-- Drop and recreate user self-access policies with is_active check
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id AND is_active = true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id AND is_active = true)
WITH CHECK (auth.uid() = user_id AND is_active = true);

-- Admins can still view and update deactivated users
-- (Admin policies already exist and don't need modification)

-- =====================================================
-- 8. GRANT EXECUTE PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
-- (RLS and SECURITY DEFINER handle actual authorization)
GRANT EXECUTE ON FUNCTION public.get_all_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_count_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_details TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration successfully implements:
-- 1. User deactivation support with is_active column
-- 2. Comprehensive user listing with search and filters
-- 3. User count function for pagination
-- 4. Admin user profile update with validation
-- 5. User status toggle with admin protection
-- 6. Detailed user information retrieval
-- 7. Enhanced RLS policies for deactivated users
-- 8. Proper security with SECURITY DEFINER and admin checks

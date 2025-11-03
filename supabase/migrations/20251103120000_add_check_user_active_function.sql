-- Add function to check user active status without RLS restrictions
-- This allows deactivated users to check their own status during login validation

-- =====================================================
-- CREATE FUNCTION TO CHECK USER ACTIVE STATUS
-- =====================================================

-- Function to check if a user is active
-- Bypasses RLS so deactivated users can check their own status
CREATE OR REPLACE FUNCTION public.check_user_active_status(
    target_user_id UUID
)
RETURNS TABLE (
    user_id UUID,
    is_active BOOLEAN,
    role TEXT
)
SECURITY DEFINER -- Bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify the requesting user is checking their own status OR is an admin
    IF auth.uid() != target_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: You can only check your own active status';
    END IF;

    RETURN QUERY
    SELECT
        p.user_id,
        p.is_active,
        p.role
    FROM public.profiles p
    WHERE p.user_id = target_user_id;
END;
$$;

COMMENT ON FUNCTION public.check_user_active_status IS
    'Check if a user account is active. Bypasses RLS so deactivated users can check their own status during login validation.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_user_active_status TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration allows:
-- 1. Users to check their own is_active status even when deactivated
-- 2. Admins to check any user's status
-- 3. Proper session validation during login flow

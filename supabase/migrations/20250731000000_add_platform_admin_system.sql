-- Platform Admin System Migration
-- Implements admin role system with proper security functions and RLS policies
-- Consolidates role definitions and adds required admin functionality

-- =====================================================
-- 1. CONSOLIDATE ROLE DEFINITIONS
-- =====================================================

-- First, remove the conflicting user_type column if it exists
-- This consolidation ensures we have a single source of truth for roles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'user_type') THEN
        -- Migrate any existing user_type data to role if needed
        UPDATE public.profiles 
        SET role = CASE 
            WHEN user_type = 'site_owner' THEN 'site_owner'
            WHEN user_type = 'admin' THEN 'admin'
            ELSE 'user'
        END
        WHERE user_type IS NOT NULL AND role = 'user';
        
        -- Drop the user_type column and its constraint
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_user_type;
        ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_type;
    END IF;
END $$;

-- Update the role column constraint to match requirements
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'site_owner', 'admin'));

-- Ensure role column has proper default and is not null
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- Add index on role column for efficient admin queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =====================================================
-- 2. ADMIN SECURITY FUNCTIONS
-- =====================================================

-- Function to check if any admin exists in the system
-- SECURITY DEFINER allows this to bypass RLS for system checks
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create initial admin user
-- Only works when no admin exists, prevents unauthorized admin creation
CREATE OR REPLACE FUNCTION public.create_initial_admin(
    target_user_id UUID,
    admin_full_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    admin_count INTEGER;
BEGIN
    -- Check if any admin already exists
    SELECT COUNT(*) INTO admin_count 
    FROM public.profiles 
    WHERE role = 'admin';
    
    -- If admin exists, prevent creation
    IF admin_count > 0 THEN
        RAISE EXCEPTION 'Admin user already exists. Cannot create additional admin through this function.';
        RETURN FALSE;
    END IF;
    
    -- Verify the target user exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = target_user_id) THEN
        RAISE EXCEPTION 'User with ID % does not exist', target_user_id;
        RETURN FALSE;
    END IF;
    
    -- Create the admin user
    UPDATE public.profiles 
    SET 
        role = 'admin',
        full_name = COALESCE(admin_full_name, full_name),
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Log the admin creation (optional: could add to audit table in future)
    INSERT INTO public.profiles (user_id, role, full_name) 
    VALUES (target_user_id, 'admin', admin_full_name)
    ON CONFLICT (user_id) DO UPDATE SET 
        role = 'admin',
        full_name = COALESCE(admin_full_name, profiles.full_name),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is admin
-- Used by RLS policies for efficient admin checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 3. ENHANCED RLS POLICIES FOR ADMIN ACCESS
-- =====================================================

-- Drop existing admin policy to replace with more secure version
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Admins can view all profiles (more efficient with helper function)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin());

-- Admins can update any profile (with restrictions on role changes)
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
USING (public.is_admin())
WITH CHECK (
    public.is_admin() AND 
    -- Prevent admins from demoting themselves unless another admin exists
    (
        user_id != auth.uid() OR 
        role = 'admin' OR 
        (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin' AND user_id != auth.uid()) > 0
    )
);

-- Prevent unauthorized role elevation through regular user updates
-- This policy restricts users from changing their own role
CREATE POLICY "Restrict role changes to authorized users"
ON public.profiles FOR UPDATE
USING (
    auth.uid() = user_id AND 
    (
        -- Allow if not changing role
        role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()) OR
        -- Allow if admin is making the change
        public.is_admin()
    )
);

-- =====================================================
-- 4. ADMIN AUDIT AND MONITORING
-- =====================================================

-- Function to log admin actions (for future audit trail)
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if the action is performed by an admin
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
        -- This is a placeholder for future audit logging
        -- Could insert into an audit_log table when implemented
        NULL;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. ENHANCED SITE MEMBERSHIPS FOR ADMIN OVERSIGHT
-- =====================================================

-- Update site_memberships foreign key to reference profiles.user_id correctly
-- This ensures proper relationship with the profiles table
DO $$
BEGIN
    -- Check if the constraint exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'site_memberships' AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        -- Drop existing foreign key if it doesn't reference profiles correctly
        ALTER TABLE public.site_memberships 
        DROP CONSTRAINT IF EXISTS site_memberships_user_id_fkey;
    END IF;
    
    -- Add proper foreign key constraint
    ALTER TABLE public.site_memberships 
    ADD CONSTRAINT site_memberships_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists with correct reference
        NULL;
END $$;

-- Enhanced RLS policies for site memberships with admin oversight
DROP POLICY IF EXISTS "authenticated_site_memberships" ON public.site_memberships;

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
ON public.site_memberships FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all memberships
CREATE POLICY "Admins can view all memberships"
ON public.site_memberships FOR SELECT
USING (public.is_admin());

-- Site owners can manage memberships for their sites
CREATE POLICY "Site owners can manage site memberships"
ON public.site_memberships FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.site_memberships sm
        WHERE sm.site_id = site_memberships.site_id 
        AND sm.user_id = auth.uid() 
        AND sm.role = 'owner'
        AND sm.is_active = true
    ) OR public.is_admin()
);

-- =====================================================
-- 6. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.admin_exists() IS 'Checks if any admin user exists in the system - used for initial setup';
COMMENT ON FUNCTION public.create_initial_admin(UUID, TEXT) IS 'Creates the first admin user - only works when no admin exists';
COMMENT ON FUNCTION public.is_admin() IS 'Helper function to check if current user is admin - used by RLS policies';
COMMENT ON FUNCTION public.log_admin_action() IS 'Placeholder for future audit logging of admin actions';

-- Update table comments
COMMENT ON COLUMN public.profiles.role IS 'User role: user (default), site_owner (can manage sites), admin (platform admin)';

-- =====================================================
-- 7. DATA CONSISTENCY CHECKS
-- =====================================================

-- Ensure at least one admin exists after migration
-- This is a safety check to prevent lockout scenarios
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count 
    FROM public.profiles 
    WHERE role = 'admin';
    
    IF admin_count = 0 THEN
        RAISE NOTICE 'WARNING: No admin users found after migration. Use create_initial_admin() function to create the first admin.';
    ELSE
        RAISE NOTICE 'SUCCESS: % admin user(s) found in the system.', admin_count;
    END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration successfully implements:
-- 1. Consolidated role system with proper constraints
-- 2. Secure admin functions with SECURITY DEFINER
-- 3. Enhanced RLS policies for admin access control
-- 4. Prevention of unauthorized role elevation
-- 5. Foundation for audit logging
-- 6. Proper foreign key relationships

-- Next steps for implementation:
-- 1. Create initial admin using: SELECT public.create_initial_admin('<user_id>');
-- 2. Test admin access in application
-- 3. Implement audit logging table if needed
-- 4. Add more granular permissions as requirements evolve
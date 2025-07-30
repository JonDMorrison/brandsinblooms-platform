-- Fix user_type constraint to include 'site_owner'
-- Drop the old constraint and add the updated one

-- First drop the existing constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_user_type;

-- Add the correct constraint with all user types
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
    CHECK (user_type IN ('admin', 'site_owner', 'customer', 'staff'));
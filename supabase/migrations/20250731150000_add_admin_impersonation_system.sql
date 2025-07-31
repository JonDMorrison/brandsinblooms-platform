-- Admin Impersonation System Migration
-- Implements Milestone 4: Site Impersonation & Direct Access
-- Adds secure impersonation session management with time-limited sessions and audit logging

-- =====================================================
-- 1. ADMIN IMPERSONATION SESSIONS TABLE
-- =====================================================

-- Create admin impersonation sessions table
CREATE TABLE public.admin_impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Admin who initiated the impersonation
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Site being impersonated
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    
    -- Site owner being impersonated (optional - could be system-level impersonation)
    impersonated_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Secure session token for validation
    session_token TEXT NOT NULL UNIQUE,
    session_token_hash TEXT NOT NULL, -- hashed version for secure storage
    
    -- Session timing
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Session metadata
    purpose TEXT, -- reason for impersonation
    ip_address INET,
    user_agent TEXT,
    
    -- Session status
    is_active BOOLEAN DEFAULT true NOT NULL,
    ended_by_admin_id UUID REFERENCES auth.users(id),
    end_reason VARCHAR(50), -- 'manual', 'expired', 'revoked', 'system'
    
    -- Additional security
    allowed_actions TEXT[], -- specific actions allowed during impersonation
    restrictions JSONB DEFAULT '{}'::jsonb -- additional restrictions
);

-- Create indexes for performance
CREATE INDEX idx_admin_impersonation_sessions_admin ON public.admin_impersonation_sessions(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_impersonation_sessions_site ON public.admin_impersonation_sessions(site_id, is_active);
CREATE INDEX idx_admin_impersonation_sessions_token_hash ON public.admin_impersonation_sessions(session_token_hash);
CREATE INDEX idx_admin_impersonation_sessions_active ON public.admin_impersonation_sessions(is_active, expires_at);
CREATE INDEX idx_admin_impersonation_sessions_expiry ON public.admin_impersonation_sessions(expires_at) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can view impersonation sessions
CREATE POLICY "Admins can view impersonation sessions"
ON public.admin_impersonation_sessions FOR SELECT
USING (public.is_admin());

-- Only the system can insert/update impersonation sessions (via functions)
CREATE POLICY "System can manage impersonation sessions"
ON public.admin_impersonation_sessions FOR ALL
WITH CHECK (true);

-- =====================================================
-- 2. SECURE TOKEN GENERATION FUNCTIONS
-- =====================================================

-- Function to generate secure session token
CREATE OR REPLACE FUNCTION public.generate_impersonation_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token TEXT;
    prefix TEXT := 'imp_';
    random_part TEXT;
BEGIN
    -- Generate cryptographically secure random token
    -- Using combination of timestamp and random bytes for uniqueness
    random_part := encode(
        gen_random_bytes(32) || 
        convert_to(extract(epoch from now())::text, 'utf8'),
        'base64'
    );
    
    -- Clean up the token (remove padding and make URL-safe)
    random_part := replace(replace(replace(random_part, '+', '-'), '/', '_'), '=', '');
    
    token := prefix || random_part;
    
    RETURN token;
END;
$$;

-- Function to hash impersonation token for secure storage
CREATE OR REPLACE FUNCTION public.hash_impersonation_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Use SHA-256 for token hashing
    RETURN encode(digest(token, 'sha256'), 'hex');
END;
$$;

-- =====================================================
-- 3. IMPERSONATION SESSION MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to start admin impersonation session
CREATE OR REPLACE FUNCTION public.start_admin_impersonation(
    site_uuid UUID,
    impersonated_user_uuid UUID DEFAULT NULL,
    purpose_text TEXT DEFAULT NULL,
    duration_hours INTEGER DEFAULT 2,
    allowed_actions_list TEXT[] DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_val TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id UUID;
    session_token TEXT;
    session_token_hash TEXT;
    expires_timestamp TIMESTAMPTZ;
    session_id UUID;
    result JSON;
BEGIN
    -- Only allow admins to start impersonation
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    admin_user_id := auth.uid();
    
    -- Validate site exists
    IF NOT EXISTS (SELECT 1 FROM public.sites WHERE id = site_uuid) THEN
        RAISE EXCEPTION 'Site not found: %', site_uuid;
    END IF;
    
    -- Validate impersonated user exists and has access to site (if specified)
    IF impersonated_user_uuid IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.site_memberships 
            WHERE user_id = impersonated_user_uuid 
            AND site_id = site_uuid 
            AND is_active = true
        ) THEN
            RAISE EXCEPTION 'User does not have access to site: %', impersonated_user_uuid;
        END IF;
    END IF;
    
    -- Limit duration to maximum 24 hours
    IF duration_hours > 24 THEN
        duration_hours := 24;
    END IF;
    
    -- Generate secure session token
    session_token := public.generate_impersonation_token();
    session_token_hash := public.hash_impersonation_token(session_token);
    expires_timestamp := NOW() + (duration_hours || ' hours')::interval;
    
    -- End any existing active sessions for this admin/site combination
    UPDATE public.admin_impersonation_sessions
    SET 
        is_active = false,
        ended_at = NOW(),
        ended_by_admin_id = admin_user_id,
        end_reason = 'replaced'
    WHERE admin_user_id = admin_user_id
    AND site_id = site_uuid
    AND is_active = true;
    
    -- Create new impersonation session
    INSERT INTO public.admin_impersonation_sessions (
        admin_user_id,
        site_id,
        impersonated_user_id,
        session_token,
        session_token_hash,
        expires_at,
        purpose,
        ip_address,
        user_agent,
        allowed_actions
    ) VALUES (
        admin_user_id,
        site_uuid,
        impersonated_user_uuid,
        session_token,
        session_token_hash,
        expires_timestamp,
        purpose_text,
        ip_addr,
        user_agent_val,
        allowed_actions_list
    ) RETURNING id INTO session_id;
    
    -- Log the impersonation start
    PERFORM public.log_admin_action(
        admin_user_id,
        site_uuid,
        'impersonation_start',
        'site',
        site_uuid,
        NULL,
        json_build_object(
            'session_id', session_id,
            'impersonated_user_id', impersonated_user_uuid,
            'duration_hours', duration_hours,
            'purpose', purpose_text,
            'expires_at', expires_timestamp
        ),
        'Started impersonation session for site access',
        ip_addr,
        user_agent_val
    );
    
    -- Return session information
    SELECT json_build_object(
        'session_id', session_id,
        'session_token', session_token,
        'expires_at', expires_timestamp,
        'site_id', site_uuid,
        'impersonated_user_id', impersonated_user_uuid,
        'duration_hours', duration_hours
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to validate and get impersonation context
CREATE OR REPLACE FUNCTION public.get_impersonation_context(token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token_hash TEXT;
    session_record public.admin_impersonation_sessions%ROWTYPE;
    site_record public.sites%ROWTYPE;
    admin_profile public.profiles%ROWTYPE;
    impersonated_profile public.profiles%ROWTYPE;
    result JSON;
BEGIN
    -- Hash the provided token
    token_hash := public.hash_impersonation_token(token);
    
    -- Find active session with matching token hash
    SELECT * INTO session_record
    FROM public.admin_impersonation_sessions
    WHERE session_token_hash = token_hash
    AND is_active = true
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Invalid or expired impersonation session'
        );
    END IF;
    
    -- Update last used timestamp
    UPDATE public.admin_impersonation_sessions
    SET last_used_at = NOW()
    WHERE id = session_record.id;
    
    -- Get site information
    SELECT * INTO site_record
    FROM public.sites
    WHERE id = session_record.site_id;
    
    -- Get admin profile
    SELECT * INTO admin_profile
    FROM public.profiles
    WHERE user_id = session_record.admin_user_id;
    
    -- Get impersonated user profile (if applicable)
    IF session_record.impersonated_user_id IS NOT NULL THEN
        SELECT * INTO impersonated_profile
        FROM public.profiles
        WHERE user_id = session_record.impersonated_user_id;
    END IF;
    
    -- Build context response
    SELECT json_build_object(
        'valid', true,
        'session_id', session_record.id,
        'admin_user_id', session_record.admin_user_id,
        'admin_email', admin_profile.email,
        'admin_name', admin_profile.full_name,
        'site_id', session_record.site_id,
        'site_name', site_record.name,
        'site_subdomain', site_record.subdomain,
        'site_custom_domain', site_record.custom_domain,
        'impersonated_user_id', session_record.impersonated_user_id,
        'impersonated_user_email', COALESCE(impersonated_profile.email, null),
        'impersonated_user_name', COALESCE(impersonated_profile.full_name, null),
        'created_at', session_record.created_at,
        'expires_at', session_record.expires_at,
        'purpose', session_record.purpose,
        'allowed_actions', session_record.allowed_actions,
        'restrictions', session_record.restrictions
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to end impersonation session
CREATE OR REPLACE FUNCTION public.end_impersonation_session(
    session_token_param TEXT DEFAULT NULL,
    session_id_param UUID DEFAULT NULL,
    end_reason_param VARCHAR(50) DEFAULT 'manual'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id UUID;
    session_record public.admin_impersonation_sessions%ROWTYPE;
    token_hash TEXT;
    result JSON;
BEGIN
    admin_user_id := auth.uid();
    
    -- Find session by token or ID
    IF session_token_param IS NOT NULL THEN
        token_hash := public.hash_impersonation_token(session_token_param);
        SELECT * INTO session_record
        FROM public.admin_impersonation_sessions
        WHERE session_token_hash = token_hash
        AND is_active = true;
    ELSIF session_id_param IS NOT NULL THEN
        SELECT * INTO session_record
        FROM public.admin_impersonation_sessions
        WHERE id = session_id_param
        AND is_active = true
        AND (admin_user_id = admin_user_id OR public.is_admin());
    ELSE
        RAISE EXCEPTION 'Either session_token or session_id must be provided';
    END IF;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Active impersonation session not found'
        );
    END IF;
    
    -- Only the original admin or another admin can end the session
    IF session_record.admin_user_id != admin_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Cannot end another admin''s impersonation session';
    END IF;
    
    -- End the session
    UPDATE public.admin_impersonation_sessions
    SET 
        is_active = false,
        ended_at = NOW(),
        ended_by_admin_id = admin_user_id,
        end_reason = end_reason_param
    WHERE id = session_record.id;
    
    -- Log the impersonation end
    PERFORM public.log_admin_action(
        admin_user_id,
        session_record.site_id,
        'impersonation_end',
        'site',
        session_record.site_id,
        NULL,
        json_build_object(
            'session_id', session_record.id,
            'duration', EXTRACT(EPOCH FROM (NOW() - session_record.created_at)) / 3600,
            'end_reason', end_reason_param,
            'ended_by_admin_id', admin_user_id
        ),
        'Ended impersonation session'
    );
    
    SELECT json_build_object(
        'success', true,
        'session_id', session_record.id,
        'ended_at', NOW(),
        'end_reason', end_reason_param,
        'duration_hours', ROUND(EXTRACT(EPOCH FROM (NOW() - session_record.created_at)) / 3600, 2)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- 4. SESSION CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to cleanup expired impersonation sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_impersonation_sessions()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count INTEGER;
    result JSON;
BEGIN
    -- End all expired sessions
    UPDATE public.admin_impersonation_sessions
    SET 
        is_active = false,
        ended_at = NOW(),
        end_reason = 'expired'
    WHERE is_active = true
    AND expires_at <= NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log cleanup action if any sessions were expired
    IF expired_count > 0 THEN
        PERFORM public.log_admin_action(
            NULL, -- System action
            NULL, -- Multiple sites possible
            'impersonation_cleanup',
            'system',
            NULL,
            NULL,
            json_build_object('expired_sessions_count', expired_count),
            format('Cleaned up %s expired impersonation sessions', expired_count)
        );
    END IF;
    
    SELECT json_build_object(
        'success', true,
        'expired_sessions_count', expired_count,
        'cleanup_timestamp', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to get active impersonation sessions for admin monitoring
CREATE OR REPLACE FUNCTION public.get_active_impersonation_sessions(
    admin_user_uuid UUID DEFAULT NULL,
    site_uuid UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Only allow admins to view active sessions
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    SELECT json_build_object(
        'sessions', COALESCE(json_agg(
            json_build_object(
                'id', ais.id,
                'admin_user_id', ais.admin_user_id,
                'admin_email', au.email,
                'admin_name', ap.full_name,
                'site_id', ais.site_id,
                'site_name', s.name,
                'site_subdomain', s.subdomain,
                'impersonated_user_id', ais.impersonated_user_id,
                'impersonated_user_email', iu.email,
                'impersonated_user_name', ip.full_name,
                'created_at', ais.created_at,
                'expires_at', ais.expires_at,
                'last_used_at', ais.last_used_at,
                'purpose', ais.purpose,
                'ip_address', ais.ip_address,
                'allowed_actions', ais.allowed_actions
            ) ORDER BY ais.created_at DESC
        ), '[]'::json),
        'total_count', COUNT(*)
    ) INTO result
    FROM public.admin_impersonation_sessions ais
    LEFT JOIN auth.users au ON ais.admin_user_id = au.id
    LEFT JOIN public.profiles ap ON ais.admin_user_id = ap.user_id
    LEFT JOIN public.sites s ON ais.site_id = s.id
    LEFT JOIN auth.users iu ON ais.impersonated_user_id = iu.id
    LEFT JOIN public.profiles ip ON ais.impersonated_user_id = ip.user_id
    WHERE ais.is_active = true
    AND (admin_user_uuid IS NULL OR ais.admin_user_id = admin_user_uuid)
    AND (site_uuid IS NULL OR ais.site_id = site_uuid)
    LIMIT limit_count;
    
    RETURN result;
END;
$$;

-- =====================================================
-- 5. AUTOMATED CLEANUP TRIGGER
-- =====================================================

-- Create a trigger to automatically log impersonation session changes
CREATE OR REPLACE FUNCTION public.trigger_log_impersonation_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only log when session is ended
    IF OLD.is_active = true AND NEW.is_active = false THEN
        PERFORM public.log_admin_action(
            NEW.ended_by_admin_id,
            NEW.site_id,
            'impersonation_session_ended',
            'site',
            NEW.site_id,
            json_build_object(
                'session_id', OLD.id,
                'duration_hours', ROUND(EXTRACT(EPOCH FROM (NEW.ended_at - OLD.created_at)) / 3600, 2),
                'end_reason', NEW.end_reason
            ),
            NULL,
            format('Impersonation session ended: %s', NEW.end_reason)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for impersonation session changes
CREATE TRIGGER trigger_admin_impersonation_session_changes
    AFTER UPDATE ON public.admin_impersonation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_log_impersonation_changes();

-- =====================================================
-- 6. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.admin_impersonation_sessions IS 'Secure admin impersonation sessions for site access with time limits and audit trail';
COMMENT ON FUNCTION public.generate_impersonation_token IS 'Generate cryptographically secure impersonation session token';
COMMENT ON FUNCTION public.hash_impersonation_token IS 'Hash impersonation token for secure storage';
COMMENT ON FUNCTION public.start_admin_impersonation IS 'Start admin impersonation session with secure token generation - admin only';
COMMENT ON FUNCTION public.get_impersonation_context IS 'Validate impersonation token and return session context';
COMMENT ON FUNCTION public.end_impersonation_session IS 'End active impersonation session - admin only';
COMMENT ON FUNCTION public.cleanup_expired_impersonation_sessions IS 'Cleanup expired impersonation sessions';
COMMENT ON FUNCTION public.get_active_impersonation_sessions IS 'Get active impersonation sessions for monitoring - admin only';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration successfully implements:
-- 1. Secure admin impersonation sessions table with proper indexes and RLS
-- 2. Cryptographically secure token generation and hashing
-- 3. Session management functions for start/validate/end operations
-- 4. Automatic session expiry and cleanup mechanisms
-- 5. Comprehensive audit logging for all impersonation activities
-- 6. Admin-only access controls with proper security measures
-- 7. Time-limited sessions with configurable duration (max 24 hours)
-- 8. Session monitoring and management capabilities
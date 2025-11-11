-- Auto-promote first user to site_owner role
-- The first user to sign up automatically gets site_owner role for platform access
-- Subsequent users default to 'user' role and need manual promotion

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  sanitized_username TEXT;
  user_count INTEGER;
  assigned_role TEXT;
BEGIN
  -- Get username from metadata or email prefix
  sanitized_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Sanitize username: replace invalid characters with underscores
  -- Valid characters are: letters, numbers, underscores
  sanitized_username := REGEXP_REPLACE(sanitized_username, '[^a-zA-Z0-9_]', '_', 'g');

  -- Ensure username is at least 3 characters (pad with underscores if needed)
  WHILE LENGTH(sanitized_username) < 3 LOOP
    sanitized_username := sanitized_username || '_';
  END LOOP;

  -- Truncate to 30 characters maximum
  sanitized_username := SUBSTRING(sanitized_username FROM 1 FOR 30);

  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;

  -- Determine role: first user gets site_owner, others get metadata role or default 'user'
  IF user_count = 0 THEN
    assigned_role := 'site_owner';
    RAISE NOTICE 'First user signup detected. Assigning site_owner role to: %', NEW.email;
  ELSE
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  END IF;

  -- Insert profile with sanitized username and determined role
  INSERT INTO public.profiles (user_id, full_name, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    sanitized_username,
    NEW.email,
    assigned_role
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up. Sanitizes username to comply with validation rules (3-30 chars, alphanumeric + underscores only). First user is automatically promoted to site_owner role.';

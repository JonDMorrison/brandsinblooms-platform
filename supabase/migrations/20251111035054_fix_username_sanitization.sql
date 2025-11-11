-- Fix username sanitization in handle_new_user function
-- Sanitize email-derived usernames to comply with validation rules
-- Replaces invalid characters (periods, hyphens, etc.) with underscores

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  sanitized_username TEXT;
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

  -- Insert profile with sanitized username
  INSERT INTO public.profiles (user_id, full_name, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    sanitized_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up. Sanitizes username to comply with validation rules (3-30 chars, alphanumeric + underscores only).';

-- Create the necessary roles for Supabase
DO $$
BEGIN
  -- Create authenticator role if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator WITH LOGIN PASSWORD 'authenticatorpass' NOINHERIT;
  END IF;

  -- Create anon role if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOINHERIT;
  END IF;

  -- Create authenticated role if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOINHERIT;
  END IF;

  -- Create service_role if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOINHERIT BYPASSRLS;
  END IF;

  -- Grant anon role to authenticator
  GRANT anon TO authenticator;
  
  -- Grant authenticated role to authenticator
  GRANT authenticated TO authenticator;
  
  -- Grant service_role to authenticator
  GRANT service_role TO authenticator;

  -- Create supabase_admin role
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin WITH LOGIN PASSWORD 'root' SUPERUSER CREATEDB CREATEROLE REPLICATION BYPASSRLS;
  END IF;

  -- Create supabase_auth_admin role
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin WITH LOGIN PASSWORD 'root' NOINHERIT CREATEROLE;
  END IF;

  -- Create supabase_storage_admin role
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin WITH LOGIN PASSWORD 'root' NOINHERIT CREATEROLE;
  END IF;

  -- Create supabase_realtime_admin role (not used in newer versions, but kept for compatibility)
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime_admin') THEN
    CREATE ROLE supabase_realtime_admin WITH LOGIN PASSWORD 'root' NOINHERIT;
  END IF;
END
$$;

-- Grant necessary permissions on the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, supabase_auth_admin, supabase_storage_admin;
GRANT CREATE ON SCHEMA public TO supabase_auth_admin, supabase_storage_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, supabase_auth_admin, supabase_storage_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, supabase_auth_admin, supabase_storage_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role, supabase_auth_admin, supabase_storage_admin;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;
CREATE SCHEMA IF NOT EXISTS _realtime;
CREATE SCHEMA IF NOT EXISTS graphql_public;

-- Grant schema ownership
ALTER SCHEMA _realtime OWNER TO supabase_admin;
GRANT ALL ON SCHEMA _realtime TO supabase_admin;

-- Grant permissions on schemas
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgjwt;

-- Grant database connect permissions
GRANT CONNECT ON DATABASE postgres TO supabase_auth_admin, supabase_storage_admin, authenticator;

-- Grant necessary database-level permissions for storage migrations
GRANT CREATE ON DATABASE postgres TO supabase_storage_admin;
GRANT TEMPORARY ON DATABASE postgres TO supabase_storage_admin;
GRANT ALL PRIVILEGES ON DATABASE postgres TO supabase_storage_admin;

-- Set default privileges for new tables created by these roles
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_storage_admin IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
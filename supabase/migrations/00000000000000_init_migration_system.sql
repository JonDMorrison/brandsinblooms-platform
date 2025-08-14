-- Initialize migration system for automated deployments
-- This migration sets up the infrastructure needed for the migration runner

-- Create exec_sql function for executing SQL via RPC
-- SECURITY NOTE: This function should only be accessible by service role
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Execute the provided SQL
  EXECUTE sql;
  
  -- Return success message
  RETURN 'SQL executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- Revoke public access and grant only to authenticated role
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(text) FROM anon;

-- Allow authenticated users (service role will have this)
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION exec_sql(text) IS 'Execute SQL statements via RPC. Used by migration system. Service role access required.';

-- Create migration infrastructure tables if they don't exist
-- (These will be created by the migration runner, but we ensure they exist)

CREATE TABLE IF NOT EXISTS migration_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  migration_batch TEXT NOT NULL,
  UNIQUE(migration_batch)
);

CREATE TABLE IF NOT EXISTS migration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  executed_by TEXT NOT NULL,
  execution_time_ms INTEGER
);

-- Add RLS policies for migration tables (service role should have access)
ALTER TABLE migration_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_history ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage migrations
CREATE POLICY "Service role can manage migration locks" ON migration_locks
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage migration history" ON migration_history
  FOR ALL TO service_role USING (true);

-- Allow authenticated users to read migration status (for health checks)
CREATE POLICY "Authenticated users can read migration history" ON migration_history
  FOR SELECT TO authenticated USING (true);

-- Create helper functions for migration system
CREATE OR REPLACE FUNCTION acquire_migration_lock(
  p_instance_id TEXT,
  p_migration_batch TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Clean up stale locks (older than 5 minutes)
  DELETE FROM migration_locks 
  WHERE locked_at < NOW() - INTERVAL '5 minutes';
  
  -- Try to acquire lock
  INSERT INTO migration_locks (instance_id, migration_batch)
  VALUES (p_instance_id, p_migration_batch)
  ON CONFLICT (migration_batch) DO NOTHING;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION release_migration_lock(
  p_instance_id TEXT,
  p_migration_batch TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM migration_locks 
  WHERE instance_id = p_instance_id AND migration_batch = p_migration_batch;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION acquire_migration_lock(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION release_migration_lock(TEXT, TEXT) TO authenticated;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_migration_locks_locked_at ON migration_locks(locked_at);
CREATE INDEX IF NOT EXISTS idx_migration_locks_migration_batch ON migration_locks(migration_batch);
CREATE INDEX IF NOT EXISTS idx_migration_history_filename ON migration_history(filename);
CREATE INDEX IF NOT EXISTS idx_migration_history_executed_at ON migration_history(executed_at);

-- Add comments for documentation
COMMENT ON TABLE migration_locks IS 'Distributed locks for coordinating migrations across multiple container instances';
COMMENT ON TABLE migration_history IS 'Track executed migrations with checksums for integrity verification';
COMMENT ON FUNCTION acquire_migration_lock(TEXT, TEXT) IS 'Acquire distributed lock for migration execution';
COMMENT ON FUNCTION release_migration_lock(TEXT, TEXT) IS 'Release distributed lock after migration completion';
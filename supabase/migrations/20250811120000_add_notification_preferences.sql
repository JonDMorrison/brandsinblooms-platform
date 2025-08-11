-- Create notification_preferences table
CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_marketing boolean DEFAULT true NOT NULL,
  email_updates boolean DEFAULT true NOT NULL,
  push_enabled boolean DEFAULT false NOT NULL,
  digest_frequency varchar(20) DEFAULT 'weekly' NOT NULL CHECK (digest_frequency IN ('daily', 'weekly', 'monthly', 'never')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Add comment for documentation
COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences for email and push notifications';
COMMENT ON COLUMN notification_preferences.digest_frequency IS 'Frequency for email digest: daily, weekly, monthly, or never';
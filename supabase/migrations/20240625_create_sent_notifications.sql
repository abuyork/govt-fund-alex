-- Create sent_notifications table for tracking which notifications have been sent
CREATE TABLE IF NOT EXISTS sent_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  opportunity_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a unique constraint to prevent duplicate notifications
CREATE UNIQUE INDEX IF NOT EXISTS idx_sent_notifications_unique 
ON sent_notifications(user_id, opportunity_id, notification_type);

-- Create index for efficient lookups by user
CREATE INDEX IF NOT EXISTS idx_sent_notifications_user_id 
ON sent_notifications(user_id);

-- Create index for efficient lookups by opportunity
CREATE INDEX IF NOT EXISTS idx_sent_notifications_opportunity_id 
ON sent_notifications(opportunity_id);

-- Add a comment to explain the table
COMMENT ON TABLE sent_notifications IS 'Tracks notifications that have been sent to users to prevent duplicates'; 
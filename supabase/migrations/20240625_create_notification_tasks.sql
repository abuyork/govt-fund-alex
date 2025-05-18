-- Create notification_tasks table for the task queue system
CREATE TABLE IF NOT EXISTS notification_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  parameters JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  parent_task_id UUID REFERENCES notification_tasks(id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_tasks_status ON notification_tasks(status);
CREATE INDEX IF NOT EXISTS idx_notification_tasks_type ON notification_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_notification_tasks_parent ON notification_tasks(parent_task_id);

-- Create a function to reset retry tasks to pending status
-- This will be called periodically by the system
CREATE OR REPLACE FUNCTION reset_retry_tasks()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notification_tasks
  SET status = 'pending',
      updated_at = NOW()
  WHERE status = 'retry'
  RETURNING COUNT(*) INTO updated_count;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create a stored procedure for creating the system_settings table if it doesn't exist
-- This is used for storing system-wide settings like last check timestamp
CREATE OR REPLACE PROCEDURE create_system_settings_table_if_not_exists()
LANGUAGE plpgsql AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
END;
$$;

-- Call the procedure to ensure the system_settings table exists
CALL create_system_settings_table_if_not_exists();

-- Set initial values for system settings if they don't exist
INSERT INTO system_settings (key, value, updated_at)
VALUES ('last_notification_check', NOW()::TEXT, NOW())
ON CONFLICT (key) DO NOTHING;

-- Add comments to explain the tables
COMMENT ON TABLE notification_tasks IS 'Stores notification processing tasks for the queue system';
COMMENT ON TABLE system_settings IS 'Stores system-wide settings for the notification system'; 
-- Create message_queue table for storing notification messages
CREATE TABLE IF NOT EXISTS message_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message_type TEXT NOT NULL,
  content JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'processing')),
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status);
CREATE INDEX IF NOT EXISTS idx_message_queue_user_id ON message_queue(user_id);

-- Create a function to update retry status for failed messages
CREATE OR REPLACE FUNCTION update_retry_messages(max_retries INTEGER DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  WITH messages_to_update AS (
    SELECT id
    FROM message_queue
    WHERE status = 'failed'
    AND retry_count < max_retries
    ORDER BY updated_at ASC
    LIMIT 100
  )
  UPDATE message_queue mq
  SET 
    status = 'pending',
    retry_count = retry_count + 1,
    updated_at = NOW()
  FROM messages_to_update mtu
  WHERE mq.id = mtu.id
  RETURNING COUNT(*) INTO updated_count;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to explain the table
COMMENT ON TABLE message_queue IS 'Stores messages to be delivered to users via KakaoTalk or other channels'; 
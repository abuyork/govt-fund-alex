-- Add kakao_token_expires_at column to user_notification_settings table
ALTER TABLE user_notification_settings 
ADD COLUMN IF NOT EXISTS kakao_token_expires_at TIMESTAMP WITH TIME ZONE; 
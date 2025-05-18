-- Function to send a test notification to a KakaoTalk user
CREATE OR REPLACE FUNCTION send_kakao_test_notification(
  target_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_settings RECORD;
  v_message JSONB;
  v_result JSONB;
  v_headers JSONB;
  v_body TEXT;
  v_response_status INTEGER;
  v_response_body TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get the user's Kakao token from the database
  SELECT * INTO v_settings
  FROM user_notification_settings
  WHERE user_id = target_user_id;
  
  IF v_settings IS NULL OR v_settings.kakao_token IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No Kakao token found for this user'
    );
  END IF;
  
  -- Check if token is expired
  IF v_settings.kakao_token_expires_at IS NOT NULL AND v_settings.kakao_token_expires_at < v_now THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Kakao token is expired. Please refresh the token first.',
      'expires_at', v_settings.kakao_token_expires_at
    );
  END IF;
  
  -- Create message template
  v_message := jsonb_build_object(
    'object_type', 'text',
    'text', '🧪 테스트 알림: 이 메시지는 카카오톡 API 연동 테스트입니다.\n\n이 메시지는 관리자에 의해 테스트 목적으로 전송되었습니다.',
    'link', jsonb_build_object(
      'web_url', 'https://kvzd.info',
      'mobile_web_url', 'https://kvzd.info'
    ),
    'button_title', '서비스로 이동'
  );
  
  -- Set headers for Kakao API request
  v_headers := jsonb_build_object(
    'Authorization', 'Bearer ' || v_settings.kakao_token,
    'Content-Type', 'application/x-www-form-urlencoded'
  );
  
  -- Make HTTP request to Kakao API
  SELECT 
    status, content
  INTO
    v_response_status, v_response_body
  FROM
    http((
      'POST',
      'https://kapi.kakao.com/v2/api/talk/memo/default/send',
      v_headers,
      'template_object=' || url_encode(v_message::text),
      null
    )::http_request);
  
  -- Process response
  IF v_response_status = 200 THEN
    -- Log this message in the database
    INSERT INTO message_queue (
      user_id,
      message_type,
      content,
      status,
      sent_at,
      updated_at
    ) VALUES (
      target_user_id,
      'test',
      jsonb_build_object(
        'title', '테스트 알림',
        'description', '이 메시지는 관리자에 의해 테스트 목적으로 전송되었습니다.',
        'programId', 'test-message',
        'programUrl', 'https://kvzd.info',
        'messageType', 'test'
      ),
      'sent',
      v_now,
      v_now
    );
    
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Notification sent successfully!'
    );
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'status', v_response_status,
      'error', 'Failed to send Kakao notification',
      'response', v_response_body
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
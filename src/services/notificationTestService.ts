import { supabase } from './supabase';

/**
 * Test the time-based notification system by manually triggering a time-check
 * @param hour Hour in 24-hour format (0-23)
 * @param minute Minute (0-59)
 */
export async function testTimeBasedNotification(hour?: number, minute?: number): Promise<{
  success: boolean;
  message: string;
  result?: any;
  error?: string;
}> {
  try {
    // Use current time if not specified
    const now = new Date();
    const testHour = hour !== undefined ? hour : now.getHours();
    const testMinute = minute !== undefined ? minute : now.getMinutes();
    
    console.log(`Testing time-based notification at ${testHour}:${testMinute}`);
    
    // Get the Supabase URL for the edge function
    let edgeFunctionUrl = `${process.env.SUPABASE_URL}/functions/v1/process-notifications`;
    
    // Get the session token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      return {
        success: false,
        message: 'No authenticated session found',
        error: 'Not authenticated'
      };
    }
    
    // Call the edge function with time-check action
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        action: 'time-check',
        hour: testHour,
        minute: testMinute
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Error calling process-notifications: ${response.status} ${response.statusText}`,
        error: errorText
      };
    }
    
    const result = await response.json();
    
    return {
      success: true,
      message: `Successfully tested time-based notification at ${testHour}:${testMinute}`,
      result
    };
  } catch (error) {
    console.error('Error testing time-based notification:', error);
    return {
      success: false,
      message: 'Error testing time-based notification',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check if a user has notifications scheduled to be sent at a specific time
 * @param userId User ID to check
 * @param hour Hour in 24-hour format (0-23)
 * @param minute Minute (0-59)
 */
export async function checkUserNotificationTime(userId: string): Promise<{
  success: boolean;
  message: string;
  settings?: any;
  error?: string;
}> {
  try {
    // Get the user's notification settings
    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      return {
        success: false,
        message: `Error fetching notification settings: ${error.message}`,
        error: error.message
      };
    }
    
    if (!data) {
      return {
        success: false,
        message: 'No notification settings found for this user',
        error: 'No settings found'
      };
    }
    
    return {
      success: true,
      message: `Found notification settings: time=${data.notification_time}, new_programs=${data.new_programs_alert}, deadline=${data.deadline_notification}`,
      settings: data
    };
  } catch (error) {
    console.error('Error checking user notification time:', error);
    return {
      success: false,
      message: 'Error checking user notification time',
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 
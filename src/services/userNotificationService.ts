import { supabase } from './supabase';

// Define types for the notification settings
export interface NotificationSettings {
  id?: string;
  userId: string;
  kakaoLinked: boolean;
  kakaoTokenExpiresAt?: string;
  newProgramsAlert: boolean;
  notificationFrequency: 'daily' | 'weekly' | 'monthly';
  notificationTime: string; // Format: "HH:MM"
  deadlineNotification: boolean;
  deadlineDays: number;
  regions: string[];
  categories: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get the notification settings for the current user
 */
export async function getUserNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }
    
    // Convert snake_case to camelCase
    const settings: NotificationSettings = {
      id: data.id,
      userId: data.user_id,
      kakaoLinked: data.kakao_linked,
      kakaoTokenExpiresAt: data.kakao_token_expires_at,
      newProgramsAlert: data.new_programs_alert,
      notificationFrequency: data.notification_frequency,
      notificationTime: data.notification_time,
      deadlineNotification: data.deadline_notification,
      deadlineDays: data.deadline_days,
      regions: data.regions || [],
      categories: data.categories || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    return settings;
  } catch (error) {
    console.error('Error in getUserNotificationSettings:', error);
    return null;
  }
}

/**
 * Save or update notification settings for the current user
 */
export async function saveNotificationSettings(settings: NotificationSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Convert camelCase to snake_case for Supabase
    const dbSettings: any = {
      user_id: user.id,
      kakao_linked: settings.kakaoLinked,
      new_programs_alert: settings.newProgramsAlert,
      notification_frequency: settings.notificationFrequency,
      notification_time: settings.notificationTime,
      deadline_notification: settings.deadlineNotification,
      deadline_days: settings.deadlineDays,
      regions: settings.regions,
      categories: settings.categories,
      updated_at: new Date().toISOString()
    };
    
    // Check if the user already has notification settings
    const { data: existingSettings } = await supabase
      .from('user_notification_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    let result;
    
    if (existingSettings?.id) {
      // Update existing settings
      result = await supabase
        .from('user_notification_settings')
        .update(dbSettings)
        .eq('id', existingSettings.id);
    } else {
      // Create new settings
      dbSettings.created_at = new Date().toISOString();
      result = await supabase
        .from('user_notification_settings')
        .insert(dbSettings);
    }
    
    if (result.error) {
      console.error('Error saving notification settings:', result.error);
      return { success: false, error: result.error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in saveNotificationSettings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Link a KakaoTalk account to receive notifications
 */
export async function linkKakaoForNotifications(): Promise<{ success: boolean; error?: string; redirecting?: boolean }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Initiate Kakao OAuth flow with necessary scopes
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin + '/dashboard/notifications?action=link-kakao',
        scopes: 'profile_nickname,profile_image,account_email,talk_message', // Request messaging permissions
      }
    });
    
    if (error) {
      console.error('Error starting Kakao OAuth:', error);
      return { success: false, error: error.message };
    }
    
    // This just initiates the OAuth process, which will redirect the user
    return { success: true, redirecting: true };
  } catch (error: any) {
    console.error('Error in linkKakaoForNotifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unlink a KakaoTalk account from notifications
 */
export async function unlinkKakaoForNotifications(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const { data: existingSettings } = await supabase
      .from('user_notification_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!existingSettings?.id) {
      return { success: false, error: 'No notification settings found' };
    }
    
    const result = await supabase
      .from('user_notification_settings')
      .update({ 
        kakao_linked: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSettings.id);
    
    if (result.error) {
      console.error('Error unlinking KakaoTalk:', result.error);
      return { success: false, error: result.error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in unlinkKakaoForNotifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle the Kakao auth callback after linking
 */
export async function handleKakaoLinkingCallback(): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the current session which should contain the Kakao token
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      return { success: false, error: error?.message || 'No active session' };
    }
    
    const providerToken = data.session.provider_token;
    const userId = data.session.user.id;
    
    if (!providerToken) {
      return { success: false, error: 'No provider token found' };
    }
    
    // Calculate token expiration date (30 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const tokenExpiresAt = expirationDate.toISOString();
    
    // Get existing settings or create new ones
    const { data: existingSettings } = await supabase
      .from('user_notification_settings')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    let result;
    
    if (existingSettings?.id) {
      // Update existing settings
      result = await supabase
        .from('user_notification_settings')
        .update({ 
          kakao_linked: true,
          kakao_token: providerToken, // Store the token for future use
          kakao_token_expires_at: tokenExpiresAt, // Set token expiration
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id);
    } else {
      // Create new settings with Kakao token
      result = await supabase
        .from('user_notification_settings')
        .insert({
          user_id: userId,
          kakao_linked: true,
          kakao_token: providerToken,
          kakao_token_expires_at: tokenExpiresAt, // Set token expiration
          new_programs_alert: true,
          notification_frequency: 'daily',
          notification_time: '09:00',
          deadline_notification: true,
          deadline_days: 3,
          regions: [],
          categories: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
    
    if (result.error) {
      console.error('Error updating Kakao link status:', result.error);
      return { success: false, error: result.error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in handleKakaoLinkingCallback:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get users who should receive notifications at a specific time
 * @param hour Hour in 24-hour format (0-23)
 * @param minute Minute (0-59)
 * @returns Array of user IDs that should be notified at the specified time
 */
export async function getUsersToNotifyAtTime(hour: number, minute: number): Promise<string[]> {
  try {
    // Input validation
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      console.error(`Invalid time parameters: hour=${hour}, minute=${minute}`);
      return [];
    }

    // Format the time string to match the database format (HH:MM)
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    console.log(`Checking for users with notification_time=${timeString}`);
    
    // Query users with matching notification time who have enabled notifications
    // and have either new programs alert or deadline notification enabled
    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('user_id')
      .eq('notification_time', timeString)
      .eq('kakao_linked', true)
      .or('new_programs_alert.eq.true,deadline_notification.eq.true');
    
    if (error) {
      console.error('Error fetching users for time-based notification:', error);
      return [];
    }
    
    const userIds = data?.map(user => user.user_id) || [];
    console.log(`Found ${userIds.length} users to notify at time ${timeString}`);
    
    return userIds;
  } catch (error) {
    console.error('Error in getUsersToNotifyAtTime:', error);
    return [];
  }
} 
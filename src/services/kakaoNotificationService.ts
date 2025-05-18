import axios from 'axios';
import { supabase } from './supabase';

// Environment variables
const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_CLIENT_ID;
// These would need to be provided by your boss
const KAKAO_ADMIN_KEY = import.meta.env.VITE_KAKAO_ADMIN_KEY; 
const KAKAO_SENDER_KEY = import.meta.env.VITE_KAKAO_SENDER_KEY;

interface KakaoNotificationResult {
  success: boolean;
  error?: string;
  simulated?: boolean;
}

/**
 * Placeholder for sending notifications via KakaoTalk
 * This will need to be updated with real business API credentials 
 */
export async function sendKakaoNotification(
  userId: string, 
  messageContent: string,
  programUrl: string
): Promise<KakaoNotificationResult> {
  try {
    // Get the user's Kakao token from your database
    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('kakao_token')
      .eq('user_id', userId)
      .single();
    
    if (error || !data.kakao_token) {
      console.error('Error finding user Kakao token:', error);
      return { success: false, error: 'User has no linked Kakao account' };
    }
    
    // For now, just log what would be sent
    console.log('KAKAO NOTIFICATION - PLACEHOLDER:');
    console.log('User ID:', userId);
    console.log('Message:', messageContent);
    console.log('Program URL:', programUrl);
    
    // In a production environment, with proper Business API credentials:
    /*
    const response = await axios.post(
      'https://kapi.kakao.com/v2/api/talk/memo/default/send',
      {
        template_object: JSON.stringify({
          object_type: 'text',
          text: messageContent,
          link: {
            web_url: programUrl,
            mobile_web_url: programUrl
          },
          button_title: '자세히 보기'
        })
      },
      {
        headers: {
          Authorization: `Bearer ${data.kakao_token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send Kakao notification' };
    }
    */
    
    // For now, just return success
    return { success: true, simulated: true };
    
  } catch (error: any) {
    console.error('Error sending Kakao notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a message queue entry for a user notification
 */
export async function createMessageQueueEntry(
  userId: string,
  programId: string,
  programTitle: string,
  programUrl: string,
  messageType: 'new_program' | 'deadline'
): Promise<{ success: boolean; error?: string }> {
  try {
    const messageContent = messageType === 'new_program'
      ? `새로운 지원사업 알림: ${programTitle}`
      : `마감 임박 알림: ${programTitle}`;
    
    const { error } = await supabase
      .from('message_queue')
      .insert({
        user_id: userId,
        program_id: programId,
        content: messageContent,
        program_url: programUrl,
        message_type: messageType,
        status: 'pending',
        created_at: new Date().toISOString(),
        retry_count: 0
      });
    
    if (error) {
      console.error('Error creating message queue entry:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in createMessageQueueEntry:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Match new programs with user preferences and create notification queue entries
 * This would typically be called by a scheduled job
 */
export async function processNewProgramMatches(newPrograms: any[]): Promise<{ processed: number; errors: number }> {
  try {
    // Get all users with notification settings
    const { data: users, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('kakao_linked', true)
      .eq('new_programs_alert', true);
    
    if (error) {
      console.error('Error fetching users for program matching:', error);
      return { processed: 0, errors: 1 };
    }
    
    let processed = 0;
    let errors = 0;
    
    // For each user, match programs with their preferences
    for (const user of users) {
      const userRegions = user.regions || [];
      const userCategories = user.categories || [];
      
      // Find matching programs for this user
      const matchingPrograms = newPrograms.filter(program => {
        // Match by region
        const regionMatch = userRegions.length === 0 || 
          userRegions.some((region: string) => program.regions.includes(region));
        
        // Match by category
        const categoryMatch = userCategories.length === 0 || 
          userCategories.some((category: string) => program.categories.includes(category));
        
        return regionMatch && categoryMatch;
      });
      
      // Create message queue entries for matching programs
      for (const program of matchingPrograms) {
        const result = await createMessageQueueEntry(
          user.user_id,
          program.id,
          program.title,
          program.url || `https://yourdomain.com/programs/${program.id}`,
          'new_program'
        );
        
        if (result.success) {
          processed++;
        } else {
          errors++;
        }
      }
    }
    
    return { processed, errors };
  } catch (error) {
    console.error('Error in processNewProgramMatches:', error);
    return { processed: 0, errors: 1 };
  }
}

/**
 * Process deadline notifications for programs that are about to expire
 */
export async function processDeadlineNotifications(): Promise<{ processed: number; errors: number }> {
  try {
    // Get all users with deadline notifications enabled
    const { data: users, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('kakao_linked', true)
      .eq('deadline_notification', true);
    
    if (error) {
      console.error('Error fetching users for deadline notifications:', error);
      return { processed: 0, errors: 1 };
    }
    
    let processed = 0;
    let errors = 0;
    
    // For each user with deadline notifications enabled
    for (const user of users) {
      const deadlineDays = user.deadline_days || 3;
      const userRegions = user.regions || [];
      const userCategories = user.categories || [];
      
      // Find programs that match the user's preferences and are about to expire
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + deadlineDays);
      
      // This would typically query your program database
      // to find programs with deadlines that match the target date
      const { data: programs, error: programsError } = await supabase
        .from('government_programs')
        .select('*')
        .lte('deadline', targetDate.toISOString())
        .gt('deadline', today.toISOString());
      
      if (programsError) {
        console.error('Error fetching programs for deadline notifications:', programsError);
        errors++;
        continue;
      }
      
      // Filter programs by user preferences
      const matchingPrograms = programs.filter(program => {
        // Match by region
        const regionMatch = userRegions.length === 0 || 
          userRegions.some((region: string) => program.regions.includes(region));
        
        // Match by category
        const categoryMatch = userCategories.length === 0 || 
          userCategories.some((category: string) => program.categories.includes(category));
        
        return regionMatch && categoryMatch;
      });
      
      // Create message queue entries for matching programs
      for (const program of matchingPrograms) {
        const result = await createMessageQueueEntry(
          user.user_id,
          program.id,
          program.title,
          program.url || `https://yourdomain.com/programs/${program.id}`,
          'deadline'
        );
        
        if (result.success) {
          processed++;
        } else {
          errors++;
        }
      }
    }
    
    return { processed, errors };
  } catch (error) {
    console.error('Error in processDeadlineNotifications:', error);
    return { processed: 0, errors: 1 };
  }
}

/**
 * Process the message queue and send notifications
 * This would typically be called by a scheduled job
 */
export async function processMessageQueue(limit = 50): Promise<{ sent: number; failed: number }> {
  try {
    // Get pending messages from the queue
    const { data: messages, error } = await supabase
      .from('message_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching message queue:', error);
      return { sent: 0, failed: 1 };
    }
    
    let sent = 0;
    let failed = 0;
    
    // Process each message
    for (const message of messages) {
      try {
        // Send the notification
        const result = await sendKakaoNotification(
          message.user_id,
          message.content,
          message.program_url
        );
        
        if (result.success) {
          // Update message status to sent
          await supabase
            .from('message_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', message.id);
          
          sent++;
        } else {
          // Update message status to failed
          await supabase
            .from('message_queue')
            .update({
              status: 'failed',
              error_message: result.error,
              retry_count: message.retry_count + 1
            })
            .eq('id', message.id);
          
          failed++;
        }
      } catch (error: any) {
        console.error(`Error processing message ${message.id}:`, error);
        
        // Update message status to failed
        await supabase
          .from('message_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            retry_count: message.retry_count + 1
          })
          .eq('id', message.id);
        
        failed++;
      }
    }
    
    return { sent, failed };
  } catch (error) {
    console.error('Error in processMessageQueue:', error);
    return { sent: 0, failed: 1 };
  }
} 
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
  tokenExpired?: boolean;
}

interface MessageContent {
  title: string;
  description?: string;
  programId: string;
  programUrl: string;
  messageType: 'new_program' | 'deadline';
  [key: string]: any; // Allow additional properties
}

/**
 * Send a notification via KakaoTalk
 * @param userId The user ID to send the notification to
 * @param messageContent The content of the message as a JSON object
 * @returns Result of the notification attempt
 */
export async function sendKakaoNotification(
  userId: string, 
  messageContent: MessageContent
): Promise<KakaoNotificationResult> {
  try {
    // Get the user's Kakao token from your database
    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('kakao_token, kakao_user_id')
      .eq('user_id', userId)
      .single();
    
    if (error || !data.kakao_token) {
      console.error('Error finding user Kakao token:', error);
      return { success: false, error: 'User has no linked Kakao account' };
    }
    
    // Format message content for KakaoTalk
    const title = messageContent.title;
    const description = messageContent.description || '';
    const programUrl = messageContent.programUrl;
    const isNewProgram = messageContent.messageType === 'new_program';
    
    // Create a formatted message
    const formattedMessage = isNewProgram
      ? `🆕 새로운 지원사업 알림: ${title}\n\n${description}`
      : `⏰ 마감 임박 알림: ${title}\n\n${description}`;
    
    // Check if we're in development mode
    const isDevelopment = import.meta.env.MODE === 'development';
    
    if (isDevelopment) {
      // For development, just log what would be sent
      console.log('KAKAO NOTIFICATION - DEVELOPMENT MODE:');
      console.log('User ID:', userId);
      console.log('Message:', formattedMessage);
      console.log('Program URL:', programUrl);
      return { success: true, simulated: true };
    }
    
    try {
      // In production, send the actual message
      const response = await axios.post(
        'https://kapi.kakao.com/v2/api/talk/memo/default/send',
        {
          template_object: JSON.stringify({
            object_type: 'text',
            text: formattedMessage,
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
        return { success: false, error: `Failed to send Kakao notification: ${response.statusText}` };
      }
    } catch (apiError: any) {
      // Handle token expiration specifically
      if (apiError.response && apiError.response.status === 401) {
        console.error('Kakao token expired or invalid:', apiError.response.data);
        return { 
          success: false, 
          error: 'Kakao token expired or invalid',
          tokenExpired: true 
        };
      }
      
      // Handle other API errors
      console.error('Kakao API error:', apiError);
      return { 
        success: false, 
        error: `Kakao API error: ${apiError.message}` 
      };
    }
  } catch (error: any) {
    console.error('Error in sendKakaoNotification:', error);
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
  messageType: 'new_program' | 'deadline',
  description: string = ''
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the content object to store in JSONB
    const content: MessageContent = {
      title: programTitle,
      description: description,
      programId: programId,
      programUrl: programUrl,
      messageType: messageType
    };
    
    // Insert into the message_queue table with our new schema
    const { error } = await supabase
      .from('message_queue')
      .insert({
        user_id: userId,
        message_type: messageType,
        content: content,
        status: 'pending',
        retry_count: 0,
        updated_at: new Date().toISOString()
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
          'new_program',
          program.description || ''
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
        .from('funding_opportunities')  // Using the existing table name
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
          userRegions.some((region: string) => program.region?.includes(region));
        
        // Match by category
        const categoryMatch = userCategories.length === 0 || 
          userCategories.some((category: string) => program.category?.includes(category) || program.sub_category?.includes(category));
        
        return regionMatch && categoryMatch;
      });
      
      // Create message queue entries for matching programs
      for (const program of matchingPrograms) {
        const result = await createMessageQueueEntry(
          user.user_id,
          program.id,
          program.title,
          program.pblanc_url || `https://yourdomain.com/programs/${program.id}`,
          'deadline',
          program.description || ''
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
 * Calculate exponential backoff time based on retry count
 * @param retryCount Number of previous retry attempts
 * @returns Delay in milliseconds before next retry
 */
function calculateBackoffTime(retryCount: number): number {
  const baseDelay = 60000; // 1 minute in milliseconds
  const maxDelay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  
  // Add jitter (±30%) to prevent thundering herd problem
  const jitter = delay * 0.3 * (Math.random() * 2 - 1);
  return delay + jitter;
}

/**
 * Process the message queue and send notifications
 * This would typically be called by a scheduled job
 */
export async function processMessageQueue(limit = 50): Promise<{ sent: number; failed: number; requeued: number }> {
  try {
    // Update status of messages that need to be retried based on backoff time
    const now = new Date().toISOString();
    await supabase.rpc('update_retry_messages', { current_time: now });
    
    // Get pending messages from the queue
    const { data: messages, error } = await supabase
      .from('message_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching message queue:', error);
      return { sent: 0, failed: 0, requeued: 0 };
    }
    
    let sent = 0;
    let failed = 0;
    let requeued = 0;
    
    // Set messages to 'processing' status in batch
    if (messages.length > 0) {
      const messageIds = messages.map(msg => msg.id);
      await supabase
        .from('message_queue')
        .update({ status: 'processing', updated_at: now })
        .in('id', messageIds);
    }
    
    // Process each message
    for (const message of messages) {
      try {
        // Send the notification
        const result = await sendKakaoNotification(
          message.user_id,
          message.content
        );
        
        if (result.success) {
          // Update message status to sent
          await supabase
            .from('message_queue')
            .update({
              status: 'sent',
              sent_at: now,
              updated_at: now
            })
            .eq('id', message.id);
          
          // Add to sent_notifications table
          if (message.content.programId) {
            await supabase
              .from('sent_notifications')
              .insert({
                user_id: message.user_id,
                opportunity_id: message.content.programId,
                frequency: message.content.messageType === 'new_program' ? 'new' : 'deadline',
                sent_at: now
              })
              .then(({ error }) => {
                if (error) {
                  console.error('Error logging sent notification:', error);
                }
              });
          }
          
          sent++;
        } else if (result.tokenExpired) {
          // Token expired - mark user's Kakao as unlinked
          await supabase
            .from('user_notification_settings')
            .update({ 
              kakao_linked: false,
              updated_at: now
            })
            .eq('user_id', message.user_id);
            
          // Update message status to failed
          await supabase
            .from('message_queue')
            .update({
              status: 'failed',
              error_message: 'Kakao token expired',
              updated_at: now
            })
            .eq('id', message.id);
            
          failed++;
        } else {
          // Handle regular failures with backoff
          const newRetryCount = message.retry_count + 1;
          const maxRetries = 5;
          
          if (newRetryCount >= maxRetries) {
            // Max retries reached, mark as permanently failed
            await supabase
              .from('message_queue')
              .update({
                status: 'failed',
                error_message: result.error || 'Failed after maximum retry attempts',
                retry_count: newRetryCount,
                updated_at: now
              })
              .eq('id', message.id);
              
            failed++;
          } else {
            // Set for retry with backoff
            const backoffTime = calculateBackoffTime(newRetryCount);
            const nextAttemptTime = new Date(Date.now() + backoffTime).toISOString();
            
            await supabase
              .from('message_queue')
              .update({
                status: 'pending',
                error_message: result.error,
                retry_count: newRetryCount,
                next_attempt_at: nextAttemptTime,
                updated_at: now
              })
              .eq('id', message.id);
              
            requeued++;
          }
        }
      } catch (error: any) {
        console.error(`Error processing message ${message.id}:`, error);
        
        // Update message status based on retry count
        const newRetryCount = message.retry_count + 1;
        const maxRetries = 5;
        
        if (newRetryCount >= maxRetries) {
          await supabase
            .from('message_queue')
            .update({
              status: 'failed',
              error_message: error.message,
              retry_count: newRetryCount,
              updated_at: now
            })
            .eq('id', message.id);
            
          failed++;
        } else {
          const backoffTime = calculateBackoffTime(newRetryCount);
          const nextAttemptTime = new Date(Date.now() + backoffTime).toISOString();
          
          await supabase
            .from('message_queue')
            .update({
              status: 'pending',
              error_message: error.message,
              retry_count: newRetryCount,
              next_attempt_at: nextAttemptTime,
              updated_at: now
            })
            .eq('id', message.id);
            
          requeued++;
        }
      }
    }
    
    return { sent, failed, requeued };
  } catch (error) {
    console.error('Error in processMessageQueue:', error);
    return { sent: 0, failed: 0, requeued: 0 };
  }
} 
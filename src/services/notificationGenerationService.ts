import { supabase } from './supabase';
import { GovSupportProgram } from '../types/governmentSupport';
import { MatchResult } from './notificationMatchingService';
import { createMessageQueueEntry } from './kakaoNotificationService';

/**
 * Interface for generated notification message
 */
export interface NotificationMessage {
  userId: string;
  programId: string;
  title: string;
  description: string;
  programUrl: string;
  messageType: 'new_program' | 'deadline';
}

/**
 * Interface for notification generation options
 */
export interface NotificationGenerationOptions {
  includeDescription?: boolean;       // Whether to include program description (default: true)
  maxDescriptionLength?: number;      // Max length for description (default: 100)
  includeProgramDetails?: boolean;    // Whether to include additional details like region/category (default: true)
  maxMessagesPerUser?: number;        // Maximum messages to generate per user (default: 5)
  highlightMatches?: boolean;         // Whether to highlight matched regions/categories (default: true)
}

/**
 * Generate formatted notification messages from match results
 * 
 * @param matches Match results from the matching service
 * @param options Options for notification generation
 * @returns Generated notification messages
 */
export async function generateNotifications(
  matches: MatchResult[],
  options: NotificationGenerationOptions = {}
): Promise<NotificationMessage[]> {
  try {
    // Set default options
    const {
      includeDescription = true,
      maxDescriptionLength = 100,
      includeProgramDetails = true,
      maxMessagesPerUser = 5,
      highlightMatches = true
    } = options;
    
    // Group matches by user to respect per-user limits
    const userMatches: Record<string, MatchResult[]> = {};
    
    for (const match of matches) {
      if (!userMatches[match.userId]) {
        userMatches[match.userId] = [];
      }
      
      userMatches[match.userId].push(match);
    }
    
    const notifications: NotificationMessage[] = [];
    
    // Process each user's matches
    for (const userId in userMatches) {
      // Sort by match score (highest first) and limit per user
      const topMatches = userMatches[userId]
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, maxMessagesPerUser);
      
      // Generate notification for each match
      for (const match of topMatches) {
        const { program, matchedRegions, matchedCategories, matchScore } = match;
        
        // Format program description
        let description = '';
        
        if (includeDescription && program.description) {
          description = program.description.length > maxDescriptionLength
            ? program.description.substring(0, maxDescriptionLength) + '...'
            : program.description;
        }
        
        // Add match details if requested
        if (includeProgramDetails) {
          const details = [];
          
          // Add region information
          const regionText = program.geographicRegions?.join(', ') || program.region || '전국';
          details.push(`지역: ${regionText}`);
          
          // Add support area/category
          if (program.supportArea) {
            details.push(`분야: ${program.supportArea}`);
          }
          
          // Add application deadline if available
          if (program.applicationDeadline) {
            details.push(`마감일: ${program.applicationDeadline}`);
          }
          
          // Add funding amount if available
          if (program.amount) {
            details.push(`지원금: ${program.amount}`);
          }
          
          // Append details to description
          if (details.length > 0) {
            description += description ? '\n\n' : '';
            description += details.join('\n');
          }
        }
        
        // Highlight matches if requested
        if (highlightMatches && (matchedRegions.length > 0 || matchedCategories.length > 0)) {
          description += description ? '\n\n' : '';
          description += '🔍 매칭 정보:';
          
          if (matchedRegions.length > 0) {
            description += `\n- 지역: ${matchedRegions.join(', ')}`;
          }
          
          if (matchedCategories.length > 0) {
            description += `\n- 분야: ${matchedCategories.join(', ')}`;
          }
          
          description += `\n- 매칭 점수: ${matchScore}점`;
        }
        
        // Create notification message
        notifications.push({
          userId: match.userId,
          programId: program.id,
          title: program.title,
          description,
          programUrl: program.applicationUrl || `https://www.bizinfo.go.kr/web/invest/detail/${program.id}`,
          messageType: 'new_program' // Default to new program, will be set properly when queuing
        });
      }
    }
    
    return notifications;
    
  } catch (error) {
    console.error('Error in generateNotifications:', error);
    return [];
  }
}

/**
 * Queue notifications to the message_queue table
 * 
 * @param notifications Notification messages to queue
 * @param messageType Type of notification ('new_program' or 'deadline')
 * @returns Result showing number of queued and failed messages
 */
export async function queueNotifications(
  notifications: NotificationMessage[],
  messageType: 'new_program' | 'deadline' = 'new_program'
): Promise<{ queued: number; failed: number }> {
  try {
    let queued = 0;
    let failed = 0;
    
    // Process each notification
    for (const notification of notifications) {
      // Force message type if specified
      const type = messageType || notification.messageType;
      
      // Create message queue entry
      const result = await createMessageQueueEntry(
        notification.userId,
        notification.programId,
        notification.title,
        notification.programUrl,
        type,
        notification.description
      );
      
      if (result.success) {
        queued++;
      } else {
        failed++;
        console.error('Failed to queue notification:', result.error);
      }
    }
    
    return { queued, failed };
    
  } catch (error) {
    console.error('Error in queueNotifications:', error);
    return { queued: 0, failed: notifications.length };
  }
}

/**
 * Complete workflow to generate and queue notifications from matches
 * 
 * @param matches Match results from matching service
 * @param messageType Type of notification ('new_program' or 'deadline')
 * @param options Options for notification generation
 * @returns Result showing number of generated and queued messages
 */
export async function processMatchesIntoNotifications(
  matches: MatchResult[],
  messageType: 'new_program' | 'deadline' = 'new_program',
  options: NotificationGenerationOptions = {}
): Promise<{ generated: number; queued: number; failed: number }> {
  try {
    // Skip if no matches
    if (!matches || matches.length === 0) {
      return { generated: 0, queued: 0, failed: 0 };
    }
    
    // Generate notifications
    const notifications = await generateNotifications(matches, options);
    
    // Skip if no notifications generated
    if (notifications.length === 0) {
      return { generated: 0, queued: 0, failed: 0 };
    }
    
    // Queue notifications
    const { queued, failed } = await queueNotifications(notifications, messageType);
    
    return {
      generated: notifications.length,
      queued,
      failed
    };
    
  } catch (error) {
    console.error('Error in processMatchesIntoNotifications:', error);
    return { generated: 0, queued: 0, failed: 0 };
  }
}

/**
 * Process matches grouped by users and convert them to notifications
 * 
 * @param matchesByUser Match results grouped by user ID
 * @param messageType Type of notification ('new_program' or 'deadline')
 * @param options Options for notification generation
 * @returns Result showing number of generated and queued messages
 */
export async function processGroupedMatchesIntoNotifications(
  matchesByUser: Record<string, MatchResult[]>,
  messageType: 'new_program' | 'deadline' = 'new_program',
  options: NotificationGenerationOptions = {}
): Promise<{ generated: number; queued: number; failed: number }> {
  try {
    let totalGenerated = 0;
    let totalQueued = 0;
    let totalFailed = 0;
    
    // Process each user's matches
    for (const userId in matchesByUser) {
      const matches = matchesByUser[userId];
      
      const result = await processMatchesIntoNotifications(
        matches,
        messageType,
        options
      );
      
      totalGenerated += result.generated;
      totalQueued += result.queued;
      totalFailed += result.failed;
    }
    
    return {
      generated: totalGenerated,
      queued: totalQueued,
      failed: totalFailed
    };
    
  } catch (error) {
    console.error('Error in processGroupedMatchesIntoNotifications:', error);
    return { generated: 0, queued: 0, failed: 0 };
  }
} 
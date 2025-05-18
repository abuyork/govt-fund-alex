import { supabase } from './supabase';
import { GovSupportProgram, SearchFilters } from '../types/governmentSupport';
import { searchSupportPrograms } from './governmentSupportService';
import { matchOpportunitiesWithUsers } from './notificationMatchingService';
import { processGroupedMatchesIntoNotifications, NotificationGenerationOptions } from './notificationGenerationService';
import { processMessageQueue } from './kakaoNotificationService';

/**
 * Interface for orchestration result metrics
 */
export interface OrchestrationResult {
  newOpportunities: number;
  matchesFound: number;
  notificationsGenerated: number;
  notificationsQueued: number;
  messagesSent: number;
  errors: number;
  timestamp: string;
  duration: number; // milliseconds
  warnings: string[];
}

/**
 * Interface for orchestration options
 */
export interface OrchestrationOptions {
  checkNewPrograms?: boolean;      // Whether to check for new programs (default: true)
  checkDeadlines?: boolean;        // Whether to check for deadlines (default: true)
  processMessageQueue?: boolean;   // Whether to process message queue (default: true)
  maxMessagesProcessed?: number;   // Maximum messages to process from queue (default: 50)
  notificationOptions?: NotificationGenerationOptions; // Options for notification generation
}

/**
 * Get the timestamp of the last check for new programs
 */
async function getLastCheckTimestamp(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'last_notification_check')
      .single();
      
    if (error || !data) {
      console.log('No previous check timestamp found, using null');
      return null;
    }
    
    return data.value;
    
  } catch (error) {
    console.error('Error getting last check timestamp:', error);
    return null;
  }
}

/**
 * Update the timestamp of the last check
 */
async function updateLastCheckTimestamp(timestamp: string): Promise<boolean> {
  try {
    // Check if system_settings table exists, create if not
    const { error: tableCheckError } = await supabase
      .from('system_settings')
      .select('count(*)')
      .limit(1)
      .single();
      
    if (tableCheckError && tableCheckError.code === 'PGRST116') {
      // Table likely doesn't exist, try to create it
      console.log('system_settings table may not exist, attempting to create...');
      const createResult = await supabase.rpc('create_system_settings_table');
      console.log('Create table result:', createResult);
    }
    
    // Use upsert to handle both insert and update cases
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'last_notification_check',
        value: timestamp,
        updated_at: timestamp
      });
      
    if (error) {
      console.error('Error updating last check timestamp:', error);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error in updateLastCheckTimestamp:', error);
    return false;
  }
}

/**
 * Fetch new funding opportunities since the last check
 */
async function fetchNewOpportunities(
  since: string | null
): Promise<{ programs: GovSupportProgram[]; errors: number }> {
  try {
    // Set up filters
    const filters: SearchFilters = { 
      thisWeekOnly: !since // Use thisWeekOnly only if no timestamp is provided
    };
    
    // Search for new programs
    const result = await searchSupportPrograms(filters, 1, 100);
    
    // If we have a timestamp, filter by announcement date
    let filteredPrograms = result.items;
    
    if (since) {
      const sinceDate = new Date(since);
      filteredPrograms = filteredPrograms.filter(program => {
        if (!program.announcementDate) return false;
        
        try {
          const programDate = new Date(program.announcementDate);
          return programDate > sinceDate;
        } catch (e) {
          console.warn(`Could not parse date: ${program.announcementDate}`, e);
          return false;
        }
      });
    }
    
    console.log(`Found ${filteredPrograms.length} new opportunities since ${since || 'initial check'}`);
    
    return { programs: filteredPrograms, errors: 0 };
    
  } catch (error) {
    console.error('Error fetching new opportunities:', error);
    return { programs: [], errors: 1 };
  }
}

/**
 * Fetch programs with upcoming deadlines
 */
async function fetchDeadlinePrograms(): Promise<{ programs: GovSupportProgram[]; errors: number }> {
  try {
    // Set up filters for ending soon programs
    const filters: SearchFilters = { endingSoon: true };
    
    // Search for programs with approaching deadlines
    const result = await searchSupportPrograms(filters, 1, 100);
    
    console.log(`Found ${result.items.length} programs with upcoming deadlines`);
    
    return { programs: result.items, errors: 0 };
    
  } catch (error) {
    console.error('Error fetching deadline programs:', error);
    return { programs: [], errors: 1 };
  }
}

/**
 * Main orchestration function for notification processing
 */
export async function orchestrateNotificationProcessing(
  options: OrchestrationOptions = {}
): Promise<OrchestrationResult> {
  // Track performance
  const startTime = Date.now();
  
  // Set default options
  const {
    checkNewPrograms = true,
    checkDeadlines = true,
    processMessageQueue: shouldProcessQueue = true,
    maxMessagesProcessed = 50,
    notificationOptions = {}
  } = options;
  
  // Initialize result metrics
  const result: OrchestrationResult = {
    newOpportunities: 0,
    matchesFound: 0,
    notificationsGenerated: 0,
    notificationsQueued: 0,
    messagesSent: 0,
    errors: 0,
    timestamp: new Date().toISOString(),
    duration: 0,
    warnings: []
  };
  
  try {
    // Step 1: Get last check timestamp
    const lastCheckTimestamp = await getLastCheckTimestamp();
    console.log(`Last check timestamp: ${lastCheckTimestamp || 'none'}`);
    
    // ---- Process New Programs ----
    if (checkNewPrograms) {
      console.log('Checking for new programs...');
      
      // Step 2: Fetch new opportunities
      const { programs: newPrograms, errors: fetchErrors } = await fetchNewOpportunities(lastCheckTimestamp);
      result.newOpportunities += newPrograms.length;
      result.errors += fetchErrors;
      
      if (newPrograms.length > 0) {
        // Step 3: Match with user preferences
        const newProgramMatches = await matchOpportunitiesWithUsers(newPrograms, 'new_program');
        
        // Calculate total matches
        let totalMatches = 0;
        for (const userId in newProgramMatches) {
          totalMatches += newProgramMatches[userId].length;
        }
        result.matchesFound += totalMatches;
        
        if (totalMatches > 0) {
          // Step 4: Generate and queue notifications
          const notificationResult = await processGroupedMatchesIntoNotifications(
            newProgramMatches,
            'new_program',
            notificationOptions
          );
          
          result.notificationsGenerated += notificationResult.generated;
          result.notificationsQueued += notificationResult.queued;
          result.errors += notificationResult.failed;
          
          console.log(`New programs processed: ${newPrograms.length}, matches: ${totalMatches}, notifications: ${notificationResult.queued}`);
        } else {
          console.log(`No user matches found for ${newPrograms.length} new programs`);
        }
      } else {
        console.log('No new programs found');
      }
    }
    
    // ---- Process Deadline Notifications ----
    if (checkDeadlines) {
      console.log('Checking for programs with upcoming deadlines...');
      
      // Step 5: Fetch programs with upcoming deadlines
      const { programs: deadlinePrograms, errors: deadlineErrors } = await fetchDeadlinePrograms();
      result.errors += deadlineErrors;
      
      if (deadlinePrograms.length > 0) {
        // Step 6: Match with user preferences for deadlines
        const deadlineMatches = await matchOpportunitiesWithUsers(deadlinePrograms, 'deadline');
        
        // Calculate total deadline matches
        let totalDeadlineMatches = 0;
        for (const userId in deadlineMatches) {
          totalDeadlineMatches += deadlineMatches[userId].length;
        }
        result.matchesFound += totalDeadlineMatches;
        
        if (totalDeadlineMatches > 0) {
          // Step 7: Generate and queue deadline notifications
          const deadlineResult = await processGroupedMatchesIntoNotifications(
            deadlineMatches,
            'deadline',
            notificationOptions
          );
          
          result.notificationsGenerated += deadlineResult.generated;
          result.notificationsQueued += deadlineResult.queued;
          result.errors += deadlineResult.failed;
          
          console.log(`Deadline programs processed: ${deadlinePrograms.length}, matches: ${totalDeadlineMatches}, notifications: ${deadlineResult.queued}`);
        } else {
          console.log(`No user matches found for ${deadlinePrograms.length} deadline programs`);
        }
      } else {
        console.log('No programs with upcoming deadlines found');
      }
    }
    
    // ---- Process Message Queue ----
    if (shouldProcessQueue) {
      console.log('Processing message queue...');
      
      // Step 8: Process message queue to send notifications
      const queueResult = await processMessageQueue(maxMessagesProcessed);
      result.messagesSent = queueResult.sent;
      result.errors += queueResult.failed;
      
      console.log(`Message queue processed: ${queueResult.sent} sent, ${queueResult.failed} failed, ${queueResult.requeued} requeued`);
    }
    
    // Step 9: Update last check timestamp
    const updateSuccess = await updateLastCheckTimestamp(result.timestamp);
    if (!updateSuccess) {
      result.warnings.push('Failed to update last check timestamp');
    }
    
  } catch (error) {
    console.error('Error in orchestrateNotificationProcessing:', error);
    result.errors += 1;
    result.warnings.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // Calculate duration
    result.duration = Date.now() - startTime;
    console.log(`Notification processing completed in ${result.duration}ms`);
  }
  
  return result;
}

/**
 * Function to create the system_settings table if it doesn't exist
 * This should be called during app initialization
 */
export async function initializeNotificationSystem(): Promise<boolean> {
  try {
    // Create system_settings table if it doesn't exist
    const createSystemSettingsResult = await supabase.rpc('create_system_settings_table');
    
    // Set initial values if needed
    if (!await getLastCheckTimestamp()) {
      const now = new Date().toISOString();
      await updateLastCheckTimestamp(now);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing notification system:', error);
    
    // Try direct SQL if RPC fails
    try {
      const { error: sqlError } = await supabase.rpc('create_system_settings_table_sql');
      if (sqlError) {
        console.error('Error with direct SQL initialization:', sqlError);
        return false;
      }
      return true;
    } catch (sqlError) {
      console.error('Failed to initialize with direct SQL:', sqlError);
      return false;
    }
  }
} 
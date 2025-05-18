import { 
  NotificationTask, 
  NotificationTaskType,
  getNextPendingTask, 
  updateTaskStatus,
  markTaskForRetry,
  createTask,
  getChildTasks
} from './notificationTaskService';
import { orchestrateNotificationProcessing, OrchestrationOptions } from './notificationOrchestrator';
import { supabase } from './supabase';
import { GovSupportProgram } from '../types/governmentSupport';
import { searchSupportPrograms } from './governmentSupportService';
import { matchOpportunitiesWithUsers } from './notificationMatchingService';
import { processGroupedMatchesIntoNotifications } from './notificationGenerationService';
import { processMessageQueue } from './kakaoNotificationService';

/**
 * Process a single task based on its type
 */
export async function processTask(task: NotificationTask): Promise<boolean> {
  try {
    // Mark task as processing
    await updateTaskStatus(task.id!, 'processing');
    
    // Process based on task type
    switch (task.task_type) {
      case 'init':
        return await processInitTask(task);
      case 'fetch':
        return await processFetchTask(task);
      case 'match':
        return await processMatchTask(task);
      case 'generate':
        return await processGenerateTask(task);
      case 'send':
        return await processSendTask(task);
      case 'cleanup':
        return await processCleanupTask(task);
      default:
        await updateTaskStatus(
          task.id!,
          'failed',
          {},
          `Unknown task type: ${task.task_type}`
        );
        return false;
    }
  } catch (error) {
    console.error(`Error processing task ${task.id} (${task.task_type}):`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await markTaskForRetry(task.id!, errorMessage);
    return false;
  }
}

/**
 * Process an init task - initializes a notification cycle
 */
async function processInitTask(task: NotificationTask): Promise<boolean> {
  try {
    const timestamp = new Date().toISOString();
    
    // Create a fetch task for new programs
    const fetchTask = await createTask(
      'fetch',
      {
        checkType: 'new',
        timestamp
      },
      task.id
    );
    
    // Create a fetch task for deadlines
    const deadlineTask = await createTask(
      'fetch',
      {
        checkType: 'deadline',
        timestamp
      },
      task.id
    );
    
    // Create a cleanup task
    const cleanupTask = await createTask(
      'cleanup',
      {
        daysToKeep: 7,
        timestamp
      },
      task.id
    );
    
    await updateTaskStatus(
      task.id!,
      'completed',
      {
        fetchTaskId: fetchTask?.id,
        deadlineTaskId: deadlineTask?.id,
        cleanupTaskId: cleanupTask?.id,
        timestamp
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error processing init task:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await markTaskForRetry(task.id!, errorMessage);
    return false;
  }
}

/**
 * Process a fetch task - fetches new opportunities or deadline programs
 */
async function processFetchTask(task: NotificationTask): Promise<boolean> {
  try {
    const { checkType, timestamp } = task.parameters || {};
    
    if (!checkType) {
      await updateTaskStatus(task.id!, 'failed', {}, 'Missing checkType parameter');
      return false;
    }
    
    let programs: GovSupportProgram[] = [];
    
    if (checkType === 'new') {
      // Get the timestamp of the last check
      const lastCheckTimestamp = await getLastCheckTimestamp();
      
      // Fetch new programs since the last check
      const { programs: newPrograms } = await fetchNewOpportunities(lastCheckTimestamp);
      programs = newPrograms;
      
      // Update the last check timestamp
      await updateLastCheckTimestamp(timestamp || new Date().toISOString());
      
    } else if (checkType === 'deadline') {
      // Fetch programs with upcoming deadlines
      const { programs: deadlinePrograms } = await fetchDeadlinePrograms();
      programs = deadlinePrograms;
    }
    
    // If we have programs, create a match task for each program
    if (programs.length > 0) {
      // Create a match task with the programs
      const matchTask = await createTask(
        'match',
        {
          programs,
          notificationType: checkType === 'new' ? 'new_program' : 'deadline',
          timestamp: timestamp || new Date().toISOString()
        },
        task.id
      );
      
      await updateTaskStatus(
        task.id!,
        'completed',
        {
          programCount: programs.length,
          matchTaskId: matchTask?.id,
          timestamp: new Date().toISOString()
        }
      );
    } else {
      // No programs found, just mark as completed
      await updateTaskStatus(
        task.id!,
        'completed',
        {
          programCount: 0,
          timestamp: new Date().toISOString()
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error processing fetch task:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await markTaskForRetry(task.id!, errorMessage);
    return false;
  }
}

/**
 * Process a match task - matches opportunities with users
 */
async function processMatchTask(task: NotificationTask): Promise<boolean> {
  try {
    const { programs, notificationType } = task.parameters || {};
    
    if (!programs || !notificationType) {
      await updateTaskStatus(task.id!, 'failed', {}, 'Missing parameters');
      return false;
    }
    
    // Match opportunities with users
    const matches = await matchOpportunitiesWithUsers(programs, notificationType);
    
    // Calculate total matches
    let totalMatches = 0;
    for (const userId in matches) {
      totalMatches += matches[userId].length;
    }
    
    if (totalMatches > 0) {
      // Create a generate task with the matches
      const generateTask = await createTask(
        'generate',
        {
          matches,
          notificationType,
          timestamp: new Date().toISOString()
        },
        task.id
      );
      
      await updateTaskStatus(
        task.id!,
        'completed',
        {
          matchCount: totalMatches,
          userCount: Object.keys(matches).length,
          generateTaskId: generateTask?.id,
          timestamp: new Date().toISOString()
        }
      );
    } else {
      // No matches found, just mark as completed
      await updateTaskStatus(
        task.id!,
        'completed',
        {
          matchCount: 0,
          userCount: 0,
          timestamp: new Date().toISOString()
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error processing match task:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await markTaskForRetry(task.id!, errorMessage);
    return false;
  }
}

/**
 * Process a generate task - generates notifications from matches
 */
async function processGenerateTask(task: NotificationTask): Promise<boolean> {
  try {
    const { matches, notificationType } = task.parameters || {};
    
    if (!matches || !notificationType) {
      await updateTaskStatus(task.id!, 'failed', {}, 'Missing parameters');
      return false;
    }
    
    // Generate notifications from matches
    const notificationResult = await processGroupedMatchesIntoNotifications(
      matches,
      notificationType
    );
    
    if (notificationResult.queued > 0) {
      // Create a send task to process the message queue
      const sendTask = await createTask(
        'send',
        {
          maxMessages: 50,
          timestamp: new Date().toISOString()
        },
        task.id
      );
      
      await updateTaskStatus(
        task.id!,
        'completed',
        {
          generatedCount: notificationResult.generated,
          queuedCount: notificationResult.queued,
          sendTaskId: sendTask?.id,
          timestamp: new Date().toISOString()
        }
      );
    } else {
      // No notifications queued, just mark as completed
      await updateTaskStatus(
        task.id!,
        'completed',
        {
          generatedCount: notificationResult.generated,
          queuedCount: notificationResult.queued,
          timestamp: new Date().toISOString()
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error processing generate task:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await markTaskForRetry(task.id!, errorMessage);
    return false;
  }
}

/**
 * Process a send task - processes the message queue
 */
async function processSendTask(task: NotificationTask): Promise<boolean> {
  try {
    const { maxMessages } = task.parameters || {};
    
    // Process the message queue
    const queueResult = await processMessageQueue(maxMessages || 50);
    
    await updateTaskStatus(
      task.id!,
      'completed',
      {
        sentCount: queueResult.sent,
        failedCount: queueResult.failed,
        requeuedCount: queueResult.requeued,
        timestamp: new Date().toISOString()
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error processing send task:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await markTaskForRetry(task.id!, errorMessage);
    return false;
  }
}

/**
 * Process a cleanup task - cleans up old tasks and records
 */
async function processCleanupTask(task: NotificationTask): Promise<boolean> {
  try {
    const { daysToKeep } = task.parameters || {};
    
    // Only keep the last 7 days of tasks by default
    const daysToKeepValue = daysToKeep || 7;
    
    // Clean up old tasks
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeepValue);
    
    // Delete old completed/failed/canceled tasks
    const { count: tasksDeleted } = await supabase
      .from('notification_tasks')
      .delete({ count: 'exact' })
      .lt('completed_at', cutoffDate.toISOString())
      .in('status', ['completed', 'failed', 'canceled'])
      .not('id', 'eq', task.id); // Don't delete the current task
    
    await updateTaskStatus(
      task.id!,
      'completed',
      {
        tasksDeleted: tasksDeleted || 0,
        timestamp: new Date().toISOString()
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error processing cleanup task:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await markTaskForRetry(task.id!, errorMessage);
    return false;
  }
}

/**
 * Get the timestamp of the last check from system_settings
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
    // We can reuse this function from notificationOrchestrator.ts
    // In a real implementation, consider refactoring to avoid duplication
    const filters = { thisWeekOnly: !since };
    const result = await searchSupportPrograms(filters, 1, 100);
    
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
    // We can reuse this function from notificationOrchestrator.ts
    const filters = { endingSoon: true };
    const result = await searchSupportPrograms(filters, 1, 100);
    
    return { programs: result.items, errors: 0 };
    
  } catch (error) {
    console.error('Error fetching deadline programs:', error);
    return { programs: [], errors: 1 };
  }
}

/**
 * Main function to process the next pending task
 * This is what edge functions will call
 */
export async function processNextTask(
  taskType?: NotificationTaskType
): Promise<{
  processed: boolean;
  taskId?: string;
  taskType?: string;
  error?: string;
}> {
  try {
    // Get the next pending task
    const task = await getNextPendingTask(taskType);
    
    if (!task) {
      return { 
        processed: false,
        error: taskType 
          ? `No pending tasks of type ${taskType}` 
          : 'No pending tasks' 
      };
    }
    
    // Process the task
    const success = await processTask(task);
    
    return {
      processed: success,
      taskId: task.id,
      taskType: task.task_type
    };
  } catch (error) {
    console.error('Error in processNextTask:', error);
    return {
      processed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 
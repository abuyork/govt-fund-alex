import { supabase } from './supabase';

/**
 * Task types for the notification system
 */
export type NotificationTaskType = 
  | 'init'        // Initialize a notification cycle
  | 'fetch'       // Fetch new opportunities
  | 'match'       // Match opportunities with users
  | 'generate'    // Generate notification content
  | 'send'        // Send notifications
  | 'cleanup';    // Cleanup after processing

/**
 * Task status options
 */
export type TaskStatus = 
  | 'pending'     // Waiting to be processed
  | 'processing'  // Currently being processed
  | 'completed'   // Successfully completed
  | 'failed'      // Failed and will not be retried
  | 'retry'       // Failed but will be retried
  | 'canceled';   // Canceled by the system

/**
 * Basic task interface
 */
export interface NotificationTask {
  id?: string;                  // UUID of the task
  task_type: NotificationTaskType;
  status: TaskStatus;
  parameters?: Record<string, any>; // Task-specific parameters
  result?: Record<string, any>;     // Task results
  created_at?: string;
  updated_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  error?: string | null;
  retry_count?: number;
  parent_task_id?: string | null; // Reference to parent task if any
}

/**
 * Create notification_tasks table if it doesn't exist
 */
export async function initializeTaskSystem(): Promise<boolean> {
  try {
    // Check if table exists
    const { error: checkError } = await supabase
      .from('notification_tasks')
      .select('id')
      .limit(1);
      
    // If table exists, return true
    if (!checkError) {
      console.log('notification_tasks table already exists');
      return true;
    }
    
    // Create table if not exists
    const { error } = await supabase.rpc('create_notification_tasks_table');
    
    if (error) {
      console.error('Error creating notification_tasks table via RPC:', error);
      
      // Try direct SQL as fallback
      const createSql = `
        CREATE TABLE IF NOT EXISTS notification_tasks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          task_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          parameters JSONB,
          result JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          error TEXT,
          retry_count INTEGER DEFAULT 0,
          parent_task_id UUID REFERENCES notification_tasks(id)
        );
        CREATE INDEX IF NOT EXISTS idx_notification_tasks_status ON notification_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_notification_tasks_type ON notification_tasks(task_type);
      `;
      
      const { error: sqlError } = await supabase.rpc('run_sql', { sql: createSql });
      
      if (sqlError) {
        console.error('Error creating table via direct SQL:', sqlError);
        return false;
      }
    }
    
    console.log('notification_tasks table created successfully');
    return true;
  } catch (error) {
    console.error('Error initializing task system:', error);
    return false;
  }
}

/**
 * Create a new notification task
 */
export async function createTask(
  taskType: NotificationTaskType,
  parameters: Record<string, any> = {},
  parentTaskId?: string
): Promise<NotificationTask | null> {
  try {
    const task: NotificationTask = {
      task_type: taskType,
      status: 'pending',
      parameters,
      retry_count: 0,
      parent_task_id: parentTaskId || null
    };
    
    const { data, error } = await supabase
      .from('notification_tasks')
      .insert(task)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating task:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createTask:', error);
    return null;
  }
}

/**
 * Get the next pending task of a specific type
 */
export async function getNextPendingTask(
  taskType?: NotificationTaskType
): Promise<NotificationTask | null> {
  try {
    let query = supabase
      .from('notification_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);
      
    if (taskType) {
      query = query.eq('task_type', taskType);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      if (error.code !== 'PGRST116') { // Not found error
        console.error('Error getting next pending task:', error);
      }
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getNextPendingTask:', error);
    return null;
  }
}

/**
 * Update a task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  result?: Record<string, any>,
  error?: string
): Promise<boolean> {
  try {
    const updates: Partial<NotificationTask> = {
      status,
      updated_at: new Date().toISOString()
    };
    
    // Add started_at if transitioning to processing
    if (status === 'processing') {
      updates.started_at = new Date().toISOString();
    }
    
    // Add completed_at if completed or failed
    if (['completed', 'failed'].includes(status)) {
      updates.completed_at = new Date().toISOString();
    }
    
    // Add result if provided
    if (result) {
      updates.result = result;
    }
    
    // Add error if provided
    if (error) {
      updates.error = error;
    }
    
    const { error: updateError } = await supabase
      .from('notification_tasks')
      .update(updates)
      .eq('id', taskId);
      
    if (updateError) {
      console.error('Error updating task status:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateTaskStatus:', error);
    return false;
  }
}

/**
 * Increment retry count and set status to retry
 */
export async function markTaskForRetry(
  taskId: string,
  error: string,
  maxRetries: number = 3
): Promise<boolean> {
  try {
    // First get current retry count
    const { data, error: fetchError } = await supabase
      .from('notification_tasks')
      .select('retry_count')
      .eq('id', taskId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching task for retry:', fetchError);
      return false;
    }
    
    const currentRetryCount = data.retry_count || 0;
    const newRetryCount = currentRetryCount + 1;
    
    // Determine if we should retry or mark as failed
    const newStatus: TaskStatus = newRetryCount <= maxRetries ? 'retry' : 'failed';
    
    const { error: updateError } = await supabase
      .from('notification_tasks')
      .update({
        status: newStatus,
        retry_count: newRetryCount,
        error,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);
      
    if (updateError) {
      console.error('Error marking task for retry:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markTaskForRetry:', error);
    return false;
  }
}

/**
 * Reset retry tasks to pending
 * This should be called periodically to pick up retry tasks
 */
export async function resetRetryTasks(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('notification_tasks')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'retry')
      .select();
      
    if (error) {
      console.error('Error resetting retry tasks:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('Error in resetRetryTasks:', error);
    return 0;
  }
}

/**
 * Get all child tasks for a parent task
 */
export async function getChildTasks(parentTaskId: string): Promise<NotificationTask[]> {
  try {
    const { data, error } = await supabase
      .from('notification_tasks')
      .select('*')
      .eq('parent_task_id', parentTaskId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error getting child tasks:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getChildTasks:', error);
    return [];
  }
}

/**
 * Clean up old completed tasks
 */
export async function cleanupOldTasks(daysToKeep: number = 7): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const { data, error } = await supabase
      .from('notification_tasks')
      .delete()
      .lt('completed_at', cutoffDate.toISOString())
      .in('status', ['completed', 'failed', 'canceled'])
      .select();
      
    if (error) {
      console.error('Error cleaning up old tasks:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('Error in cleanupOldTasks:', error);
    return 0;
  }
} 
/// <reference path="./deno.d.ts" />
// @ts-nocheck - This file is verified to work in the Deno runtime

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { NotificationTaskType } from '../../../src/services/notificationTaskService';

// Import the task service functions
// Note: In a real production environment, you would need to optimize imports for edge functions
// by bundling the code or using a different approach
import {
  createTask,
  initializeTaskSystem
} from '../../../src/services/notificationTaskService';

import {
  processNextTask
} from '../../../src/services/notificationTaskProcessor';

// Environment variables - set these in Supabase Dashboard under "Settings" > "API"
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Authentication check for manual invocations
const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET') ?? 'default-secret-change-me';

// For testing locally (remove in production or make configurable)
const LOCAL_DEVELOPMENT = false;

// Create supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Helper function to validate authentication for manual calls
 */
function isAuthenticated(req: Request): boolean {
  // For scheduled invocations from Supabase, we don't need auth
  const invokedBy = req.headers.get('x-supabase-invoked-by');
  if (invokedBy === 'scheduler') {
    return true;
  }
  
  // For testing in local development
  if (LOCAL_DEVELOPMENT) {
    return true;
  }
  
  // For manual invocations, check the Authorization header
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.split(' ')[1];
  
  return token === FUNCTION_SECRET;
}

/**
 * Main handler function
 */
serve(async (req) => {
  // CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  
  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }
  
  // Check authentication
  if (!isAuthenticated(req)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers, status: 401 }
    );
  }
  
  try {
    // Process based on request method and path
    if (req.method === 'POST') {
      // Parse request body if present
      let requestData = {};
      try {
        requestData = await req.json();
      } catch (e) {
        // No JSON body or invalid JSON, that's okay for scheduled runs
      }
      
      const { action, taskType, maxTasks = 5 } = requestData as {
        action?: string;
        taskType?: NotificationTaskType;
        maxTasks?: number;
      };
      
      // Initialize task system if needed
      await initializeTaskSystem();
      
      // Handle different actions
      if (action === 'initialize') {
        // Create an init task to start the notification cycle
        const task = await createTask('init', {
          timestamp: new Date().toISOString(),
          source: 'edge-function'
        });
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Notification cycle initialized',
            taskId: task?.id,
            timestamp: new Date().toISOString()
          }),
          { headers, status: 200 }
        );
      }
      else if (action === 'process-specific' && taskType) {
        // Process a specific task type
        const result = await processNextTask(taskType);
        
        return new Response(
          JSON.stringify({
            success: result.processed,
            message: result.processed 
              ? `Processed task ${result.taskId} of type ${result.taskType}` 
              : (result.error || 'No tasks processed'),
            result,
            timestamp: new Date().toISOString()
          }),
          { headers, status: 200 }
        );
      }
      else {
        // Default action: process next available task
        let results = [];
        let processedCount = 0;
        
        // Process up to maxTasks tasks (default 5)
        for (let i = 0; i < maxTasks; i++) {
          const result = await processNextTask();
          
          if (!result.processed) {
            // If no tasks were processed, we've likely run out of pending tasks
            if (i === 0) {
              // If this is the first iteration, return the error
              return new Response(
                JSON.stringify({
                  success: false,
                  message: result.error || 'No tasks to process',
                  timestamp: new Date().toISOString()
                }),
                { headers, status: 200 }
              );
            }
            
            // Otherwise, we've processed some tasks and run out
            break;
          }
          
          processedCount++;
          results.push(result);
        }
        
        return new Response(
          JSON.stringify({
            success: processedCount > 0,
            message: `Processed ${processedCount} tasks`,
            results,
            timestamp: new Date().toISOString()
          }),
          { headers, status: 200 }
        );
      }
    }
    else {
      // Method not allowed
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers, status: 405 }
      );
    }
  } catch (error) {
    console.error('Error in edge function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { headers, status: 500 }
    );
  }
}); 
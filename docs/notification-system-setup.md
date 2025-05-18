# Notification System Setup and Troubleshooting

This document provides step-by-step instructions for setting up and troubleshooting the KakaoTalk notification system.

## Overview

The notification system consists of several components:

1. **Database Tables**:
   - `message_queue`: Stores messages to be sent
   - `notification_tasks`: Manages the task workflow system
   - `system_settings`: Stores system-wide settings
   - `user_notification_settings`: Stores user preferences

2. **Edge Function**:
   - `process-notifications`: Handles task processing

3. **Scheduled Jobs**:
   - Initialization Job: Creates new tasks daily
   - Processing Job: Processes pending tasks regularly

## Setup Instructions

### 1. Deploy the Edge Function

Run the deployment script:

```bash
# Set your Supabase project reference
export SUPABASE_PROJECT_REF=your-project-ref

# Deploy the function
./scripts/deploy-notification-function.sh
```

### 2. Configure Function Environment Variables

In the Supabase Dashboard:

1. Go to **Settings** > **API**
2. Add the environment variable:
   - `FUNCTION_SECRET`: A secure random string (e.g., generate with `openssl rand -hex 32`)

### 3. Set Up Scheduled Jobs

In the Supabase Dashboard:

1. Go to **Edge Functions** and find `process-notifications`
2. Create two scheduled jobs:

   **a. Initialization Job (Daily at 1:00 AM UTC)**
   - Click "Schedule"
   - Cron Schedule: `0 1 * * *`
   - Payload:
     ```json
     {
       "action": "initialize"
     }
     ```

   **b. Processing Job (Every 15 minutes)**
   - Click "Schedule" 
   - Cron Schedule: `*/15 * * * *`
   - Payload:
     ```json
     {
       "maxTasks": 10
     }
     ```

### 4. Update Environment Variables

Make sure your `.env` file contains:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_ANON_PUBLIC_KEY=your-anon-key
SUPABASE_PROJECT_REF=your-project-ref
FUNCTION_SECRET=your-function-secret
```

## Testing the System

### 1. Test the Edge Function

Run the test script:

```bash
node scripts/test-notification-system.js
```

This will:
- Initialize the notification system
- Create tasks in the task queue
- Process those tasks

### 2. Monitor Tasks and Messages

Run the monitoring script:

```bash
node scripts/monitor-notification-tasks.js
```

### 3. Manually Process Notifications

To process pending notifications in the queue:

```bash
node scripts/process-pending-notifications.js
```

## Troubleshooting

### Message Queue Issues

1. **Pending Messages Not Sent**: 
   - Check if the Edge Function is deployed
   - Verify scheduled jobs are running
   - Run the processor script manually

2. **Token Expired**:
   - Check user KakaoTalk token status
   - Look for token expired errors in the message queue
   - Prompt users to reconnect their KakaoTalk account

### Task Processing Issues

1. **Tasks Stuck in Pending State**:
   - Check the Edge Function logs for errors
   - Verify the processing job is scheduled correctly
   - Manually trigger task processing

2. **Initialization Not Running**:
   - Verify the daily initialization job is scheduled
   - Check system_settings for last_notification_check

## Checking Logs

To view Edge Function logs:

1. Go to the Supabase Dashboard
2. Navigate to **Edge Functions**
3. Select `process-notifications`
4. Click on "Logs"

## Understanding Time Settings

Note that:
- All database timestamps are in UTC
- User notification times are stored in the user's local time
- When scheduling notifications, time zone conversions are applied

## Manual API Calls

To manually trigger the function via API:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/process-notifications" \
  -H "Authorization: Bearer your-function-secret" \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
``` 
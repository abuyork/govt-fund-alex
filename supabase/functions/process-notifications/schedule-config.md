# Notification Processing Scheduler Configuration

This document outlines how to configure the scheduled job for the notification processing system in Supabase.

## Overview

The notification processing system uses a task-based approach with the following components:

1. **Edge Function**: `process-notifications` - Processes notification tasks
2. **Database Table**: `notification_tasks` - Stores tasks and their status
3. **Scheduled Job**: Periodic trigger for the edge function

## Configuring the Scheduled Job

### 1. Deploy the Edge Function

First, deploy the edge function to your Supabase project:

```bash
supabase functions deploy process-notifications --project-ref your-project-ref
```

### 2. Set Environment Variables

Set the following environment variables in the Supabase Dashboard under "Settings" > "API":

- `FUNCTION_SECRET`: A secure random string to authenticate manual API calls
- Any other environment variables needed by your application

The following variables are automatically provided:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure Scheduled Jobs

In the Supabase Dashboard, navigate to "Edge Functions" and find the `process-notifications` function.

#### a. Initialization Job (Daily)

This job initializes a new notification cycle:

- Click "Schedule" on your function
- Set the cron schedule to run daily (e.g., `0 1 * * *` for 1:00 AM UTC)
- Set the Payload to:
  ```json
  {
    "action": "initialize"
  }
  ```
- Save the schedule

#### b. Processing Job (Every 15 Minutes)

This job processes pending tasks:

- Click "Schedule" again
- Set the cron schedule to run every 15 minutes (e.g., `*/15 * * * *`)
- Set the Payload to:
  ```json
  {
    "maxTasks": 10
  }
  ```
- Save the schedule

## Testing

You can manually trigger the function using cURL:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/process-notifications" \
  -H "Authorization: Bearer your-function-secret" \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
```

## Monitoring

Monitor the notification process through:

1. **Supabase Dashboard**: Check Edge Function logs
2. **Database**: Query the `notification_tasks` table to see task status and results

Example query to check task status:

```sql
SELECT task_type, status, COUNT(*) 
FROM notification_tasks 
GROUP BY task_type, status 
ORDER BY task_type, status;
```

## Troubleshooting

If tasks are not being processed:

1. Check Edge Function logs for errors
2. Verify the scheduled jobs are running
3. Check the `notification_tasks` table for tasks with 'failed' status
4. Run a manual initialization to test the system 
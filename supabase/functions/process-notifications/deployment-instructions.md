# Deployment Instructions for Notification System

## 1. SQL Migration Setup ✅
The database tables and functions have been successfully created using the migration:
- `notification_tasks` table for task queuing
- `system_settings` table for global settings
- `reset_retry_tasks()` function for task management

## 2. Edge Function Deployment ✅
The `process-notifications` Edge Function has been successfully deployed to the project.

## 3. Final Configuration Steps (Manual)

### 3.1 Set Environment Variables
In the Supabase Dashboard, navigate to "Project Settings" > "API" and set:

```
FUNCTION_SECRET=your-secure-random-string
```

### 3.2 Configure Scheduled Jobs
In the Supabase Dashboard, navigate to "Edge Functions" > "process-notifications":

#### a. Initialization Job (Daily)
1. Click "Schedule" on your function
2. Set the cron schedule: `0 1 * * *` (1:00 AM UTC daily)
3. Set the Payload to:
   ```json
   {
     "action": "initialize"
   }
   ```
4. Save the schedule

#### b. Processing Job (Every 15 Minutes)
1. Click "Schedule" again
2. Set the cron schedule: `*/15 * * * *`
3. Set the Payload to:
   ```json
   {}
   ```
4. Save the schedule

## 4. Testing the Deployment

### 4.1 Manual Function Test
Use this curl command to manually test the notification initialization:

```bash
curl -X POST "https://gykujxuuemhcxsqeejmj.supabase.co/functions/v1/process-notifications" \
  -H "Authorization: Bearer your-function-secret" \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
```

### 4.2 Verify Task Creation
Check the database for created tasks:

```sql
SELECT task_type, status, created_at, updated_at 
FROM notification_tasks
ORDER BY created_at DESC
LIMIT 10;
```

## 5. Monitoring
Monitor the system using Edge Function logs and database queries:

```sql
-- Check task status distribution
SELECT task_type, status, COUNT(*) 
FROM notification_tasks 
GROUP BY task_type, status 
ORDER BY task_type, status;

-- Check any failed tasks
SELECT * FROM notification_tasks
WHERE status = 'failed'
ORDER BY updated_at DESC;
```

## Completion Status
- [x] Database schema created
- [x] Edge Function deployed
- [ ] Environment variables set
- [ ] Scheduled jobs configured
- [ ] Initial test performed 
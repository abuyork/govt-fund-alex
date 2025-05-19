# Setting Up Time-Based Notifications in Supabase

This document provides instructions for setting up and troubleshooting the time-based notification system.

## Overview

The time-based notification system allows sending notifications to users at their preferred time of day. It works by:

1. Edge function checks for users with matching notification time
2. Creates tasks to send notifications to those users
3. Processes those tasks through the task queue system

## Configuration Steps

### 1. Verify the getUsersToNotifyAtTime Function

Ensure that the `getUsersToNotifyAtTime` function exists in `src/services/userNotificationService.ts` and returns users with the correct time preference.

### 2. Set Up Scheduled Jobs in Supabase

1. Log in to the Supabase Dashboard
2. Navigate to "Edge Functions"
3. Find the "process-notifications" function
4. Click on "Schedules" tab (or "Schedule" button)
5. Create the following schedules:

#### Hourly Schedule (On the Hour)
- **Cron Schedule**: `0 * * * *` (runs at minute 0 of every hour)
- **Payload**:
  ```json
  {
    "action": "time-check"
  }
  ```

#### Hourly Schedule (Half Hour)
- **Cron Schedule**: `30 * * * *` (runs at minute 30 of every hour)
- **Payload**:
  ```json
  {
    "action": "time-check"
  }
  ```

#### (Optional) For More Precise Timing
- **Cron Schedule**: `15 * * * *` (runs at minute 15 of every hour)
- **Cron Schedule**: `45 * * * *` (runs at minute 45 of every hour)
- Same payload as above

### 3. Test the Function

You can test the time-based notification system using the `testTimeBasedNotification` function:

```typescript
import { testTimeBasedNotification } from './services/notificationTestService';

// Test with current time
const result = await testTimeBasedNotification();
console.log(result);

// Test with specific time (e.g., 9:00 AM)
const specificResult = await testTimeBasedNotification(9, 0);
console.log(specificResult);
```

## Troubleshooting

### Check Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to "Edge Functions" > "process-notifications"
3. Click "Logs" to see recent execution logs
4. Look for logs related to the time-check action

### Check User Settings
1. Verify that users have:
   - `notification_time` set correctly (format: "HH:MM")
   - `kakao_linked` set to true
   - At least one of `new_programs_alert` or `deadline_notification` set to true

### Common Issues
1. **Time Zone Differences**: The edge function uses UTC time by default, make sure the times match your users' expectations
2. **Database Format**: Ensure the time format matches exactly ("HH:MM")
3. **Missing Permissions**: The edge function needs permission to access the database tables
4. **No Users Found**: Double-check that users have the correct notification settings

### Testing a Specific User
You can check if a specific user is eligible for time-based notifications:

```typescript
import { checkUserNotificationTime } from './services/notificationTestService';

const userCheck = await checkUserNotificationTime('user-id-here');
console.log(userCheck);
```

## Monitoring

Once the system is set up, monitor the following:

1. **Edge Function Execution**: Check logs to ensure the function is running at scheduled times
2. **Task Creation**: Verify that tasks are being created for users with matching notification times
3. **Message Queue**: Check that messages are being queued and sent to eligible users
4. **User Feedback**: Get feedback from users on whether they are receiving notifications at their preferred times 
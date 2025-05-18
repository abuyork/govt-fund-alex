# KakaoTalk Alert Notification System - Manual Testing Guide

This document provides step-by-step instructions for manually testing the KakaoTalk alert notification system after implementation.

## Prerequisites

- A Supabase project with all required tables:
  - `user_notification_settings`
  - `funding_opportunities`
  - `sent_notifications`
  - `message_queue`
  - `notification_tasks`
  - `system_settings`
- A KakaoTalk developer account with access to the Messaging API
- At least one test user with a linked KakaoTalk account

## Test Cases

### 1. Notification Settings Configuration

**Objective**: Verify that users can configure their notification preferences through the UI.

**Steps**:
1. Log in to the application
2. Navigate to Dashboard → Notification Settings
3. Configure the following settings:
   - Toggle KakaoTalk Notifications ON
   - Select at least one region (e.g., "서울")
   - Select at least one category (e.g., "기술개발")
   - Set notification frequency (e.g., "Daily")
   - Choose notification time
4. Save settings

**Expected Result**:
- Settings should be saved to the database
- The UI should reflect the saved settings on reload
- Check the `user_notification_settings` table to confirm data is stored correctly

### 2. KakaoTalk Connection

**Objective**: Verify that users can connect their KakaoTalk account.

**Steps**:
1. From Notification Settings page, click "Connect KakaoTalk"
2. Complete the OAuth flow in the popup window
3. Return to the application

**Expected Result**:
- The UI should show "Connected" status with token expiration information
- The `kakao_token` and `kakao_linked` fields should be updated in the database
- The connection status should persist across sessions

### 3. Manual Notification Trigger

**Objective**: Verify that notifications can be manually triggered and sent to KakaoTalk.

**Steps**:
1. Ensure there is at least one funding opportunity in the database that matches your notification preferences
2. Use the Edge Function's manual trigger endpoint:
   ```
   curl -X POST https://[your-project-id].supabase.co/functions/v1/process-notifications \
     -H "Authorization: Bearer FUNCTION_SECRET" \
     -d '{"action": "initialize"}'
   ```
3. Check your KakaoTalk app for notifications

**Expected Result**:
- The system should identify matching programs
- A KakaoTalk message should be received with program details
- The `sent_notifications` table should record the notification
- The `message_queue` table should show the message as "sent"

### 4. Scheduled Job Execution

**Objective**: Verify that scheduled notifications work properly.

**Steps**:
1. Configure the scheduled job as per instructions in `schedule-config.md`
2. Add a new funding opportunity that matches your preferences (or wait for the system's daily check)
3. Wait for the scheduled job to run at its configured time

**Expected Result**:
- A KakaoTalk message should be received when the job runs
- Logs should show successful execution of the task
- The `system_settings` table should update the `last_notification_check` field

### 5. Duplicate Prevention

**Objective**: Verify that the system doesn't send duplicate notifications.

**Steps**:
1. Manually trigger a notification for a program that was already sent
2. Check the logs and database

**Expected Result**:
- No duplicate notification should be sent
- The `sent_notifications` table should prevent duplicates
- The system logs should indicate that the notification was skipped as it was already sent

### 6. Error Handling and Retry

**Objective**: Verify that the system handles errors and retries failed operations.

**Steps**:
1. Simulate a failure by temporarily revoking KakaoTalk permissions
2. Trigger a notification
3. Restore permissions
4. Check the system after a few minutes

**Expected Result**:
- The message should initially fail
- The `message_queue` table should mark it as "failed" or "retry"
- The system should retry sending the notification
- After permissions are restored, the notification should be sent successfully

## Troubleshooting

If tests fail, check the following:

1. **Database Connectivity**:
   - Verify that all tables exist and have the correct schema
   - Check that Supabase connection is working

2. **KakaoTalk API**:
   - Verify that your tokens are valid and not expired
   - Check for rate limiting issues

3. **Logging**:
   - Check server logs for error messages
   - Review Edge Function logs in the Supabase dashboard

4. **Task System**:
   - Verify that tasks are being created correctly
   - Check for failed tasks in the `notification_tasks` table

## Test Recording

Use the table below to record test results:

| Test Case                      | Date       | Result (Pass/Fail) | Notes                 |
|--------------------------------|------------|--------------------|-----------------------|
| Notification Settings Config   |            |                    |                       |
| KakaoTalk Connection           |            |                    |                       |
| Manual Notification Trigger    |            |                    |                       |
| Scheduled Job Execution        |            |                    |                       |
| Duplicate Prevention           |            |                    |                       |
| Error Handling and Retry       |            |                    |                       |

## Next Steps

After completing all tests:

1. Document any issues found
2. Create tickets for fixes if needed
3. Schedule regular monitoring of the notification system
4. Update documentation based on findings 
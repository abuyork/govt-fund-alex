# KakaoTalk Alert Notification Feature: Implementation Plan (Finalized)

## 1. Feature Overview

When a user configures their alert settings (selecting categories of interest like "Regions" and "Support Fields"), the system should monitor for new government funding opportunities. If a new fund matches the user's selected categories, a KakaoTalk message containing the fund's title and a short description should be sent to the user.

**Status:** After comprehensive database analysis of the AI BIZPLAN project, we found several necessary tables already exist. The implementation will build on this foundation.

## 2. High-Level Architecture

*   **Backend Services (Existing & To Complete):**
    *   `governmentSupportService.ts` - Already handles fetching fund data
    *   `kakaoNotificationService.ts` - Has placeholder functions for notifications
    *   `userNotificationService.ts` - Handles user preferences for notifications
*   **Database (Supabase):**
    *   `user_notification_settings` - **EXISTING** (with kakao_token, regions, categories)
    *   `funding_opportunities` - **EXISTING** (storing government fund information)
    *   `sent_notifications` - **EXISTING** (tracking which notifications have been sent)
    *   `message_queue` - **NEEDS TO BE CREATED** (for reliable message delivery)
*   **Scheduled Task:** Implementation needed to trigger notification processing
*   **Frontend Enhancements:** Completing and refining existing UI

## 3. Implementation Tasks (Optimized Sequence)

### Phase I: Foundation and Core Services

**Task 1: Analyze Existing Implementation**
*   **File(s) Involved:** `src/services/kakaoNotificationService.ts`, `src/services/userNotificationService.ts`, `src/pages/dashboard/NotificationSettings.tsx`
*   **Status:** **NEW**
*   **Priority:** Critical (understand current implementation first)
*   **Sub-tasks:**
    *   **1.1** Review existing user notification settings management:
        - Analyze how user preferences are saved to `user_notification_settings`
        - Confirm the structure of regions and categories data
    *   **1.2** Document KakaoTalk integration points:
        - Identify how kakao_token is obtained and stored
        - Map out the message sending flow
    *   **1.3** Analyze existing funding opportunities management:
        - Understand how funding data is fetched and stored in `funding_opportunities`
        - Document the current data structure and fields

**Task 2: Create Message Queue Table**
*   **File(s) Involved:** Supabase SQL editor
*   **Status:** **NEW**
*   **Priority:** High (needed for reliable message delivery)
*   **Sub-tasks:**
    *   **2.1** Create the `message_queue` table:
        ```sql
        CREATE TABLE IF NOT EXISTS message_queue (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id),
          message_type TEXT NOT NULL,
          content JSONB NOT NULL,
          status TEXT DEFAULT 'pending',
          retry_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          sent_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status);
        CREATE INDEX IF NOT EXISTS idx_message_queue_user_id ON message_queue(user_id);
        ```

**Task 3: Implement Message Queue Processing**
*   **File(s) Involved:** `src/services/kakaoNotificationService.ts`
*   **Status:** **NEW/ENHANCEMENT**
*   **Priority:** High (core functionality)
*   **Sub-tasks:**
    *   **3.1** Implement or enhance `sendKakaoNotification()`:
        - Ensure proper authentication with user's `kakao_token` from `user_notification_settings`
        - Format message with appropriate template
        - Add proper error handling for token expiration
    *   **3.2** Implement `processMessageQueue()` function:
        - Fetch pending messages from message_queue
        - Process messages in batches
        - Update message status after processing
    *   **3.3** Add retry logic:
        - Handle failed messages with exponential backoff
        - Update retry_count and status
        - Move to "failed" status after maximum retries

### Phase II: Matching and Notification Logic

**Task 4: Implement Notification Matching Logic**
*   **File(s) Involved:** New file `src/services/notificationMatchingService.ts`
*   **Status:** **NEW**
*   **Priority:** High
*   **Sub-tasks:**
    *   **4.1** Create function to match user preferences with funding opportunities:
        ```typescript
        export async function matchUserPreferencesWithOpportunities(
          userId: string,
          opportunities: FundingOpportunity[],
          settings?: UserNotificationSettings
        ): Promise<MatchResult[]> {
          // Implementation here
        }
        ```
    *   **4.2** Implement region and category matching:
        - Match user regions preferences against opportunity regions
        - Match user categories against opportunity categories
        - Implement scoring algorithm for partial matches
    *   **4.3** Add function to check against sent notifications:
        - Query `sent_notifications` to avoid duplicate notifications
        - Create record in `sent_notifications` when match is found

**Task 5: Create Notification Generation Service**
*   **File(s) Involved:** New file `src/services/notificationGenerationService.ts`
*   **Status:** **NEW**
*   **Priority:** High
*   **Sub-tasks:**
    *   **5.1** Create function to generate notification content:
        ```typescript
        export async function generateNotifications(
          matches: MatchResult[]
        ): Promise<NotificationMessage[]> {
          // Implementation here
        }
        ```
    *   **5.2** Implement message template rendering:
        - Format opportunity details into user-friendly messages
        - Include relevant details (title, deadline, funding amount)
        - Support localization (Korean language)
    *   **5.3** Add function to queue messages:
        - Insert records into `message_queue` table
        - Batch operations for performance

### Phase III: Orchestration and Scheduling

**Task 6: Create Orchestration Function**
*   **File(s) Involved:** New file `src/services/notificationOrchestrator.ts`
*   **Status:** **NEW**
*   **Priority:** Medium
*   **Sub-tasks:**
    *   **6.1** Create main orchestrator function:
        ```typescript
        export async function orchestrateNotificationProcessing(): Promise<{ 
          newOpportunities: number; 
          matchesFound: number;
          messagesSent: number; 
          errors: number 
        }> {
          // Implementation here
        }
        ```
    *   **6.2** Implement workflow orchestration:
        - Get timestamp of last check
        - Query `funding_opportunities` for new programs since last check
        - Match with user preferences
        - Generate notifications
        - Process message queue
    *   **6.3** Add comprehensive error handling:
        - Implement try/catch blocks at each stage
        - Log errors to monitoring system
        - Continue processing even if one stage fails

**Task 7: Create Scheduled Job**
*   **Implementation:** Supabase Edge Function
*   **Status:** **NEW**
*   **Priority:** Medium
*   **Sub-tasks:**
    *   **7.1** Create Supabase Edge Function:
        - Create `supabase/functions/process-notifications/index.ts`
        - Implement authentication and security checks
        - Call the orchestrator function
    *   **7.2** Set up cron schedule via Supabase dashboard:
        - Configure to run at appropriate intervals (daily/hourly)
        - Set up error notifications and monitoring
        *   **7.3** Implement a manual trigger endpoint (optional):
        - Create API endpoint to manually trigger processing
        - Add authentication and rate limiting

### Phase IV: Frontend Enhancements and Testing

**Task 8: Enhance Alert Preferences UI**
*   **File(s) Involved:** `src/pages/dashboard/NotificationSettings.tsx`
*   **Status:** **ENHANCEMENT**
*   **Priority:** Medium
*   **Sub-tasks:**
    *   **8.1** Improve region and category selection UI:
        - Implement multi-select dropdown with search
        - Add clear visual feedback for selections
        - Ensure proper saving to user_notification_settings
    *   **8.2** Implement KakaoTalk connection status:
        - Show connection status
        - Add "Connect to KakaoTalk" button
        - Provide reconnection flow if token expires
    *   **8.3** Add notification frequency controls:
        - Allow selection of notification frequency
        - Provide appropriate UI feedback

**Task 9: Comprehensive Testing**
*   **Status:** **NEW**
*   **Priority:** Critical
*   **Sub-tasks:**
    *   **9.1** Create unit tests:
        - Test matching algorithm
        - Test message generation
        - Test queue processing
    *   **9.2** Implement integration tests:
        - End-to-end notification flow
        - Test with actual database connections
        - Mock KakaoTalk API for reliable testing
    *   **9.3** Perform manual testing:
        - Test UI interactions
        - Test actual KakaoTalk message delivery
        - Test scheduled job execution

## 4. Dependencies and Task Order

```
Task 1 → Task 2 → Task 3 → Task 5
   ↓       ↓
Task 4 ----→----→ Task 6 → Task 7
                    ↑
Task 8 ------------→
   ↓
Task 9
```

This refined sequence ensures that:
1. We first understand the existing implementation (Task 1)
2. Database foundation is laid early (Task 2)
3. Core services are built in parallel where possible (Tasks 3, 4)
4. Integration and orchestration follow (Tasks 5, 6, 7)
5. UI enhancements can proceed in parallel (Task 8)
6. Testing is comprehensive and concludes the project (Task 9)

## 5. Implementation Notes

* The KakaoTalk token has a limited lifespan and may need refresh mechanisms
* Consider rate limits for both the funding opportunities API and Kakao API
* Performance considerations:
  * Batch processing for message queue
  * Limit number of notifications per user per day
  * Efficient matching algorithm to scale with user base
* Use transaction blocks for data consistency in multi-step operations
* The existing `user_notification_settings` table already has columns for `kakao_linked`, `kakao_token`, `regions`, and `categories` that can be used directly

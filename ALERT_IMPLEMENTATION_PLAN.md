# KakaoTalk Alert Notification Feature: Implementation Plan (Optimized)

## 1. Feature Overview

When a user configures their alert settings (selecting categories of interest like "Regions" and "Support Fields"), the system should monitor for new government funding opportunities. If a new fund matches the user's selected categories, a KakaoTalk message containing the fund's title and a short description should be sent to the user.

**Status:** Many components are partially implemented but need to be completed and connected. This plan organizes tasks in optimal sequence based on dependencies.

## 2. High-Level Architecture

*   **Backend Services (Existing & To Complete):**
    *   `governmentSupportService.ts` - Already handles fetching fund data
    *   `kakaoNotificationService.ts` - Has placeholder functions for notifications
    *   New database table for tracking processed funds
*   **Database (Supabase):**
    *   `user_notification_settings` - Existing
    *   `message_queue` - Existing
    *   `government_programs` - Existing
    *   `processed_funds` - New table needed
*   **Scheduled Task:** Implementation needed to trigger notification processing
*   **Frontend Enhancements:** Completing and refining existing UI

## 3. Implementation Tasks (Optimized Sequence)

### Phase I: Database and Core Backend Services

**Task 1: Create Processed Funds Tracking Table**
*   **File(s) Involved:** Supabase SQL editor
*   **Status:** **NEW**
*   **Priority:** High (foundation for notification system)
*   **Sub-tasks:**
    *   **1.1** Design the `processed_funds` table schema:
        ```sql
        CREATE TABLE IF NOT EXISTS processed_funds (
          fund_id TEXT PRIMARY KEY,
          processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          notification_type TEXT NOT NULL, -- 'new_program' or 'deadline'
          created_by TEXT
        );
        ```
    *   **1.2** Create appropriate indexes:
        ```sql
        CREATE INDEX IF NOT EXISTS idx_processed_funds_processed_at ON processed_funds(processed_at);
        ```
    *   **1.3** Add RPC function for checking if a fund has been processed:
        ```sql
        CREATE OR REPLACE FUNCTION has_fund_been_processed(fund_id_param TEXT, notification_type_param TEXT)
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM processed_funds 
            WHERE fund_id = fund_id_param 
            AND notification_type = notification_type_param
          );
        END;
        $$ LANGUAGE plpgsql;
        ```

**Task 2: Activate KakaoTalk Message Sending**
*   **File(s) Involved:** `src/services/kakaoNotificationService.ts`
*   **Status:** **PARTIALLY EXISTING**, needs activation
*   **Priority:** High (core functionality)
*   **Sub-tasks:**
    *   **2.1** Uncomment and update the Kakao API call in `sendKakaoNotification()`:
        - Ensure proper authentication with the user's `kakao_token`
        - Format message with appropriate template
        - Add proper error handling
    *   **2.2** Enhance error handling for token expiration:
        - Add logic to detect expired tokens
        - Update user settings if token is invalid
    *   **2.3** Implement retries in `processMessageQueue()`:
        - Add logic to retry failed messages with backoff
        - Limit maximum retry attempts

**Task 3: Enhance Fund Fetch and Program Match Service**
*   **File(s) Involved:** `src/services/governmentSupportService.ts` and `src/services/kakaoNotificationService.ts`
*   **Status:** **PARTIALLY EXISTING**, needs updates
*   **Priority:** High
*   **Sub-tasks:**
    *   **3.1** Update `processNewProgramMatches()` to check against processed_funds:
        - Add Supabase query to check processed status before creating notifications
        - Add records to processed_funds after creating notifications
    *   **3.2** Create a fetch function specifically for new programs:
        - Add parameter for "since last check" timestamp
        - Integrate with existing `searchSupportPrograms()`
    *   **3.3** Improve matching algorithm efficiency:
        - Batch database operations
        - Optimize region and category filtering

### Phase II: Integration and Orchestration

**Task 4: Create Orchestration Function**
*   **File(s) Involved:** New file `src/services/notificationOrchestrator.ts`
*   **Status:** **NEW**
*   **Priority:** Medium
*   **Sub-tasks:**
    *   **4.1** Create main orchestrator function:
        ```typescript
        export async function orchestrateNotificationProcessing(): Promise<{ 
          newPrograms: number; 
          deadlineAlerts: number; 
          messagesSent: number; 
          errors: number 
        }> {
          // Implementation here
        }
        ```
    *   **4.2** Implement logic to fetch new programs:
        - Get timestamp of last check
        - Call governmentSupportService to get new programs
        - Filter already processed programs
    *   **4.3** Implement end-to-end orchestration sequence:
        - Process new programs
        - Process deadline notifications
        - Process message queue
        - Update last checked timestamp
        - Return comprehensive results

**Task 5: Implement Comprehensive Error Handling and Logging**
*   **File(s) Involved:** All notification services
*   **Status:** **ENHANCEMENT NEEDED**
*   **Priority:** Medium
*   **Sub-tasks:**
    *   **5.1** Create centralized error logging:
        - Create dedicated logging service or enhance existing
        - Log to Supabase table for persistence
    *   **5.2** Add detailed error handling in all critical functions:
        - Fund fetching errors
        - Matching errors
        - Message queue errors
        - API call errors
    *   **5.3** Implement monitoring hooks:
        - Track success/failure rates
        - Record performance metrics

**Task 6: Create Scheduler for Notification Processing**
*   **Implementation:** Supabase Scheduled Function
*   **Status:** **NEW**
*   **Priority:** Medium
*   **Sub-tasks:**
    *   **6.1** Create Supabase Edge Function:
        - Create `supabase/functions/process-notifications/index.ts`
        - Implement authentication and authorization
    *   **6.2** Implement the scheduled function logic:
        - Call the orchestrator function
        - Handle and log any errors
    *   **6.3** Set up schedule via Supabase dashboard:
        - Configure to run every 30 minutes
        - Set up error notifications

### Phase III: Frontend Enhancements and Testing

**Task 7: Finalize Alert Preferences UI**
*   **File(s) Involved:** `src/pages/dashboard/NotificationSettings.tsx`
*   **Status:** **PARTIALLY EXISTING**, needs completion
*   **Priority:** Medium
*   **Sub-tasks:**
    *   **7.1** Enhance region and industry selection UI:
        - Implement multi-select dropdown with search
        - Add clear visual feedback for selections
    *   **7.2** Implement "Manage Alert Subscription" modal:
        - Create modal component
        - Show subscription status and expiration
        - Add payment integration UI if required
    *   **7.3** Improve user feedback:
        - Add clear success/failure messages
        - Show pending changes indicators

**Task 8: Comprehensive Testing**
*   **Status:** **NEW**
*   **Priority:** High
*   **Sub-tasks:**
    *   **8.1** Implement unit tests:
        - Test KakaoTalk message formatting
        - Test matching algorithms
        - Test processed_funds logic
    *   **8.2** Create integration tests:
        - Test end-to-end notification flow
        - Test with mocked API responses
    *   **8.3** Perform manual testing:
        - Verify UI interactions
        - Test actual KakaoTalk message delivery
        - Test scheduler functionality

## 4. Dependencies and Task Order

```
Task 1 → Task 2, Task 3 → Task 4 → Task 5 → Task 6
       ↘                          ↗
          Task 7 ---------------→
             ↓
          Task 8
```

This sequence ensures that:
1. Foundation (database table) is created first
2. Core services are activated next
3. Integration happens once individual components work
4. Frontend refinements happen in parallel where possible
5. Testing occurs throughout but comprehensively at the end

## 5. Implementation Notes

* Use Supabase transactions where possible to ensure data consistency
* The KakaoTalk token has a limited lifespan and may need refresh mechanisms
* Consider rate limits for both the government API and Kakao API
* Performance may be a concern if the number of users or programs grows significantly
* All scheduled functions should have appropriate error handling and retry logic

## 6. Estimation

With this optimized task sequence and clear sub-tasks, implementation should take approximately:
* Phase I: 2-3 days
* Phase II: 2 days
* Phase III: 1-2 days

**Total**: 5-7 developer days

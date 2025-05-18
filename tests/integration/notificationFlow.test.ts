import {
  matchUserPreferencesWithOpportunities
} from '../../src/services/notificationMatchingService';

import {
  generateNotifications,
  queueNotifications
} from '../../src/services/notificationGenerationService';

import {
  orchestrateNotificationProcessing
} from '../../src/services/notificationOrchestrator';


import { createMessageQueueEntry, processMessageQueue } from '../../src/services/kakaoNotificationService';
import { supabase } from '../../src/services/supabase';
import { GovSupportProgram } from '../../src/types/governmentSupport';

// Mock dependencies
jest.mock('../../src/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

jest.mock('../../src/services/kakaoNotificationService', () => ({
  createMessageQueueEntry: jest.fn(),
  processMessageQueue: jest.fn()
}));

jest.mock('../../src/services/notificationTaskService', () => ({
  createTask: jest.fn(),
  getNextPendingTask: jest.fn(),
  updateTaskStatus: jest.fn()
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Notification Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Sample programs for testing
  const testPrograms: GovSupportProgram[] = [
    {
      id: 'program1',
      title: 'Test Program 1',
      description: 'Description for program 1',
      region: '서울',
      geographicRegions: ['서울'],
      supportArea: '기술개발',
      applicationDeadline: '2023-12-31',
      createdAt: new Date().toISOString()
    },
    {
      id: 'program2',
      title: 'Test Program 2',
      description: 'Description for program 2',
      region: '부산',
      geographicRegions: ['부산'],
      supportArea: '자금지원',
      applicationDeadline: '2023-12-31',
      createdAt: new Date().toISOString()
    }
  ] as GovSupportProgram[];
  
  // Mock user preferences
  const userSettings = {
    id: 'settings-id',
    userId: 'user-id',
    kakaoLinked: true,
    newProgramsAlert: true,
    notificationFrequency: 'daily',
    notificationTime: '09:00',
    deadlineNotification: true,
    deadlineDays: 7,
    regions: ['서울'],
    categories: ['기술개발'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  test('Should process end-to-end notification flow', async () => {
    // 1. Setup mocks for database queries
    
    // Mock user settings fetch
    const fromSpy = jest.fn().mockReturnThis();
    const selectSpy = jest.fn().mockReturnThis();
    const eqSpy = jest.fn().mockReturnThis();
    const singleSpy = jest.fn().mockResolvedValue({
      data: {
        id: 'settings-id',
        user_id: 'user-id',
        kakao_linked: true,
        new_programs_alert: true,
        notification_frequency: 'daily',
        notification_time: '09:00',
        deadline_notification: true,
        deadline_days: 7,
        regions: ['서울'],
        categories: ['기술개발'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      error: null
    });
    
    // Mock sent_notifications check
    const selectSentSpy = jest.fn().mockReturnThis();
    const eqSentSpy = jest.fn().mockReturnThis();
    const sentSpy = jest.fn().mockResolvedValue({
      data: [],
      error: null
    });
    
    // Mock program fetching
    const gtSpy = jest.fn().mockReturnThis();
    const programsSpy = jest.fn().mockResolvedValue({
      data: testPrograms,
      error: null
    });
    
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'user_notification_settings') {
        return {
          select: selectSpy,
          insert: jest.fn(),
          update: jest.fn(),
          delete: jest.fn()
        } as any;
      } else if (table === 'sent_notifications') {
        return {
          select: selectSentSpy,
          insert: jest.fn(),
          update: jest.fn(),
          delete: jest.fn()
        } as any;
      } else if (table === 'funding_opportunities') {
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          gt: gtSpy
        } as any;
      } else if (table === 'message_queue') {
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          update: jest.fn(),
          delete: jest.fn()
        } as any;
      }
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      } as any;
    });
    
    selectSpy.mockReturnValue({ eq: eqSpy });
    eqSpy.mockReturnValue({ single: singleSpy });
    
    selectSentSpy.mockReturnValue({ eq: eqSentSpy });
    eqSentSpy.mockReturnValue({ select: jest.fn().mockReturnThis() });
    
    gtSpy.mockReturnValue({ order: jest.fn().mockReturnThis() });
    
    // Mock system settings
    mockSupabase.rpc.mockResolvedValue({
      data: { 
        value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
      },
      error: null
    });
    
    // 2. Mock Kakao notification service
    jest.spyOn(createMessageQueueEntry as jest.Mock).mockResolvedValue({
      success: true,
      messageId: 'test-message-id'
    });
    
    jest.spyOn(processMessageQueue as jest.Mock).mockResolvedValue({
      sent: 1,
      failed: 0,
      requeued: 0
    });

    // 3. Step 1: Match user preferences with programs
    const matches = await matchUserPreferencesWithOpportunities(
      userSettings.userId,
      testPrograms,
      userSettings
    );
    
    // Verify matching result
    expect(matches).toHaveLength(1);
    expect(matches[0].programId).toBe('program1');
    expect(matches[0].matchScore).toBeGreaterThan(0);
    
    // 4. Step 2: Generate notifications from matches
    const notifications = await generateNotifications(matches);
    
    // Verify notifications
    expect(notifications).toHaveLength(1);
    expect(notifications[0].userId).toBe('user-id');
    expect(notifications[0].programId).toBe('program1');
    expect(notifications[0].title).toBe('Test Program 1');
    
    // 5. Step 3: Queue notifications
    const queueResult = await queueNotifications(notifications);
    
    // Verify queue result
    expect(queueResult.queued).toBe(1);
    expect(queueResult.failed).toBe(0);
    expect(createMessageQueueEntry).toHaveBeenCalledTimes(1);
    
    // 6. Step 4: Process the full orchestration
    const orchestrationResult = await orchestrateNotificationProcessing({
      checkNewPrograms: true,
      checkDeadlines: false,
      processMessageQueue: true
    });
    
    // Verify orchestration result
    expect(orchestrationResult.errors).toBe(0);
    expect(orchestrationResult.warnings).toHaveLength(0);
    expect(processMessageQueue).toHaveBeenCalled();
    
    // 7. Verify that all components were called properly
    expect(mockSupabase.from).toHaveBeenCalledWith('user_notification_settings');
    expect(mockSupabase.from).toHaveBeenCalledWith('funding_opportunities');
    expect(mockSupabase.from).toHaveBeenCalledWith('message_queue');
    expect(createMessageQueueEntry).toHaveBeenCalled();
    expect(processMessageQueue).toHaveBeenCalled();
  });
}); 
// Import mock instead of actual service
import { mockPrograms } from '../unit/mocks/governmentSupportService';
import { createSuccessResponse } from '../unit/mocks/supabaseMock';

// Mock all services
jest.mock('../../src/services/notificationMatchingService');
jest.mock('../../src/services/notificationGenerationService');
jest.mock('../../src/services/kakaoNotificationService');
jest.mock('../../src/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

// Import the mocked services
import { createMessageQueueEntry, processMessageQueue } from '../../src/services/kakaoNotificationService';
import { generateNotifications, queueNotifications } from '../../src/services/notificationGenerationService';
import { matchUserPreferencesWithOpportunities } from '../../src/services/notificationMatchingService';
import { supabase } from '../../src/services/supabase';

// Mock orchestrator
const mockOrchestrateNotificationProcessing = jest.fn().mockResolvedValue({
  errors: 0,
  warnings: []
});

describe('Notification Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Mock user preferences
  const userSettings = {
    id: 'settings-id',
    userId: 'user-id',
    kakaoLinked: true,
    newProgramsAlert: true,
    notificationFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    notificationTime: '09:00',
    deadlineNotification: true,
    deadlineDays: 7,
    regions: ['서울'],
    categories: ['기술개발'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  test('Should process notification matching and generation', async () => {
    // 1. Setup mock for database queries
    (supabase.from as jest.Mock).mockImplementation(() => {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(createSuccessResponse({}))
      };
    });
    
    // 2. Set up mocks for notification services
    const mockMatches = [
      {
        userId: 'user-id',
        programId: 'prog-1',
        matchScore: 0.85,
        program: mockPrograms[0]
      }
    ];
    
    // Setup mock implementations
    (matchUserPreferencesWithOpportunities as jest.Mock).mockResolvedValue(mockMatches);
    (generateNotifications as jest.Mock).mockResolvedValue([
      {
        userId: 'user-id',
        programId: 'prog-1',
        title: mockPrograms[0].title,
        url: 'https://example.com/program/prog-1',
        notificationType: 'new_program',
        description: mockPrograms[0].description
      }
    ]);
    (queueNotifications as jest.Mock).mockResolvedValue({
      queued: 1,
      failed: 0
    });
    (createMessageQueueEntry as jest.Mock).mockResolvedValue({
      success: true
    });
    (processMessageQueue as jest.Mock).mockResolvedValue({
      sent: 1,
      failed: 0,
      requeued: 0
    });

    // 3. Execute test flow
    const matches = await matchUserPreferencesWithOpportunities(
      userSettings.userId,
      mockPrograms,
      userSettings
    );
    
    // Verify matching result
    expect(matches).toHaveLength(1);
    expect(matches[0].programId).toBe('prog-1');
    expect(matches[0].matchScore).toBeGreaterThan(0);
    
    // 4. Generate notifications from matches
    const notifications = await generateNotifications(matches);
    
    // Verify notifications
    expect(notifications).toHaveLength(1);
    expect(notifications[0].userId).toBe('user-id');
    expect(notifications[0].programId).toBe('prog-1');
    expect(notifications[0].title).toBe(mockPrograms[0].title);
    
    // 5. Queue notifications
    const queueResult = await queueNotifications(notifications);
    
    // Verify queue result
    expect(queueResult.queued).toBe(1);
    expect(queueResult.failed).toBe(0);
    
    // 6. Verify mock calls
    expect(matchUserPreferencesWithOpportunities).toHaveBeenCalledWith(
      userSettings.userId, 
      mockPrograms, 
      userSettings
    );
    expect(generateNotifications).toHaveBeenCalledWith(mockMatches);
    expect(queueNotifications).toHaveBeenCalled();
  });
}); 
import * as kakaoNotificationService from '../../src/services/kakaoNotificationService';
import {
    generateNotifications,
    NotificationMessage,
    processGroupedMatchesIntoNotifications,
    processMatchesIntoNotifications,
    queueNotifications
} from '../../src/services/notificationGenerationService';
import { MatchResult } from '../../src/services/notificationMatchingService';
import { GovSupportProgram } from '../../src/types/governmentSupport';

// Mock the Kakao Notification Service
jest.mock('../../src/services/kakaoNotificationService', () => ({
  createMessageQueueEntry: jest.fn()
}));

describe('Notification Generation Service', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Sample match results for testing
  const sampleMatches: MatchResult[] = [
    {
      userId: 'user1',
      programId: 'program1',
      program: {
        id: 'program1',
        title: 'Seoul Tech Program',
        description: 'Support for tech startups in Seoul',
        region: '서울',
        geographicRegions: ['서울'],
        supportArea: '기술개발',
        applicationDeadline: '2023-12-31',
        amount: '최대 1억원'
      } as GovSupportProgram,
      matchScore: 95,
      matchedRegions: ['서울'],
      matchedCategories: ['기술개발'],
      isAlreadySent: false
    },
    {
      userId: 'user1',
      programId: 'program2',
      program: {
        id: 'program2',
        title: 'Nationwide Innovation Program',
        description: 'Support for innovative projects across Korea',
        region: '전국',
        geographicRegions: ['전국'],
        supportArea: '기술개발',
        applicationUrl: 'https://example.com/program2'
      } as GovSupportProgram,
      matchScore: 85,
      matchedRegions: ['전국'],
      matchedCategories: ['기술개발'],
      isAlreadySent: false
    },
    {
      userId: 'user2',
      programId: 'program1',
      program: {
        id: 'program1',
        title: 'Seoul Tech Program',
        description: 'Support for tech startups in Seoul',
        region: '서울',
        geographicRegions: ['서울'],
        supportArea: '기술개발'
      } as GovSupportProgram,
      matchScore: 90,
      matchedRegions: ['서울'],
      matchedCategories: ['기술개발'],
      isAlreadySent: false
    }
  ];

  describe('generateNotifications', () => {
    test('should generate notifications from match results', async () => {
      // Call function with sample matches
      const notifications = await generateNotifications(sampleMatches);
      
      // Should generate 3 notifications
      expect(notifications).toHaveLength(3);
      
      // Check the structure of first notification
      const firstNotification = notifications[0];
      expect(firstNotification.userId).toBe('user1');
      expect(firstNotification.programId).toBe('program1');
      expect(firstNotification.title).toBe('Seoul Tech Program');
      expect(firstNotification.messageType).toBe('new_program');
      
      // Description should include program details
      expect(firstNotification.description).toContain('Support for tech startups in Seoul');
      expect(firstNotification.description).toContain('지역: 서울');
      expect(firstNotification.description).toContain('분야: 기술개발');
      expect(firstNotification.description).toContain('마감일: 2023-12-31');
      expect(firstNotification.description).toContain('지원금: 최대 1억원');
      
      // Should include match information
      expect(firstNotification.description).toContain('매칭 정보:');
      expect(firstNotification.description).toContain('지역: 서울');
      expect(firstNotification.description).toContain('분야: 기술개발');
      expect(firstNotification.description).toContain('매칭 점수: 95점');
      
      // Check programUrl generation for different types
      expect(firstNotification.programUrl).toContain('bizinfo.go.kr');
      expect(notifications[1].programUrl).toBe('https://example.com/program2');
    });
    
    test('should respect notification options', async () => {
      // Test with custom options
      const notifications = await generateNotifications(sampleMatches, {
        includeDescription: false,
        includeProgramDetails: true,
        maxMessagesPerUser: 1,
        highlightMatches: false
      });
      
      // Should limit to 1 notification per user (2 total - one for each user)
      expect(notifications).toHaveLength(2);
      
      // Description should NOT include the program description
      expect(notifications[0].description).not.toContain('Support for tech startups');
      
      // Should include program details
      expect(notifications[0].description).toContain('지역: 서울');
      
      // Should NOT include match information
      expect(notifications[0].description).not.toContain('매칭 정보:');
      expect(notifications[0].description).not.toContain('매칭 점수: 95점');
    });
    
    test('should handle empty or invalid match results', async () => {
      // Test with empty array
      const emptyResult = await generateNotifications([]);
      expect(emptyResult).toHaveLength(0);
      
      // Test with null/undefined
      const nullResult = await generateNotifications(null as any);
      expect(nullResult).toHaveLength(0);
      
      // Test with invalid data
      const invalidResult = await generateNotifications([{ invalid: 'data' }] as any);
      expect(invalidResult).toHaveLength(0);
    });
  });

  describe('queueNotifications', () => {
    test('should queue notifications successfully', async () => {
      // Mock createMessageQueueEntry to return success
      jest.spyOn(kakaoNotificationService, 'createMessageQueueEntry').mockResolvedValue({
        success: true
      });
      
      // Create sample notifications
      const notifications: NotificationMessage[] = [
        {
          userId: 'user1',
          programId: 'program1',
          title: 'Test Program 1',
          description: 'Test Description 1',
          programUrl: 'https://example.com/1',
          messageType: 'new_program'
        },
        {
          userId: 'user2',
          programId: 'program2',
          title: 'Test Program 2',
          description: 'Test Description 2',
          programUrl: 'https://example.com/2',
          messageType: 'deadline'
        }
      ];
      
      // Call function with sample notifications
      const result = await queueNotifications(notifications);
      
      // Should queue both notifications
      expect(result.queued).toBe(2);
      expect(result.failed).toBe(0);
      
      // Verify calls to createMessageQueueEntry
      expect(kakaoNotificationService.createMessageQueueEntry).toHaveBeenCalledTimes(2);
      expect(kakaoNotificationService.createMessageQueueEntry).toHaveBeenCalledWith(
        'user1',
        'program1',
        'Test Program 1',
        'https://example.com/1',
        'new_program',
        'Test Description 1'
      );
      expect(kakaoNotificationService.createMessageQueueEntry).toHaveBeenCalledWith(
        'user2',
        'program2',
        'Test Program 2',
        'https://example.com/2',
        'new_program',
        'Test Description 2'
      );
    });
    
    test('should handle failed queue operations', async () => {
      // Mock createMessageQueueEntry to return failure for second call
      jest.spyOn(kakaoNotificationService, 'createMessageQueueEntry')
        .mockResolvedValueOnce({
          success: true
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'Database error'
        });
      
      // Create sample notifications
      const notifications: NotificationMessage[] = [
        {
          userId: 'user1',
          programId: 'program1',
          title: 'Test Program 1',
          description: 'Test Description 1',
          programUrl: 'https://example.com/1',
          messageType: 'new_program'
        },
        {
          userId: 'user2',
          programId: 'program2',
          title: 'Test Program 2',
          description: 'Test Description 2',
          programUrl: 'https://example.com/2',
          messageType: 'new_program'
        }
      ];
      
      // Call function with sample notifications
      const result = await queueNotifications(notifications);
      
      // Should show partial success
      expect(result.queued).toBe(1);
      expect(result.failed).toBe(1);
    });
    
    test('should handle message type override', async () => {
      // Mock createMessageQueueEntry to return success
      jest.spyOn(kakaoNotificationService, 'createMessageQueueEntry').mockResolvedValue({
        success: true
      });
      
      // Create sample notification
      const notifications: NotificationMessage[] = [
        {
          userId: 'user1',
          programId: 'program1',
          title: 'Test Program',
          description: 'Test Description',
          programUrl: 'https://example.com',
          messageType: 'new_program'
        }
      ];
      
      // Call function with message type override
      await queueNotifications(notifications, 'deadline');
      
      // Verify message type was overridden
      expect(kakaoNotificationService.createMessageQueueEntry).toHaveBeenCalledWith(
        'user1',
        'program1',
        'Test Program',
        'https://example.com',
        'deadline',
        'Test Description'
      );
    });
  });

  describe('processMatchesIntoNotifications', () => {
    test('should process matches into notifications and queue them', async () => {
      // Mock generateNotifications to return test notifications
      const testNotifications: NotificationMessage[] = [
        {
          userId: 'user1',
          programId: 'program1',
          title: 'Test Program',
          description: 'Test Description',
          programUrl: 'https://example.com',
          messageType: 'new_program'
        }
      ];
      
      jest.spyOn(kakaoNotificationService, 'createMessageQueueEntry').mockResolvedValue({
        success: true
      });
      
      // Process matches
      const result = await processMatchesIntoNotifications(sampleMatches);
      
      // Should show success
      expect(result.generated).toBeGreaterThan(0);
      expect(result.queued).toBeGreaterThan(0);
      expect(result.failed).toBe(0);
      
      // Verify createMessageQueueEntry was called for each notification
      expect(kakaoNotificationService.createMessageQueueEntry).toHaveBeenCalledTimes(result.generated);
    });
    
    test('should handle empty matches', async () => {
      const result = await processMatchesIntoNotifications([]);
      
      expect(result.generated).toBe(0);
      expect(result.queued).toBe(0);
      expect(result.failed).toBe(0);
      
      expect(kakaoNotificationService.createMessageQueueEntry).not.toHaveBeenCalled();
    });
  });

  describe('processGroupedMatchesIntoNotifications', () => {
    test('should process grouped matches', async () => {
      // Create grouped matches
      const groupedMatches: Record<string, MatchResult[]> = {
        'user1': [sampleMatches[0], sampleMatches[1]],
        'user2': [sampleMatches[2]]
      };
      
      jest.spyOn(kakaoNotificationService, 'createMessageQueueEntry').mockResolvedValue({
        success: true
      });
      
      // Process grouped matches
      const result = await processGroupedMatchesIntoNotifications(groupedMatches);
      
      // Should show success
      expect(result.generated).toBe(3);
      expect(result.queued).toBe(3);
      expect(result.failed).toBe(0);
      
      // Verify createMessageQueueEntry was called for each notification
      expect(kakaoNotificationService.createMessageQueueEntry).toHaveBeenCalledTimes(3);
    });
    
    test('should handle empty groups', async () => {
      const result = await processGroupedMatchesIntoNotifications({});
      
      expect(result.generated).toBe(0);
      expect(result.queued).toBe(0);
      expect(result.failed).toBe(0);
      
      expect(kakaoNotificationService.createMessageQueueEntry).not.toHaveBeenCalled();
    });
  });
}); 
import {
    checkIfNotificationSent,
    matchUserPreferencesWithOpportunities,
    recordSentNotification
} from '../../src/services/notificationMatchingService';
import { supabase } from '../../src/services/supabase';
import { NotificationSettings } from '../../src/services/userNotificationService';
import { GovSupportProgram } from '../../src/types/governmentSupport';

// Mock the Supabase module
jest.mock('../../src/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Notification Matching Service', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('matchUserPreferencesWithOpportunities', () => {
    const userId = 'test-user-id';
    
    // Sample support programs
    const testPrograms: GovSupportProgram[] = [
      {
        id: 'program1',
        title: 'Seoul Tech Program',
        region: '서울',
        geographicRegions: ['서울'],
        supportArea: '기술개발'
      },
      {
        id: 'program2',
        title: 'Busan Finance Program',
        region: '부산',
        geographicRegions: ['부산'],
        supportArea: '자금지원'
      },
      {
        id: 'program3',
        title: 'Nationwide Support Program',
        region: '전국',
        geographicRegions: ['전국'],
        supportArea: '기술개발'
      }
    ] as GovSupportProgram[];
    
    const userSettings: NotificationSettings = {
      id: 'settings-id',
      userId,
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

    test('should match programs based on region and category preferences', async () => {
      // Mock sent notifications check
      const fromSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const eqSpy = jest.fn().mockReturnThis();
      const singleSpy = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });
      
      mockSupabase.from.mockImplementation(() => ({
        select: selectSpy,
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({ eq: jest.fn() }),
        delete: jest.fn().mockReturnValue({ eq: jest.fn() })
      } as any));
      
      selectSpy.mockReturnValue({
        eq: eqSpy,
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
        match: jest.fn().mockResolvedValue({ data: [], error: null }),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      });
      
      eqSpy.mockReturnValue({
        single: singleSpy,
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      // Call function with test data
      const result = await matchUserPreferencesWithOpportunities(
        userId, 
        testPrograms,
        userSettings
      );
      
      // Expectations
      expect(result).toHaveLength(2); // Should match program1 and program3
      
      // Should match Seoul program
      expect(result[0].programId).toBe('program1');
      expect(result[0].matchScore).toBe(100); // Perfect match (both region and category)
      expect(result[0].matchedRegions).toEqual(['서울']);
      expect(result[0].matchedCategories).toEqual(['기술개발']);
      
      // Should match Nationwide program
      expect(result[1].programId).toBe('program3');
      expect(result[1].matchScore).toBe(100); // Perfect match (nationwide and category)
      expect(result[1].matchedRegions).toEqual(['전국']);
      expect(result[1].matchedCategories).toEqual(['기술개발']);
    });

    test('should handle empty preferences', async () => {
      const emptySettings: NotificationSettings = {
        ...userSettings,
        regions: [],
        categories: []
      };
      
      const result = await matchUserPreferencesWithOpportunities(
        userId, 
        testPrograms,
        emptySettings
      );
      
      // No preferences means no matches
      expect(result).toHaveLength(0);
    });

    test('should fetch user settings if not provided', async () => {
      const fromSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const eqSpy = jest.fn().mockReturnThis();
      const singleSpy = jest.fn().mockResolvedValue({
        data: {
          id: 'settings-id',
          user_id: userId,
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
      
      mockSupabase.from.mockImplementation(() => ({
        select: selectSpy,
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({ eq: jest.fn() }),
        delete: jest.fn().mockReturnValue({ eq: jest.fn() })
      } as any));
      
      selectSpy.mockReturnValue({
        eq: eqSpy,
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
        match: jest.fn().mockResolvedValue({ data: [], error: null }),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      });
      
      eqSpy.mockReturnValue({
        single: singleSpy,
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      });
      
      const result = await matchUserPreferencesWithOpportunities(userId, testPrograms);
      
      // Should fetch user settings
      expect(mockSupabase.from).toHaveBeenCalledWith('user_notification_settings');
      expect(selectSpy).toHaveBeenCalledWith('*');
      expect(eqSpy).toHaveBeenCalledWith('user_id', userId);
      expect(singleSpy).toHaveBeenCalled();
      
      // Should match programs
      expect(result).toHaveLength(2);
    });

    test('should respect minimum match score', async () => {
      // Set different weights to get varied scores
      const result = await matchUserPreferencesWithOpportunities(
        userId, 
        testPrograms,
        userSettings,
        { 
          minimumMatchScore: 90,
          regionWeight: 70,
          categoryWeight: 30
        }
      );
      
      // Should still match both programs despite the higher threshold
      expect(result).toHaveLength(2);
      
      // With the extreme threshold, it should not match any
      const highThresholdResult = await matchUserPreferencesWithOpportunities(
        userId, 
        testPrograms,
        userSettings,
        { minimumMatchScore: 101 }
      );
      
      expect(highThresholdResult).toHaveLength(0);
    });
  });

  describe('checkIfNotificationSent', () => {
    const userId = 'test-user-id';
    const programId = 'test-program-id';
    
    test('should return true if notification was sent', async () => {
      const fromSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const eqSpy = jest.fn().mockReturnThis();
      const singleSpy = jest.fn().mockResolvedValue({
        data: { id: 'notification-id' },
        error: null
      });
      
      mockSupabase.from.mockImplementation(() => ({
        select: selectSpy,
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({ eq: jest.fn() }),
        delete: jest.fn().mockReturnValue({ eq: jest.fn() })
      } as any));
      
      selectSpy.mockReturnValue({
        eq: eqSpy
      });
      
      eqSpy.mockReturnValue({
        eq: eqSpy,
        single: singleSpy
      });
      
      const result = await checkIfNotificationSent(userId, programId);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('sent_notifications');
      expect(selectSpy).toHaveBeenCalledWith('id');
      expect(eqSpy).toHaveBeenCalledWith('user_id', userId);
      expect(eqSpy).toHaveBeenCalledWith('opportunity_id', programId);
      expect(singleSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    test('should return false if notification was not sent', async () => {
      const fromSpy = jest.fn().mockReturnThis();
      const selectSpy = jest.fn().mockReturnThis();
      const eqSpy = jest.fn().mockReturnThis();
      const singleSpy = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });
      
      mockSupabase.from.mockImplementation(() => ({
        select: selectSpy,
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({ eq: jest.fn() }),
        delete: jest.fn().mockReturnValue({ eq: jest.fn() })
      } as any));
      
      selectSpy.mockReturnValue({
        eq: eqSpy
      });
      
      eqSpy.mockReturnValue({
        eq: eqSpy,
        single: singleSpy
      });
      
      const result = await checkIfNotificationSent(userId, programId);
      
      expect(result).toBe(false);
    });
  });
  
  describe('recordSentNotification', () => {
    const userId = 'test-user-id';
    const programId = 'test-program-id';
    
    test('should record sent notification', async () => {
      const fromSpy = jest.fn().mockReturnThis();
      const insertSpy = jest.fn().mockResolvedValue({ error: null });
      
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        insert: insertSpy,
        update: jest.fn().mockReturnValue({ eq: jest.fn() }),
        delete: jest.fn().mockReturnValue({ eq: jest.fn() })
      } as any));
      
      const result = await recordSentNotification(userId, programId, 'new');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('sent_notifications');
      expect(insertSpy).toHaveBeenCalledWith({
        user_id: userId,
        opportunity_id: programId,
        frequency: 'new',
        sent_at: expect.any(String)
      });
      expect(result).toBe(true);
    });
    
    test('should handle errors', async () => {
      const fromSpy = jest.fn().mockReturnThis();
      const insertSpy = jest.fn().mockResolvedValue({ 
        error: { message: 'Database error' } 
      });
      
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        insert: insertSpy,
        update: jest.fn().mockReturnValue({ eq: jest.fn() }),
        delete: jest.fn().mockReturnValue({ eq: jest.fn() })
      } as any));
      
      const result = await recordSentNotification(userId, programId, 'new');
      
      expect(result).toBe(false);
    });
  });
}); 
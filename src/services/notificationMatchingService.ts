import { supabase } from './supabase';
import { GovSupportProgram } from '../types/governmentSupport';
import { NotificationSettings } from './userNotificationService';

/**
 * Interface representing a funding opportunity that has been matched with user preferences
 */
export interface MatchResult {
  userId: string;
  programId: string;
  program: GovSupportProgram;
  matchScore: number;  // 0-100 score indicating how well it matches
  matchedRegions: string[];
  matchedCategories: string[];
  isAlreadySent: boolean;
}

/**
 * Interface for notification match parameters to allow for configuration
 */
export interface MatchingParameters {
  minimumMatchScore?: number;   // Minimum score to consider a match (default: 50)
  regionWeight?: number;        // Weight for region matches (default: 50)
  categoryWeight?: number;      // Weight for category matches (default: 50)
  checkSentNotifications?: boolean; // Whether to check against sent_notifications table (default: true)
}

/**
 * Match user preferences with funding opportunities
 * 
 * @param userId User ID to match preferences for
 * @param opportunities List of funding opportunities to match against
 * @param userSettings Optional user notification settings (if not provided, will be fetched)
 * @param params Optional parameters to configure matching algorithm
 * @returns Array of match results
 */
export async function matchUserPreferencesWithOpportunities(
  userId: string,
  opportunities: GovSupportProgram[],
  userSettings?: NotificationSettings,
  params: MatchingParameters = {}
): Promise<MatchResult[]> {
  try {
    // Set default parameters
    const {
      minimumMatchScore = 50,
      regionWeight = 50,
      categoryWeight = 50,
      checkSentNotifications = true
    } = params;
    
    // Get user settings if not provided
    let settings = userSettings;
    if (!settings) {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error || !data) {
        console.error('Error fetching user notification settings:', error);
        return [];
      }
      
      settings = {
        id: data.id,
        userId: data.user_id,
        kakaoLinked: data.kakao_linked,
        newProgramsAlert: data.new_programs_alert,
        notificationFrequency: data.notification_frequency,
        notificationTime: data.notification_time,
        deadlineNotification: data.deadline_notification,
        deadlineDays: data.deadline_days,
        regions: data.regions || [],
        categories: data.categories || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }
    
    // Get list of already sent notifications for this user if needed
    let sentNotifications: Record<string, boolean> = {};
    
    if (checkSentNotifications) {
      const { data, error } = await supabase
        .from('sent_notifications')
        .select('opportunity_id')
        .eq('user_id', userId);
        
      if (!error && data) {
        sentNotifications = data.reduce((acc, notification) => {
          acc[notification.opportunity_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }
    }
    
    // Extract user preferences
    const userRegions = settings.regions || [];
    const userCategories = settings.categories || [];
    
    // No preferences set - no matches
    if (userRegions.length === 0 && userCategories.length === 0) {
      console.log(`User ${userId} has no region or category preferences set`);
      return [];
    }
    
    // Calculate match scores for each opportunity
    const results: MatchResult[] = [];
    
    for (const program of opportunities) {
      // Skip if already sent
      if (sentNotifications[program.id]) {
        results.push({
          userId,
          programId: program.id,
          program,
          matchScore: 0,
          matchedRegions: [],
          matchedCategories: [],
          isAlreadySent: true
        });
        continue;
      }
      
      // Calculate region match score
      let regionScore = 0;
      const matchedRegions: string[] = [];
      
      if (userRegions.length > 0) {
        // Handle both geographicRegions array and region string
        const programRegions = program.geographicRegions || [];
        if (program.region && !programRegions.includes(program.region)) {
          programRegions.push(program.region);
        }
        
        // Special case: if program has '전국' (nationwide), it matches any region
        if (programRegions.includes('전국')) {
          regionScore = 100;
          matchedRegions.push('전국');
        } else {
          // Calculate what percentage of user's regions match
          const matchingRegions = userRegions.filter(region => 
            programRegions.some(progRegion => progRegion.includes(region))
          );
          
          matchedRegions.push(...matchingRegions);
          
          if (matchingRegions.length > 0) {
            regionScore = (matchingRegions.length / userRegions.length) * 100;
          }
        }
      } else {
        // If user has no region preferences, any region is a match
        regionScore = 100;
      }
      
      // Calculate category match score
      let categoryScore = 0;
      const matchedCategories: string[] = [];
      
      if (userCategories.length > 0) {
        // Get program categories
        const programCategories: string[] = [];
        if (program.supportArea) programCategories.push(program.supportArea);
        
        // Calculate what percentage of user's categories match
        const matchingCategories = userCategories.filter(category => 
          programCategories.some(progCategory => progCategory.includes(category))
        );
        
        matchedCategories.push(...matchingCategories);
        
        if (matchingCategories.length > 0) {
          categoryScore = (matchingCategories.length / userCategories.length) * 100;
        }
      } else {
        // If user has no category preferences, any category is a match
        categoryScore = 100;
      }
      
      // Calculate weighted average match score
      const totalWeight = regionWeight + categoryWeight;
      const weightedRegionScore = (regionScore * regionWeight) / totalWeight;
      const weightedCategoryScore = (categoryScore * categoryWeight) / totalWeight;
      const totalScore = weightedRegionScore + weightedCategoryScore;
      
      // Add to results if it meets minimum score
      if (totalScore >= minimumMatchScore) {
        results.push({
          userId,
          programId: program.id,
          program,
          matchScore: Math.round(totalScore),
          matchedRegions,
          matchedCategories,
          isAlreadySent: false
        });
      }
    }
    
    // Sort results by match score (highest first)
    return results.sort((a, b) => b.matchScore - a.matchScore);
    
  } catch (error) {
    console.error('Error in matchUserPreferencesWithOpportunities:', error);
    return [];
  }
}

/**
 * Check if a specific program has already been sent to a user
 */
export async function checkIfNotificationSent(
  userId: string,
  programId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('sent_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('opportunity_id', programId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No results found - not sent yet
        return false;
      }
      console.error('Error checking sent notification:', error);
    }
    
    // If we found a record, notification has been sent
    return !!data;
    
  } catch (error) {
    console.error('Error in checkIfNotificationSent:', error);
    // Assume not sent in case of error
    return false;
  }
}

/**
 * Record that a notification has been sent to a user
 */
export async function recordSentNotification(
  userId: string,
  programId: string,
  frequency: 'new' | 'deadline'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sent_notifications')
      .insert({
        user_id: userId,
        opportunity_id: programId,
        frequency,
        sent_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error recording sent notification:', error);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error in recordSentNotification:', error);
    return false;
  }
}

/**
 * Match users with a set of funding opportunities and filter out already notified ones
 * 
 * @param opportunities Funding opportunities to match against users
 * @param notificationType Type of notification to process ('new_program' or 'deadline')
 * @returns Array of matches grouped by user
 */
export async function matchOpportunitiesWithUsers(
  opportunities: GovSupportProgram[],
  notificationType: 'new_program' | 'deadline'
): Promise<Record<string, MatchResult[]>> {
  try {
    // Get all users with notification settings
    const { data: users, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('kakao_linked', true)
      .eq(notificationType === 'new_program' ? 'new_programs_alert' : 'deadline_notification', true);
    
    if (error || !users || users.length === 0) {
      console.error('Error fetching users for matching:', error);
      return {};
    }
    
    // Match each user with the opportunities
    const results: Record<string, MatchResult[]> = {};
    
    for (const user of users) {
      // Convert from database format to NotificationSettings
      const settings: NotificationSettings = {
        id: user.id,
        userId: user.user_id,
        kakaoLinked: user.kakao_linked,
        newProgramsAlert: user.new_programs_alert,
        notificationFrequency: user.notification_frequency,
        notificationTime: user.notification_time,
        deadlineNotification: user.deadline_notification,
        deadlineDays: user.deadline_days,
        regions: user.regions || [],
        categories: user.categories || [],
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
      
      // Match this user with all opportunities
      const matches = await matchUserPreferencesWithOpportunities(
        user.user_id,
        opportunities,
        settings
      );
      
      // Filter out already sent notifications
      const newMatches = matches.filter(match => !match.isAlreadySent);
      
      if (newMatches.length > 0) {
        results[user.user_id] = newMatches;
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Error in matchOpportunitiesWithUsers:', error);
    return {};
  }
} 
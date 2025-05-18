import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { PlanType } from '../services/paymentService';

interface SubscriptionContextType {
  currentPlan: PlanType;
  loading: boolean;
  canUseFeature: (feature: Feature) => boolean;
  remainingUsage: {
    aiBusinessPlans: number;
    specializedTemplates: number;
  };
  refreshSubscription: () => Promise<void>;
}

// Define all features that can be limited by subscription
export type Feature = 
  | 'advancedSearch'
  | 'unlimitedNotifications'
  | 'unlimitedAiPlans'
  | 'specializedTemplates'
  | 'documentConversion'
  | 'allTemplates'
  | 'expertConsulting'
  | 'prioritySupport';

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);
  const [remainingUsage, setRemainingUsage] = useState({
    aiBusinessPlans: 1, // Default for free plan
    specializedTemplates: 0, // Default for free plan
  });
  
  const { user } = useAuth();

  // Feature mapping to plans
  const featureAvailability: Record<Feature, PlanType[]> = {
    advancedSearch: ['pro'],
    unlimitedNotifications: ['pro'],
    unlimitedAiPlans: ['pro'],
    specializedTemplates: ['pro'],
    documentConversion: ['pro'],
    allTemplates: ['pro'],
    expertConsulting: ['pro'],
    prioritySupport: ['pro']
  };
  
  // Check if a feature is available for the current plan
  const canUseFeature = (feature: Feature): boolean => {
    return featureAvailability[feature].includes(currentPlan);
  };

  // Fetch subscription data from Supabase
  const fetchSubscription = async () => {
    if (!user?.id) {
      setCurrentPlan('free');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get user's plan type from users table - removed usage_data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plan_type')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('Error fetching user plan:', userError);
        setCurrentPlan('free');
        return;
      }
      
      // Set the current plan
      if (userData?.plan_type && ['free', 'pro'].includes(userData.plan_type)) {
        setCurrentPlan(userData.plan_type as PlanType);
      } else {
        setCurrentPlan('free');
      }
      
      // Set usage data based on plan type
      // No usage_data dependency - used plan type instead
      const isPro = userData?.plan_type === 'pro';
      setRemainingUsage({
        aiBusinessPlans: isPro ? -1 : 1, // -1 means unlimited for pro
        specializedTemplates: isPro ? 3 : 0, // Pro users get 3 templates
      });
    } catch (error) {
      console.error('Error in subscription fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh subscription data
  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  // Initial load and when user changes
  useEffect(() => {
    fetchSubscription();
  }, [user?.id]);

  return (
    <SubscriptionContext.Provider value={{
      currentPlan,
      loading,
      canUseFeature,
      remainingUsage,
      refreshSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 
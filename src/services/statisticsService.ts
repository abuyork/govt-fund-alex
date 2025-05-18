import { supabase } from './supabase';

export type StatsType = {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalTemplates: number;
  totalDocuments: number;
};

export type ActivitySummary = {
  newSignups: number;
  paymentCount: number;
  generatedDocuments: number;
};

export type PopularTemplate = {
  id: string;
  name: string;
  usage_count: number;
  avg_generation_time: number;
};

// Tables required for statistical queries
const requiredTables = [
  'profiles',
  'payments',
  'templates',
  'generated_documents',
  'template_usage_stats'
];

// Check if required tables exist and create them if needed
export const ensureTablesExist = async (): Promise<boolean> => {
  try {
    // First, check if we can connect to the database
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    // If we can't even connect to a known table, we have connection issues
    if (connectionError) {
      console.error('Database connection error:', connectionError);
      return false;
    }

    // For each required table, check if it exists by trying a minimal query
    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (error && error.code === '42P01') {  // Table doesn't exist
          console.warn(`Table '${table}' doesn't exist. Stats for this table will be zero.`);
          // We'll continue anyway and return zeros for missing tables
        } else if (error) {
          console.error(`Error checking table '${table}':`, error);
        }
      } catch (tableError) {
        console.error(`Error testing table '${table}':`, tableError);
        // Continue checking other tables
      }
    }
    
    // Return true to allow the app to continue - we'll just show zeros for missing data
    return true;
  } catch (error) {
    console.error('Error in ensureTablesExist:', error);
    return false;
  }
};

// Get date range based on timeframe
const getDateRange = (timeframe: 'week' | 'month' | 'year') => {
  const now = new Date();
  let startDate: Date;
  
  if (timeframe === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (timeframe === 'month') {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);
  }
  
  return {
    startDate: startDate.toISOString(),
    endDate: now.toISOString()
  };
};

// Fetch main dashboard statistics
export const fetchStatistics = async (timeframe: 'week' | 'month' | 'year'): Promise<StatsType> => {
  const { startDate, endDate } = getDateRange(timeframe);
  const defaultStats: StatsType = {
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTemplates: 0,
    totalDocuments: 0
  };
  
  try {
    // Get total users count - with safe error handling
    let totalUsersCount = 0;
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (!error) totalUsersCount = count || 0;
    } catch (e) {
      console.error('Error fetching total users:', e);
    }

    // Get active users count within timeframe - with safe error handling
    let activeUsersCount = 0;
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in', startDate);
      
      if (!error) activeUsersCount = count || 0;
    } catch (e) {
      console.error('Error fetching active users:', e);
    }

    // Get total revenue - with safe error handling
    let totalRevenue = 0;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount');
      
      if (!error && data) {
        totalRevenue = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      }
    } catch (e) {
      console.error('Error fetching total revenue:', e);
    }

    // Get revenue within timeframe - with safe error handling
    let timeframeRevenue = 0;
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (!error && data) {
        timeframeRevenue = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      }
    } catch (e) {
      console.error('Error fetching timeframe revenue:', e);
    }

    // Get templates count - with safe error handling
    let templatesCount = 0;
    try {
      const { count, error } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true });
      
      if (!error) templatesCount = count || 0;
    } catch (e) {
      console.error('Error fetching templates count:', e);
    }

    // Get documents count - with safe error handling
    let documentsCount = 0;
    try {
      const { count, error } = await supabase
        .from('generated_documents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (!error) documentsCount = count || 0;
    } catch (e) {
      console.error('Error fetching documents count:', e);
    }

    return {
      totalUsers: totalUsersCount,
      activeUsers: activeUsersCount,
      totalRevenue: totalRevenue,
      monthlyRevenue: timeframeRevenue,
      totalTemplates: templatesCount,
      totalDocuments: documentsCount
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return defaultStats;
  }
};

// Fetch activity summary data
export const fetchActivitySummary = async (timeframe: 'week' | 'month' | 'year'): Promise<ActivitySummary> => {
  const { startDate, endDate } = getDateRange(timeframe);
  const defaultActivitySummary: ActivitySummary = {
    newSignups: 0,
    paymentCount: 0,
    generatedDocuments: 0
  };
  
  try {
    // Get new signups count - with safe error handling
    let newSignupsCount = 0;
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (!error) newSignupsCount = count || 0;
    } catch (e) {
      console.error('Error fetching new signups:', e);
    }

    // Get payment count - with safe error handling
    let paymentCount = 0;
    try {
      const { count, error } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (!error) paymentCount = count || 0;
    } catch (e) {
      console.error('Error fetching payment count:', e);
    }

    // Get generated documents count - with safe error handling
    let documentsCount = 0;
    try {
      const { count, error } = await supabase
        .from('generated_documents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (!error) documentsCount = count || 0;
    } catch (e) {
      console.error('Error fetching documents count:', e);
    }

    return {
      newSignups: newSignupsCount,
      paymentCount: paymentCount,
      generatedDocuments: documentsCount
    };
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    return defaultActivitySummary;
  }
};

// Fetch popular templates
export const fetchPopularTemplates = async (): Promise<PopularTemplate[]> => {
  try {
    // Fetch template usage statistics with raw templates query
    let data = [];
    try {
      const { data: usageData, error } = await supabase
        .from('template_usage_stats')
        .select(`
          id,
          template_id,
          usage_count,
          avg_generation_time
        `)
        .order('usage_count', { ascending: false })
        .limit(5);
      
      if (!error && usageData && usageData.length > 0) {
        data = usageData;
      } else {
        return [];
      }
    } catch (e) {
      console.error('Error fetching template usage stats:', e);
      return [];
    }
    
    // Get template names in a separate query
    const templateIds = data.map(item => item.template_id);
    let templateMap = new Map();
    
    try {
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .select('id, name')
        .in('id', templateIds);
      
      if (!templateError && templateData) {
        // Create a map of template ids to names for quick lookup
        templateData.forEach(template => {
          templateMap.set(template.id, template.name);
        });
      }
    } catch (e) {
      console.error('Error fetching template names:', e);
      // Continue with empty map - we'll use "Unknown Template"
    }
    
    // Format data for frontend
    return data.map(item => ({
      id: item.template_id,
      name: templateMap.get(item.template_id) || 'Unknown Template',
      usage_count: item.usage_count || 0,
      avg_generation_time: item.avg_generation_time || 0
    }));
  } catch (error) {
    console.error('Error fetching popular templates:', error);
    return [];
  }
}; 
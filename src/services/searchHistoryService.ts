import { supabase } from './supabase';
import { SearchFilters } from '../types/governmentSupport';

export interface SearchHistoryEntry {
  id: string;
  keyword: string;
  filters: {
    regions?: string[];
    supportAreas?: string[];
    keyword?: string;
  };
  search_date: string;
}

/**
 * Add a search to history
 */
export async function addSearchToHistory(filters: SearchFilters): Promise<string | null> {
  try {
    // Get the session
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Exit early if not authenticated
    if (!sessionData.session) {
      console.log('Not adding search to history: User not authenticated');
      return null;
    }
    
    // Convert the search filters to a format suitable for storage
    const { data, error } = await supabase.rpc('add_search_history', {
      keyword: filters.keyword || '',
      filters: JSON.stringify(filters)
    });
    
    if (error) {
      console.error('Error adding search to history:', error);
      return null;
    }
    
    console.log('Search added to history:', data);
    return data;
  } catch (err) {
    console.error('Exception adding search to history:', err);
    return null;
  }
}

/**
 * Get search history for the current user
 */
export async function getSearchHistory(limit: number = 20, offset: number = 0): Promise<SearchHistoryEntry[]> {
  try {
    // Get the session
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Exit early if not authenticated
    if (!sessionData.session) {
      console.log('Cannot get search history: User not authenticated');
      return [];
    }
    
    const { data, error } = await supabase.rpc('get_search_history', {
      limit_count: limit,
      offset_count: offset
    });
    
    if (error) {
      console.error('Error getting search history:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception getting search history:', err);
    return [];
  }
}

/**
 * Delete all search history for the current user
 */
export async function deleteAllSearchHistory(): Promise<boolean> {
  try {
    // Get the session
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Exit early if not authenticated
    if (!sessionData.session) {
      console.log('Cannot delete search history: User not authenticated');
      return false;
    }
    
    const { error } = await supabase.rpc('delete_all_search_history');
    
    if (error) {
      console.error('Error deleting all search history:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception deleting all search history:', err);
    return false;
  }
}

/**
 * Delete a specific search history entry
 */
export async function deleteSearchHistoryEntry(id: string): Promise<boolean> {
  try {
    // Get the session
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Exit early if not authenticated
    if (!sessionData.session) {
      console.log('Cannot delete search history entry: User not authenticated');
      return false;
    }
    
    const { data, error } = await supabase.rpc('delete_search_history_entry', {
      entry_id: id
    });
    
    if (error) {
      console.error('Error deleting search history entry:', error);
      return false;
    }
    
    return data || false;
  } catch (err) {
    console.error('Exception deleting search history entry:', err);
    return false;
  }
} 
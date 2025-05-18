import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  GovSupportProgram, 
  SearchFilters 
} from '../types/governmentSupport';
import { 
  searchSupportPrograms, 
  toggleBookmark as toggleBookmarkApi,
  getBookmarkedProgramIds 
} from '../services/governmentSupportService';
import { addSearchToHistory } from '../services/searchHistoryService';

interface GovSupportContextType {
  programs: GovSupportProgram[];
  isLoading: boolean;
  error: string | null;
  search: (filters: SearchFilters) => Promise<void>;
  toggleBookmark: (programId: string, isBookmarked: boolean) => Promise<void>;
  bookmarkedIds: string[];
  reloadBookmarks: () => void;
  filters: SearchFilters;
  page: number;
  pageSize: number;
  totalItems: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

const GovSupportContext = createContext<GovSupportContextType | undefined>(undefined);

export function useGovSupport() {
  const context = useContext(GovSupportContext);
  if (context === undefined) {
    throw new Error('useGovSupport must be used within a GovSupportProvider');
  }
  return context;
}

interface GovSupportProviderProps {
  children: ReactNode;
}

export function GovSupportProvider({ children }: GovSupportProviderProps) {
  const [programs, setPrograms] = useState<GovSupportProgram[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Load bookmarked programs on mount
  const reloadBookmarks = () => {
    try {
      const ids = getBookmarkedProgramIds();
      console.log('Loaded bookmarked ids:', ids);
      setBookmarkedIds(ids);
      
      // Update isBookmarked flag for any programs currently in the list
      if (programs.length > 0) {
        setPrograms(prevPrograms => 
          prevPrograms.map(program => ({
            ...program,
            isBookmarked: ids.includes(program.id)
          }))
        );
      }
    } catch (err) {
      console.error('Error loading bookmarked IDs:', err);
    }
  };
  
  // Load bookmarks on mount
  useEffect(() => {
    reloadBookmarks();
  }, []);

  const search = async (newFilters: SearchFilters) => {
    setIsLoading(true);
    setError(null);
    
    // Reset to page 1 whenever we search with new filters
    // Only reset page if filters actually changed
    const isNewSearch = JSON.stringify(filters) !== JSON.stringify(newFilters);
    if (isNewSearch) {
      setPage(1);
    }
    
    // Log search request to help with debugging
    console.log('=== SEARCH REQUESTED FROM CONTEXT ===');
    console.log('Current Filters:', JSON.stringify(filters));
    console.log('New Filters:', JSON.stringify(newFilters));
    console.log('Current page:', page);
    
    // Save the new filters
    setFilters(newFilters);
    
    try {
      console.log('Calling searchSupportPrograms service with filters:', JSON.stringify(newFilters));
      // Use the current page if this is a page change, otherwise use page 1 for new searches
      const currentPage = isNewSearch ? 1 : page;
      const response = await searchSupportPrograms(newFilters, currentPage, pageSize);
      console.log('Search response received:', response.items.length, 'items');
      console.log('Total items reported by API:', response.total);
      
      // Update state with the response data and apply bookmark state
      setPrograms(response.items.map(program => ({
        ...program,
        isBookmarked: bookmarkedIds.includes(program.id)
      })));
      
      setTotalItems(response.total);
      console.log('State updated with programs:', response.items.length);
      console.log('Total items count:', response.total);
      
      // Record the search in history if it's a new search (not just pagination)
      if (isNewSearch && newFilters.keyword) {
        // Only record searches with keywords
        console.log('Recording search in history:', newFilters);
        await addSearchToHistory(newFilters);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setPrograms([]);
      setTotalItems(0);
      console.error('Search error:', errorMessage);
    } finally {
      setIsLoading(false);
      console.log('Search completed, loading state set to false');
    }
  };

  const toggleBookmark = async (programId: string, isBookmarked: boolean) => {
    try {
      console.log(`Toggling bookmark for program ${programId}, isBookmarked=${isBookmarked}`);
      const success = await toggleBookmarkApi(programId, isBookmarked);
      
      if (success) {
        // Update local state
        if (isBookmarked) {
          console.log(`Adding ${programId} to bookmarked IDs`);
          setBookmarkedIds(prev => [...prev, programId]);
        } else {
          console.log(`Removing ${programId} from bookmarked IDs`);
          setBookmarkedIds(prev => prev.filter(id => id !== programId));
        }
        
        // Update the program list
        setPrograms(prev => 
          prev.map(program => 
            program.id === programId 
              ? { ...program, isBookmarked } 
              : program
          )
        );
        
        return;
      }
      
      throw new Error('Failed to toggle bookmark');
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setError(err instanceof Error ? err.message : 'Error toggling bookmark');
      throw err;
    }
  };

  // When page changes, reload data
  useEffect(() => {
    // Check if we have filters and not during initial setup
    if (Object.keys(filters).length > 0) {
      // Load data on ALL page changes, not just when page > 1
      console.log(`Page changed to ${page}, reloading data with existing filters:`, JSON.stringify(filters));
      search(filters);
    }
  }, [page]);

  // When filters change, the search function already handles this
  // but we keep this effect to ensure any programmatic filter changes
  // trigger a search
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      // We don't need to call search here as it's already called when
      // setFilters is triggered in the search function
      console.log('Filters changed:', filters);
    }
  }, [filters]);

  const value = {
    programs,
    isLoading,
    error,
    search,
    toggleBookmark,
    bookmarkedIds,
    reloadBookmarks,
    filters,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize
  };

  return (
    <GovSupportContext.Provider value={value}>
      {children}
    </GovSupportContext.Provider>
  );
} 
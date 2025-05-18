import { fetchAPI } from './api';
import { GovSupportProgram, SearchFilters, SearchResponse } from '../types/governmentSupport';
import { debounce } from '../utils/performance';

// Bizinfo API key from environment variables
const API_KEY = import.meta.env.VITE_BIZINFO_API_KEY || '';

// Detect environment to use appropriate endpoint
const isDevelopment = import.meta.env.DEV;
// In development, use Vite's proxy, in production use our direct endpoint
const API_ENDPOINT = isDevelopment ? '/bizinfo-api' : '/api/bizinfo';

// Implement memoization for search results
const searchCache = new Map<string, SearchResponse>();
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Create a debounced search function
export const debouncedSearch = debounce((
  filters: SearchFilters,
  page: number,
  pageSize: number,
  callback: (result: SearchResponse) => void,
  errorCallback: (error: Error) => void
) => {
  searchSupportPrograms(filters, page, pageSize)
    .then(callback)
    .catch(errorCallback);
}, 300);

/**
 * Search for government support programs
 */
export async function searchSupportPrograms(
  filters: SearchFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResponse> {
  try {
    // Ensure page is at least 1
    page = Math.max(1, page);
    
    // Create cache key from search parameters
    const cacheKey = JSON.stringify({ filters, page, pageSize });
    
    // Check if we have a valid cached result
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult && cachedResult.timestamp && Date.now() - cachedResult.timestamp < SEARCH_CACHE_TTL) {
      console.log('Using cached search results');
      return cachedResult;
    }
    
    // Check if filters are applied
    const hasFilters = (filters.regions && filters.regions.length > 0) || 
                      (filters.supportAreas && filters.supportAreas.length > 0) ||
                      (filters.keyword && filters.keyword.trim() !== '') ||
                      (filters.thisWeekOnly === true) ||
                      (filters.endingSoon === true);
    
    // Request more items when filtering to ensure we have enough after filtering
    const apiPageSize = hasFilters ? Math.min(100, pageSize * 3) : pageSize; 
    
    // When filtering, we need to request more items from earlier pages
    // so we have enough after filtering
    const apiPage = hasFilters ? 1 : page;
    
    // Build the URL parameters
    const params = new URLSearchParams();
    params.append('crtfcKey', API_KEY);
    params.append('dataType', 'json');
    params.append('pageUnit', apiPageSize.toString());
    params.append('pageIndex', apiPage.toString());
    
    // Log request parameters
    console.log(`Requesting API page ${apiPage} with pageSize ${apiPageSize} (client pageSize: ${pageSize}, client page: ${page})`);
    
    // Add keyword search
    if (filters.keyword && filters.keyword.trim()) {
      params.append('searchKrwd', filters.keyword.trim());
    }
    
    // Add support area filter (map from Korean names to codes)
    if (filters.supportAreas && filters.supportAreas.length > 0) {
      console.log('Applying server-side support area filter:', filters.supportAreas);
      
      const supportAreaMap: { [key: string]: string } = {
        '자금': '01',
        '기술': '02',
        '인력': '03',
        '수출': '04',
        '내수': '05',
        '창업': '06',
        '경영': '07',
        '기타': '09'
      };
      
      console.log('Support areas from filter:', filters.supportAreas);
      
      const supportAreaIds = filters.supportAreas
        .map(area => {
          const id = supportAreaMap[area];
          console.log(`Mapping area "${area}" to ID: ${id || 'not found'}`);
          return id;
        })
        .filter(Boolean); // Filter out any null or undefined values
        
      console.log('Final support area IDs for API request:', supportAreaIds);
        
      if (supportAreaIds.length > 0) {
        const supportAreaParam = supportAreaIds.join(',');
        params.append('pldirSportRealmLclasCode', supportAreaParam);
        console.log('Support area filter applied with parameter:', supportAreaParam);
      } else {
        console.log('No valid support area IDs found, filter not applied');
      }
    }
    
    // Add region filter
    if (filters.regions && filters.regions.length > 0) {
      // For region filtering, we'll look at the hashtags directly
      // This ensures we filter by the geographic region
      console.log('Applying server-side region filter:', filters.regions);
      
      // The API might be expecting hashtags in a specific format
      // Let's log what we're sending and try different formats if needed
      const regionParam = filters.regions.join(',');
      
      // Apply hashtag filter (using # prefix for each region)
      const hashtagsParam = filters.regions.map(r => `#${r}`).join(',');
      console.log('Using formatted hashtags parameter:', hashtagsParam);
      params.append('hashtags', hashtagsParam);
      
      // Also try region as a direct parameter
      params.append('areaNm', regionParam);
      console.log('Also applied region filter with areaNm parameter:', regionParam);
    }
    
    // Log the request URL
    const requestUrl = `${API_ENDPOINT}?${params.toString()}`;
    console.log('Making API request to:', requestUrl);
    
    // Set performance measurements
    const startTime = performance.now();
    
    // Make the API call with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced from 60s to 10s
    
    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Measure response time
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      console.log(`API response time: ${responseTime.toFixed(2)}ms`);
      
      // Log warning if response time exceeds requirement
      if (responseTime > 300) {
        console.warn(`API response time exceeds target (300ms): ${responseTime.toFixed(2)}ms`);
      }
      
      if (!response.ok) {
        console.error(`API responded with status ${response.status}: ${response.statusText}`);
        throw new Error(`API error: ${response.status}`);
      }
      
      // Check the content type to ensure it's JSON
      const contentType = response.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) {
        console.error(`API returned non-JSON content type: ${contentType}`);
        throw new Error('API returned invalid content type. Expected JSON, got ' + contentType);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Response text:', await response.text());
        throw new Error('Invalid JSON response from API. Please verify API key and server status.');
      }
      
      console.log('API response received:', data);
      
      // Check for API error
      if (data && data.reqErr) {
        console.error('API returned an error:', data.reqErr);
        throw new Error(`API error: ${data.reqErr}`);
      }
      
      // Check for success property
      if (data && data.success === false) {
        console.error('API returned an error response:', data.error || data.message);
        throw new Error(data.error || data.message || 'Unknown API error');
      }
      
      // Transform the API response to our format with filters for client-side filtering
      const result = processApiResponse(data, page, pageSize, filters);
      
      // Cache the result with timestamp
      result.timestamp = Date.now();
      searchCache.set(cacheKey, result);
      
      return result;
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('API request timed out after 10 seconds');
        throw new Error('API request timed out. 서버 응답이 늦어져 요청이 취소되었습니다.');
      }
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Error searching support programs:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while fetching support programs';
    throw new Error(errorMessage);
  }
}

/**
 * Process API response data
 */
function processApiResponse(data: any, page: number, pageSize: number, filters: SearchFilters = {}): SearchResponse {
  // Log the data format
  console.log('Processing API data:', data);
  
  let items: any[] = [];
  let totalCount = 0;
  
  // Handle the jsonArray format
  if (data && data.jsonArray && Array.isArray(data.jsonArray)) {
    console.log('Processing jsonArray format');
    items = data.jsonArray;
    
    // Get the total count from the first item
    if (items.length > 0 && items[0].totCnt) {
      totalCount = parseInt(items[0].totCnt, 10);
      console.log(`Retrieved total count from API: ${totalCount}`);
    } else {
      totalCount = items.length;
      console.log(`No total count found, using items length: ${totalCount}`);
    }
  } 
  // Handle the response.body.items format
  else if (data && data.response && data.response.body) {
    console.log('Processing response.body format');
    if (data.response.body.items) {
      items = Array.isArray(data.response.body.items) 
        ? data.response.body.items 
        : [data.response.body.items];
    }
    
    if (data.response.body.totalCount) {
      totalCount = parseInt(data.response.body.totalCount, 10);
    } else {
      totalCount = items.length;
    }
  } 
  // Unknown format or empty response
  else {
    console.warn('Unknown API response format or empty results:', data);
    return { items: [], total: 0, page, pageSize };
  }
  
  // Check if items is empty or null/undefined
  if (!items || items.length === 0) {
    console.log('No items found in API response');
    return { items: [], total: 0, page, pageSize };
  }
  
  // Map items to our GovSupportProgram type
  let transformedItems: GovSupportProgram[] = items.map((item: any) => {
    // Log the first item to understand its structure
    if (items.indexOf(item) === 0) {
      console.log('First item structure:', item);
    }
    
    // Map support area codes to Korean names
    let supportArea = item.pldirSportRealmLclasCodeNm || '';
    
    // Ensure support area is in Korean
    if (!supportArea || supportArea.match(/^[a-zA-Z\s]+$/)) {
      // If it's only English or empty, translate based on code
      const areaCode = item.pldirSportRealmLclasCode || '';
      const supportAreaCodeMap: Record<string, string> = {
        '01': '자금',
        '02': '기술',
        '03': '인력',
        '04': '수출',
        '05': '내수',
        '06': '창업',
        '07': '경영',
        '09': '기타'
      };
      supportArea = supportAreaCodeMap[areaCode] || supportArea || '기타';
    }
    
    // Extract announcement date from available fields
    const announcementDate = item.pblancDe || item.announcementDate || '';
    
    return {
      id: item.pblancId || item.bizId || item.SN || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: item.pblancNm || item.bizNm || item.PBLANC_TI || '알 수 없음',
      region: item.jrsdInsttNm || item.areaNm || item.JRSD_ORGZ_NM || '전국',
      // Extract geographic regions from hashtags if available
      geographicRegions: item.hashtags ? extractRegionsFromHashtags(item.hashtags) : ['전국'],
      supportArea: supportArea,
      supportAreaId: item.pldirSportRealmLclasCode || item.PBLANC_REALMS || '09',
      description: item.bsnsSumryCn || item.bizSumryCn || item.PBLANC_CN || '',
      applicationDeadline: item.reqstBeginEndDe || item.rceptEndDe || item.RCP_BGNDE_DT || '진행중',
      amount: item.sportAmtContent || item.SPT_FND || '미정',
      applicationUrl: item.rceptEngnHmpgUrl || item.APPLY_URL || '',
      isBookmarked: false,
      announcementDate: announcementDate
    };
  });
  
  // Apply client-side filtering if needed for more granular filtering
  let hasAppliedFilters = false;
  
  // Apply support area filter if specified
  if (filters.supportAreas && filters.supportAreas.length > 0) {
    console.log('Applying client-side support area filter:', filters.supportAreas);
    
    hasAppliedFilters = true;
    // Create a set for faster lookups
    const supportAreaSet = new Set(filters.supportAreas);
    
    transformedItems = transformedItems.filter(item => {
      return supportAreaSet.has(item.supportArea);
    });
    
    console.log(`After support area filtering: ${transformedItems.length} items remaining`);
  }
  
  // Apply region filter if specified
  if (filters.regions && filters.regions.length > 0) {
    console.log('Applying client-side region filter:', filters.regions);
    
    hasAppliedFilters = true;
    transformedItems = transformedItems.filter(item => {
      // For region filtering, check if any of the item's regions match any selected regions
      return item.geographicRegions.some(region => filters.regions?.includes(region));
    });
    
    console.log(`After region filtering: ${transformedItems.length} items remaining`);
  }
  
  // Apply this week only filter if specified
  if (filters.thisWeekOnly) {
    console.log('Applying client-side filter for programs announced this week');
    
    hasAppliedFilters = true;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    transformedItems = transformedItems.filter(program => {
      if (program.announcementDate) {
        try {
          const announcementDate = new Date(program.announcementDate);
          return announcementDate >= startOfWeek;
        } catch (e) {
          console.warn(`Could not parse announcement date: ${program.announcementDate}`);
        }
      }
      
      // Fallback: check application deadline as a proxy for recency
      if (program.applicationDeadline) {
        try {
          const deadline = new Date(program.applicationDeadline);
          const fourWeeksFromNow = new Date(now);
          fourWeeksFromNow.setDate(now.getDate() + 28);
          
          // If the deadline is more than 4 weeks away, it might be a recently announced program
          return deadline > fourWeeksFromNow;
        } catch (e) {
          console.warn(`Could not parse application deadline: ${program.applicationDeadline}`);
        }
      }
      
      return false;
    });
    
    console.log(`After this week only filtering: ${transformedItems.length} items remaining`);
  }
  
  // Apply ending soon filter if specified
  if (filters.endingSoon) {
    console.log('Applying client-side filter for programs with approaching deadlines');
    
    hasAppliedFilters = true;
    const now = new Date();
    const oneWeekFromNow = new Date(now);
    oneWeekFromNow.setDate(now.getDate() + 7); // 7 days from now
    
    transformedItems = transformedItems.filter(program => {
      if (program.applicationDeadline) {
        try {
          // Skip programs with "진행중" or other non-date strings
          if (program.applicationDeadline === '진행중' || 
              program.applicationDeadline === '상시' || 
              program.applicationDeadline.includes('상시')) {
            return false;
          }
          
          // Parse the deadline date, handling various formats
          let deadline: Date | null = null;
          
          // Try to extract date from common formats
          // Format: YYYYMMDD or YYYY-MM-DD or YYYY.MM.DD
          const dateMatch = program.applicationDeadline.match(/(\d{4})[-.\/]?(\d{2})[-.\/]?(\d{2})/);
          if (dateMatch) {
            const [_, year, month, day] = dateMatch;
            deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            // Fallback to direct parsing
            deadline = new Date(program.applicationDeadline);
          }
          
          // Check if deadline is valid and within the next week
          if (deadline && !isNaN(deadline.getTime())) {
            return deadline >= now && deadline <= oneWeekFromNow;
          }
        } catch (e) {
          console.warn(`Could not parse application deadline: ${program.applicationDeadline}`);
        }
      }
      
      return false;
    });
    
    console.log(`After ending soon filtering: ${transformedItems.length} items remaining`);
  }
  
  // If we applied any filters, adjust the total count
  if (hasAppliedFilters) {
    // Update total count for pagination
    totalCount = transformedItems.length;
    console.log(`Updated total count after client filtering: ${totalCount}`);
  }
  
  // Sort programs in chronological order (newest first)
  console.log('Sorting programs in chronological order');
  transformedItems.sort((a, b) => {
    // Helper function to parse dates safely and handle different formats
    const getComparableDate = (program: GovSupportProgram) => {
      // Try different date fields in order of preference
      if (program.announcementDate) {
        try {
          return new Date(program.announcementDate).getTime();
        } catch (e) {
          console.warn(`Could not parse announcement date: ${program.announcementDate}`);
        }
      }
      
      // Fallback to application deadline as a proxy for recency
      if (program.applicationDeadline) {
        try {
          return new Date(program.applicationDeadline).getTime();
        } catch (e) {
          console.warn(`Could not parse application deadline: ${program.applicationDeadline}`);
        }
      }
      
      // If all parsing fails, return a default old date (puts these at the end)
      return 0;
    };
    
    const dateA = getComparableDate(a);
    const dateB = getComparableDate(b);
    
    // Sort newest first (descending order)
    return dateB - dateA;
  });
  
  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, transformedItems.length);
  
  // Check for valid pagination
  if (startIndex >= transformedItems.length && transformedItems.length > 0) {
    // If requested page is beyond available items, but there are items,
    // return the first page instead of empty results
    console.log(`Page ${page} is beyond available items, returning first page instead`);
    
    return {
      items: transformedItems.slice(0, pageSize),
      total: totalCount,  
      page: 1,
      pageSize
    };
  }
  
  // Get the items for this page
  const paginatedItems = transformedItems.slice(startIndex, endIndex);
  
  // Log pagination info
  console.log('===== PAGINATION INFO =====');
  console.log(`Total items: ${totalCount}`);
  console.log(`Items after filtering: ${transformedItems.length}`);
  console.log(`Page: ${page}, Page size: ${pageSize}`);
  console.log(`Returning ${paginatedItems.length} items for this page (${startIndex+1}-${endIndex})`);
  
  return {
    items: paginatedItems,
    total: totalCount,
    page,
    pageSize
  };
}

/**
 * Extract geographic regions from the hashtags string
 */
function extractRegionsFromHashtags(hashtags: string): string[] {
  console.log('Extracting regions from hashtags:', hashtags);
  
  const allRegions = [
    '서울', '부산', '인천', '대구', '광주', '대전', '울산', '세종', 
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ];
  
  const regions: string[] = [];
  
  // Check if each region is in the hashtags - looking more carefully
  allRegions.forEach(region => {
    // Check for the region with or without # prefix
    const hasRegion = hashtags.includes(region) || hashtags.includes(`#${region}`);
    if (hasRegion) {
      regions.push(region);
      console.log(`Found region '${region}' in hashtags`);
    }
  });
  
  // If no regions found, return 전국 (nationwide)
  const result = regions.length > 0 ? regions : ['전국'];
  console.log('Extracted regions:', result);
  return result;
}

/**
 * Bookmark or unbookmark a support program
 */
export async function toggleBookmark(programId: string, isBookmarked: boolean): Promise<boolean> {
  try {
    // Get current bookmarks from localStorage
    const bookmarksStr = localStorage.getItem('bookmarkedPrograms') || '[]';
    const bookmarks = JSON.parse(bookmarksStr) as string[];
    
    if (isBookmarked) {
      // Add to bookmarks if not already there
      if (!bookmarks.includes(programId)) {
        bookmarks.push(programId);
      }
    } else {
      // Remove from bookmarks
      const index = bookmarks.indexOf(programId);
      if (index !== -1) {
        bookmarks.splice(index, 1);
      }
    }
    
    // Save back to localStorage
    localStorage.setItem('bookmarkedPrograms', JSON.stringify(bookmarks));
    
    return true;
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return false;
  }
}

/**
 * Get all bookmarked program IDs
 */
export function getBookmarkedProgramIds(): string[] {
  try {
    const bookmarksStr = localStorage.getItem('bookmarkedPrograms') || '[]';
    return JSON.parse(bookmarksStr) as string[];
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
}

/**
 * Get all bookmarked programs - full data
 */
export async function getBookmarkedPrograms(): Promise<GovSupportProgram[]> {
  try {
    const bookmarkIds = getBookmarkedProgramIds();
    
    if (bookmarkIds.length === 0) {
      return [];
    }
    
    console.log('Fetching bookmarked programs with IDs:', bookmarkIds);
    
    // Try to get bookmarks from cache first
    const cachedResults: GovSupportProgram[] = [];
    let needApiCall = false;
    
    // Check all cached search results to find bookmarked programs
    for (const [key, value] of searchCache.entries()) {
      if (value && value.items) {
        // Add matching bookmarked items from cache
        const matches = value.items.filter(item => bookmarkIds.includes(item.id));
        if (matches.length > 0) {
          matches.forEach(match => {
            // Only add if not already in the results
            if (!cachedResults.some(item => item.id === match.id)) {
              cachedResults.push({ ...match, isBookmarked: true });
            }
          });
        }
      }
    }
    
    // If we found all bookmarked items in cache, return them
    if (cachedResults.length === bookmarkIds.length) {
      console.log('All bookmarked programs found in cache:', cachedResults.length);
      return cachedResults;
    }
    
    // If not all bookmarks were found in cache, make a search API call with a large pageSize
    // to try to get as many results as possible to find the bookmarked items
    console.log('Not all bookmarks found in cache, making API call');
    
    // Make a call with a large pageSize to try to get all possible programs
    const results = await searchSupportPrograms({}, 1, 200);
    
    // Combine cached results with new results from API
    const allItems = [...results.items];
    
    // Find all bookmarked items in the combined results
    const bookmarkedItems = allItems
      .filter(item => bookmarkIds.includes(item.id))
      .map(item => ({ ...item, isBookmarked: true }));
    
    // If we still don't have all bookmarked items, log warning
    if (bookmarkedItems.length < bookmarkIds.length) {
      console.warn(
        `Only found ${bookmarkedItems.length} out of ${bookmarkIds.length} bookmarked programs. Some bookmarks may be unavailable.`
      );
    }
    
    console.log('Returning bookmarked programs:', bookmarkedItems.length);
    return bookmarkedItems;
  } catch (error) {
    console.error('Error getting bookmarked programs:', error);
    return [];
  }
} 
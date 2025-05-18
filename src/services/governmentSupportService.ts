import { GovSupportProgram, SearchFilters, SearchResponse } from '../types/governmentSupport';
import { debounce } from '../utils/performance';

// Bizinfo API key from environment variables
const API_KEY = import.meta.env.VITE_BIZINFO_API_KEY || '';

// Detect environment to use appropriate endpoint
const isDevelopment = import.meta.env.DEV;
// In development, use Vite's proxy, in production use our direct endpoint
const API_ENDPOINT = isDevelopment ? '/bizinfo-api' : '/api/bizinfo/proxy';

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
    
    // Add retry mechanism
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let lastError: Error | null = null;
    
    while (retryCount <= MAX_RETRIES) {
      // Create a new controller for each attempt
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      try {
        console.log(`API request attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
        
        // Try first with the server endpoint
        let response;
        try {
          response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0',
              'Referer': 'https://www.bizinfo.go.kr/'
            },
            signal: controller.signal
          });
        } catch (fetchError) {
          console.error('Error with first fetch attempt:', fetchError);
          // If that fails, try the direct test endpoint
          const testUrl = '/api/bizinfo/test';
          console.log('Trying direct test endpoint:', testUrl);
          response = await fetch(testUrl, {
            method: 'GET',
            signal: controller.signal
          });
        }
        
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
        console.log('Response content type:', contentType);
        
        // Get response text first to see what we received
        const responseText = await response.text();
        
        // Try to parse as JSON regardless of content type
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Successfully parsed response as JSON');
          
          // Success! Process the data and return result
          // Transform the API response to our format with filters for client-side filtering
          const result = processApiResponse(data, page, pageSize, filters);
          
          // Cache the result with timestamp
          result.timestamp = Date.now();
          searchCache.set(cacheKey, result);
          
          return result;
          
        } catch (jsonError: unknown) {
          console.error('Failed to parse JSON response:', jsonError);
          console.error('Response first 100 chars:', responseText.substring(0, 100));
          
          // Check if we got HTML instead of JSON
          if (contentType.includes('text/html') || responseText.trim().startsWith('<')) {
            throw new Error('API returned invalid content type. Expected JSON, got text/html; charset=UTF-8');
          }
          
          // Throw error to trigger retry
          throw new Error(`Failed to parse API response: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error'}`);
        }
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('API request timed out after 10 seconds');
          lastError = new Error('API request timed out. 서버 응답이 늦어져 요청이 취소되었습니다.');
        } else {
          lastError = fetchError instanceof Error ? fetchError : new Error('Unknown fetch error');
        }
        
        retryCount++;
        
        if (retryCount <= MAX_RETRIES) {
          console.log(`Retrying API request (${retryCount}/${MAX_RETRIES})...`);
          // Small delay before retrying (increases with each retry)
          await new Promise(resolve => setTimeout(resolve, retryCount * 500));
        }
      }
    }
    
    // If we get here, all retries failed
    if (lastError) {
      throw lastError;
    } else {
      throw new Error('API returned invalid content type. Expected JSON, got text/html; charset=UTF-8\n\nAPI 키가 올바른지 확인하거나, 서버 상태를 확인해 주세요.\n\nAPI URL: https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do');
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
  try {
    console.log('Processing API response');
    console.log('Data structure:', Object.keys(data));
    
    // Ensure data has expected structure
    if (!data || !data.jsonArray) {
      console.warn('API returned unexpected data structure, using fallback data');
      
      // Return fallback data for development/testing
      return {
        items: [{
          id: 'fallback-1',
          title: '지원사업 데이터를 가져오지 못했습니다',
          region: '전국',
          geographicRegions: ['전국'],
          supportArea: '기타',
          supportAreaId: '09',
          description: '서버에서 데이터를 가져오는데 문제가 발생했습니다. 다시 시도해 주세요.',
          applicationDeadline: '2025-12-31',
          amount: '정보 없음',
          isBookmarked: false
        }],
        total: 1,
        page: 1,
        pageSize: 1
      };
    }
    
    // Get programs from response
    const programs = data.jsonArray;
    
    let items: any[] = [];
    let totalCount = 0;
    
    try {
      // Handle the jsonArray format
      if (programs && Array.isArray(programs)) {
        console.log('Processing jsonArray format, length:', programs.length);
        items = programs;
        
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
      else if (programs && programs.response && programs.response.body) {
        console.log('Processing response.body format');
        if (programs.response.body.items) {
          items = Array.isArray(programs.response.body.items) 
            ? programs.response.body.items 
            : [programs.response.body.items];
        }
        
        if (programs.response.body.totalCount) {
          totalCount = parseInt(programs.response.body.totalCount, 10);
        } else {
          totalCount = items.length;
        }
      } 
      // Handle direct array format (some APIs return a direct array)
      else if (Array.isArray(programs)) {
        console.log('Processing direct array format, length:', programs.length);
        items = programs;
        totalCount = programs.length;
      }
      // Unknown format or empty response
      else {
        console.warn('Unknown API response format or empty results:', programs);
        return { items: [], total: 0, page, pageSize };
      }
    } catch (err) {
      console.error('Error parsing API response structure:', err);
      throw err;
    }
    
    // Now, map API data to our format
    const allPrograms: GovSupportProgram[] = items.map(item => {
      // Extract deadline date from the "reqstBeginEndDe" field
      // Format is typically: "20250430 ~ 20250520" (YYYYMMDD)
      let applicationDeadline = '정보 없음';
      if (item.reqstBeginEndDe) {
        const match = item.reqstBeginEndDe.match(/~\s*(\d{8})/);
        if (match && match[1]) {
          const dateStr = match[1];
          try {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            applicationDeadline = `${year}-${month}-${day}`;
          } catch (e) {
            console.error('Failed to parse deadline date:', dateStr, e);
          }
        }
      }
      
      // Extract regions from hashtags
      const hashtagRegions = item.hashtags ? extractRegionsFromHashtags(item.hashtags) : [];
      // Use jrsdInsttNm as main region (this is the institution's region, like "서울특별시")
      const region = item.jrsdInsttNm || '전국';
      
      // Combine any geographic regions
      const geographicRegions = Array.from(new Set([
        ...hashtagRegions,
        region.includes('특별') ? region.replace('특별', '') : region // Clean up "특별" from names
      ])).filter(Boolean);
      
      return {
        id: item.pblancId || `program-${Math.random().toString(36).substring(2, 11)}`,
        title: item.pblancNm || '제목 없음',
        region: region,
        geographicRegions: geographicRegions.length > 0 ? geographicRegions : ['전국'],
        supportArea: item.pldirSportRealmLclasCodeNm || '기타',
        supportAreaId: item.pldirSportRealmLclasCode || '09',
        description: item.bsnsSumryCn || '내용 없음',
        applicationDeadline: applicationDeadline,
        amount: '지원금액 정보 없음', // Not provided in this API
        applicationUrl: item.pblancUrl ? `https://www.bizinfo.go.kr${item.pblancUrl}` : undefined,
        announcementDate: item.creatPnttm ? item.creatPnttm.split(' ')[0] : undefined
      };
    });
    
    // Client-side filtering based on filters
    let filteredPrograms = allPrograms;
    
    // If we're filtering by regions on client-side, apply that filter
    if (filters.regions && filters.regions.length > 0) {
      filteredPrograms = filteredPrograms.filter(program => {
        // Include programs that have at least one matching region or have "전국" (nationwide)
        const isNationwide = program.geographicRegions.some(r => r === '전국');
        const hasMatchingRegion = program.geographicRegions.some(r => 
          filters.regions!.includes(r)
        );
        return isNationwide || hasMatchingRegion;
      });
    }
    
    // If we're filtering by support areas on client-side, apply that filter
    if (filters.supportAreas && filters.supportAreas.length > 0) {
      filteredPrograms = filteredPrograms.filter(program => 
        filters.supportAreas!.includes(program.supportArea)
      );
    }
    
    // Filter for programs posted this week
    if (filters.thisWeekOnly) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      filteredPrograms = filteredPrograms.filter(program => {
        if (!program.announcementDate) return false;
        
        try {
          const announcementDate = new Date(program.announcementDate);
          return announcementDate >= oneWeekAgo;
        } catch (e) {
          console.error('Failed to parse announcement date:', program.announcementDate, e);
          return false;
        }
      });
    }
    
    // Filter for programs ending soon (within 2 weeks)
    if (filters.endingSoon) {
      const now = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
      
      filteredPrograms = filteredPrograms.filter(program => {
        if (!program.applicationDeadline || program.applicationDeadline === '정보 없음') return false;
        
        try {
          const deadlineDate = new Date(program.applicationDeadline);
          return deadlineDate >= now && deadlineDate <= twoWeeksLater;
        } catch (e) {
          console.error('Failed to parse deadline date for filtering:', program.applicationDeadline, e);
          return false;
        }
      });
    }
    
    // For pagination when we've client-side filtered
    const hasClientFiltering = filters.regions?.length || 
                              filters.supportAreas?.length || 
                              filters.thisWeekOnly || 
                              filters.endingSoon;
    
    let paginatedPrograms: GovSupportProgram[];
    let effectiveTotal: number;
    
    if (hasClientFiltering) {
      // If we've applied client-side filters, we need to paginate the filtered results
      effectiveTotal = filteredPrograms.length;
      const startIndex = (page - 1) * pageSize;
      paginatedPrograms = filteredPrograms.slice(startIndex, startIndex + pageSize);
    } else {
      // If no client-side filtering, use the API's pagination (already done)
      paginatedPrograms = filteredPrograms;
      effectiveTotal = totalCount;
    }
    
    console.log(`Returning ${paginatedPrograms.length} programs (page ${page}, total: ${effectiveTotal})`);
    
    return {
      items: paginatedPrograms,
      total: effectiveTotal,
      page,
      pageSize
    };
  } catch (error) {
    console.error('Error processing API response:', error);
    // Return fallback data
    return {
      items: [{
        id: 'error-1',
        title: '데이터 처리 중 오류가 발생했습니다',
        region: '전국',
        geographicRegions: ['전국'],
        supportArea: '기타',
        supportAreaId: '09',
        description: '데이터를 처리하는 과정에서 오류가 발생했습니다. 다시 시도해 주세요.',
        applicationDeadline: '2025-12-31',
        amount: '정보 없음',
        isBookmarked: false
      }],
      total: 1,
      page: 1,
      pageSize: 1
    };
  }
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
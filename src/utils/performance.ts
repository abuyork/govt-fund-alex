/**
 * Performance optimization utilities for the application
 */

// Cache for API responses to avoid redundant network requests
export const apiCache = new Map<string, { data: any; timestamp: number }>();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Check if a cached response is still valid
 */
export function isValidCache(key: string): boolean {
  const cachedData = apiCache.get(key);
  if (!cachedData) return false;
  
  const now = Date.now();
  return now - cachedData.timestamp < CACHE_TTL;
}

/**
 * Cache API response data
 */
export function cacheApiResponse(key: string, data: any): void {
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Get cached API response data
 */
export function getCachedResponse(key: string): any {
  return apiCache.get(key)?.data;
}

/**
 * Clear cached data for a specific key
 */
export function clearCacheForKey(key: string): void {
  apiCache.delete(key);
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  apiCache.clear();
}

/**
 * Create a cache key from API parameters
 */
export function createCacheKey(endpoint: string, params: Record<string, any>): string {
  return `${endpoint}:${JSON.stringify(params)}`;
}

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Measure and log API response time
 */
export function measureApiResponseTime(
  apiCall: () => Promise<any>,
  apiName: string
): Promise<any> {
  const startTime = performance.now();
  
  return apiCall()
    .then(result => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      console.log(`API ${apiName} response time: ${responseTime.toFixed(2)}ms`);
      
      // Log warning if response time exceeds threshold (300ms)
      if (responseTime > 300) {
        console.warn(`API ${apiName} response time exceeds threshold: ${responseTime.toFixed(2)}ms`);
      }
      
      return result;
    })
    .catch(error => {
      const endTime = performance.now();
      console.error(`API ${apiName} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw error;
    });
} 
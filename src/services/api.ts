// Base API configuration =  'https://magical-biscuit-e54d29.netlify.app/'
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/";
import {
  createCacheKey,
  isValidCache,
  getCachedResponse,
  cacheApiResponse,
  measureApiResponseTime,
} from "../utils/performance";

// Utility function for making HTTP requests
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  enableCache: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(url, "url---1");

  // Create a cache key based on URL and request data
  const requestBody = options.body ? JSON.stringify(options.body) : "";
  const cacheKey = createCacheKey(url, {
    method: options.method || "GET",
    body: requestBody,
    headers: options.headers || {},
  });

  // Check cache for valid response
  if (
    enableCache &&
    options.method?.toUpperCase() === "GET" &&
    isValidCache(cacheKey)
  ) {
    console.log(`Using cached response for ${url}`);
    return getCachedResponse(cacheKey);
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Measure API response time
  return measureApiResponseTime(async () => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Handle HTTP errors
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    // For 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    // Cache successful GET responses
    if (
      enableCache &&
      options.method?.toUpperCase() !== "PUT" &&
      options.method?.toUpperCase() !== "POST" &&
      options.method?.toUpperCase() !== "DELETE"
    ) {
      cacheApiResponse(cacheKey, data);
    }

    return data;
  }, `${options.method || "GET"} ${endpoint}`);
}

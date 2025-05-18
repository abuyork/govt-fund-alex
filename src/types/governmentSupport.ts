export interface GovSupportProgram {
  id: string;
  title: string;
  region: string; // This now represents jurisdiction institution name
  geographicRegions: string[]; // Array of geographic locations
  supportArea: string;
  supportAreaId: string;
  description: string;
  applicationDeadline: string;
  amount: string;
  applicationUrl?: string;
  isBookmarked?: boolean;
  announcementDate?: string; // Date when the program was announced
}

export interface SearchFilters {
  keyword?: string;
  regions?: string[];
  supportAreas?: string[];
  thisWeekOnly?: boolean; // Filter for programs announced this week
  endingSoon?: boolean; // Filter for programs with approaching deadlines
}

export interface SearchResponse {
  items: GovSupportProgram[];
  total: number;
  page: number;
  pageSize: number;
  timestamp?: number; // Added for caching purposes
  error?: string; // Added for error handling
} 
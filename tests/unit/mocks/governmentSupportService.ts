// Mock of the governmentSupportService without import.meta.env dependencies

import { GovSupportProgram, SearchFilters } from '../../../src/types/governmentSupport';

// Mock programs that can be used in tests
export const mockPrograms = [
  {
    id: 'prog-1',
    title: '기술개발 지원 프로그램',
    description: '중소기업 기술개발 지원',
    region: '서울',
    geographicRegions: ['서울'],
    supportArea: '기술개발',
    applicationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'prog-2',
    title: '마케팅 지원 프로그램',
    description: '중소기업 마케팅 지원',
    region: '부산',
    geographicRegions: ['부산'],
    supportArea: '마케팅',
    applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  }
] as unknown as GovSupportProgram[];

// Mock the searchSupportPrograms function
export const searchSupportPrograms = jest.fn(async (filters?: SearchFilters): Promise<GovSupportProgram[]> => {
  if (!filters) return mockPrograms;
  
  let filtered = [...mockPrograms];
  
  if (filters.regions && Array.isArray(filters.regions) && filters.regions.length > 0) {
    const regions = filters.regions;
    filtered = filtered.filter(p => 
      regions.includes(p.region) || 
      p.geographicRegions?.some(region => regions.includes(region))
    );
  }
  
  if (filters.supportAreas && Array.isArray(filters.supportAreas) && filters.supportAreas.length > 0) {
    const supportAreas = filters.supportAreas;
    filtered = filtered.filter(p => supportAreas.includes(p.supportArea));
  }
  
  return filtered;
});

// Mock function to get program details
export const getProgramDetails = jest.fn(async (programId: string): Promise<GovSupportProgram | null> => {
  const program = mockPrograms.find(p => p.id === programId);
  return program || null;
});

// Mock function to refresh programs from external API
export const refreshProgramsFromAPI = jest.fn(async (): Promise<{ added: number, updated: number, error?: string }> => {
  return { added: 5, updated: 2 };
}); 
import { Bookmark, Briefcase, Clock, Filter, MapPin, Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { GovSupportProvider, useGovSupport } from '../../contexts/GovSupportContext';

export default function SupportPrograms() {
  return (
    <GovSupportProvider>
      <SupportProgramsContent />
    </GovSupportProvider>
  );
}

function SupportProgramsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSupportAreas, setSelectedSupportAreas] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showThisWeekOnly, setShowThisWeekOnly] = useState(false);
  const [showEndingSoon, setShowEndingSoon] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Use refs instead of state for timeouts to avoid dependency issues
  const searchDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keywordDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Also use refs for the current filter values to avoid dependency issues
  const searchTermRef = useRef(searchTerm);
  const selectedRegionsRef = useRef(selectedRegions);
  const selectedSupportAreasRef = useRef(selectedSupportAreas);
  const showThisWeekOnlyRef = useRef(showThisWeekOnly);
  const showEndingSoonRef = useRef(showEndingSoon);

  const {
    programs,
    isLoading,
    error,
    search,
    toggleBookmark,
    page,
    setPage,
    pageSize,
    totalItems
  } = useGovSupport();

  // Use localError or context error
  const displayError = localError || error;

  // Store search function in a ref to avoid dependency issues
  const searchRef = useRef(search);

  // Update refs when values change
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    selectedRegionsRef.current = selectedRegions;
  }, [selectedRegions]);

  useEffect(() => {
    selectedSupportAreasRef.current = selectedSupportAreas;
  }, [selectedSupportAreas]);

  useEffect(() => {
    showThisWeekOnlyRef.current = showThisWeekOnly;
  }, [showThisWeekOnly]);

  useEffect(() => {
    showEndingSoonRef.current = showEndingSoon;
  }, [showEndingSoon]);

  const regions = [
    '서울', '부산', '인천', '대구', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '전국'
  ];
  const supportAreas = [
    { id: '01', name: '자금' },
    { id: '02', name: '기술' },
    { id: '03', name: '인력' },
    { id: '04', name: '수출' },
    { id: '05', name: '내수' },
    { id: '06', name: '창업' },
    { id: '07', name: '경영' },
    { id: '09', name: '기타' },
  ];

  const toggleRegion = (region: string) => {
    console.log(`Toggling region: ${region}`);
    setSelectedRegions(prev => {
      const newValue = prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region];
      console.log(`Updated selectedRegions:`, newValue);
      return newValue;
    });
  };

  const toggleSupportArea = (area: string) => {
    console.log(`Toggling support area: ${area}`);
    setSelectedSupportAreas(prev => {
      const newValue = prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area];
      console.log(`Updated selectedSupportAreas:`, newValue);
      return newValue;
    });
  };

  const clearFilters = () => {
    console.log('Clearing all filters');
    setSelectedRegions([]);
    setSelectedSupportAreas([]);
    setSearchTerm('');
    setShowThisWeekOnly(false);
    setShowEndingSoon(false);
    console.log('After clearing - selectedRegions:', []);
    console.log('After clearing - selectedSupportAreas:', []);
    console.log('After clearing - showThisWeekOnly:', false);
    console.log('After clearing - showEndingSoon:', false);
    performSearchRef.current('', [], [], false, false);
  };

  // Create a stable search function as a ref-based function - not a callback
  const performSearch = (keyword: string, regions: string[], areas: string[], thisWeekOnly: boolean, endingSoon: boolean) => {
    console.log('=== PERFORM SEARCH CALLED ===');
    console.log('Search parameters:');
    console.log('- Keyword:', keyword || '(none)');
    console.log('- Regions:', regions.length ? regions.join(', ') : '(none)');
    console.log('- Support Areas:', areas.length ? areas.join(', ') : '(none)');
    console.log('- This Week Only:', thisWeekOnly);
    console.log('- Ending Soon:', endingSoon);

    // Make sure we're sending arrays even if they're empty
    const searchFilters = {
      keyword,
      regions: regions,
      supportAreas: areas,
      thisWeekOnly: thisWeekOnly,
      endingSoon: endingSoon,
    };

    console.log('Sending search request with filters:', JSON.stringify(searchFilters));
    searchRef.current(searchFilters);

    // Track when search happens for debugging
    console.log('Search request sent at:', new Date().toISOString());
  };

  // Store performSearch in a ref to avoid it being recreated
  const performSearchRef = useRef(performSearch);

  // Handle search button click without useCallback
  const handleSearch = () => {
    console.log('=== SEARCH BUTTON CLICKED ===');
    const currentRegions = selectedRegionsRef.current;
    const currentAreas = selectedSupportAreasRef.current;
    const currentTerm = searchTermRef.current;
    const currentThisWeekOnly = showThisWeekOnlyRef.current;
    const currentEndingSoon = showEndingSoonRef.current;

    console.log('Selected regions before search:', JSON.stringify(currentRegions));
    console.log('Selected support areas before search:', JSON.stringify(currentAreas));
    console.log('This week only before search:', currentThisWeekOnly);
    console.log('Ending soon before search:', currentEndingSoon);

    // Make copies of the arrays to ensure they're passed correctly
    const regionsToSearch = [...currentRegions];
    const areasToSearch = [...currentAreas];

    console.log('Arrays copied for search:');
    console.log('- Regions:', regionsToSearch.join(', '));
    console.log('- Support Areas:', areasToSearch.join(', '));

    // Actually perform the search
    performSearchRef.current(currentTerm, regionsToSearch, areasToSearch, currentThisWeekOnly, currentEndingSoon);
  };

  // Handle search term change without useCallback
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout if it exists
    if (keywordDebounceTimeoutRef.current) {
      clearTimeout(keywordDebounceTimeoutRef.current);
    }

    // Set new timeout for 500ms debounce
    keywordDebounceTimeoutRef.current = setTimeout(() => {
      console.log('Search-as-you-type triggered for keyword:', value);
      // Use the current selected regions and areas from refs
      performSearchRef.current(value, selectedRegionsRef.current, selectedSupportAreasRef.current, showThisWeekOnlyRef.current, showEndingSoonRef.current);
    }, 500); // 500ms debounce
  };

  // Initial data load on component mount
  useEffect(() => {
    if (isInitialLoad) {
      console.log('=== INITIAL DATA LOAD ===');
      setIsInitialLoad(false);
      console.log('Performing initial search with empty filters');
      performSearchRef.current('', [], [], false, false);

      // Also trigger search directly to ensure data is loaded
      const fetchInitialData = async () => {
        try {
          console.log('Direct API call for initial data');
          // Call the search function directly to ensure data is loaded
          await searchRef.current({
            keyword: '',
            regions: [],
            supportAreas: [],
            thisWeekOnly: false,
            endingSoon: false
          });
        } catch (err) {
          console.error('Error loading initial data:', err);
        }
      };

      fetchInitialData();
    }
  }, [isInitialLoad]); // Remove performSearch from dependencies

  // Auto-search effect when filters change
  useEffect(() => {
    // Skip on initial load - we handle that separately
    if (isInitialLoad) return;

    console.log('Filters changed, preparing auto-search');

    // Clear existing timeout if there is one
    if (searchDebounceTimeoutRef.current) {
      clearTimeout(searchDebounceTimeoutRef.current);
    }

    // Set a timeout to trigger search after a delay
    searchDebounceTimeoutRef.current = setTimeout(() => {
      console.log('Auto-search triggered after filter change');
      // Get the current values from refs
      const currentRegions = selectedRegionsRef.current;
      const currentAreas = selectedSupportAreasRef.current;
      const currentTerm = searchTermRef.current;
      const currentThisWeekOnly = showThisWeekOnlyRef.current;
      const currentEndingSoon = showEndingSoonRef.current;

      console.log('- Regions:', currentRegions.join(', ') || '(none)');
      console.log('- Support Areas:', currentAreas.join(', ') || '(none)');
      console.log('- This Week Only:', currentThisWeekOnly);
      console.log('- Ending Soon:', currentEndingSoon);
      performSearchRef.current(currentTerm, currentRegions, currentAreas, currentThisWeekOnly, currentEndingSoon);
    }, 800); // 800ms debounce

  }, [selectedRegions, selectedSupportAreas, showThisWeekOnly, showEndingSoon, isInitialLoad]); // Added showEndingSoon dependency

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalItems / pageSize);

  // Debug logs for pagination
  useEffect(() => {
    console.log('Pagination debug:');
    console.log(`- totalItems: ${totalItems}`);
    console.log(`- pageSize: ${pageSize}`);
    console.log(`- totalPages: ${totalPages}`);
    console.log(`- current page: ${page}`);
  }, [totalItems, pageSize, totalPages, page]);

  // Define a mapping function to display proper Korean translations of support areas
  function translateSupportArea(area: string): string {
    const supportAreaMap: Record<string, string> = {
      'Startup': '창업',
      'Management': '경영',
      'Finance': '자금',
      'Technology': '기술',
      'Human Resources': '인력',
      'Export': '수출',
      'Domestic': '내수',
      'Other': '기타',
      // Add reverse mappings as well
      '창업': '창업',
      '경영': '경영',
      '자금': '자금',
      '기술': '기술',
      '인력': '인력',
      '수출': '수출',
      '내수': '내수',
      '기타': '기타'
    };

    return supportAreaMap[area] || area;
  }

  // Log changes to selectedRegions
  useEffect(() => {
    console.log('selectedRegions changed:', selectedRegions);
  }, [selectedRegions]);

  // Log changes to selectedSupportAreas
  useEffect(() => {
    console.log('selectedSupportAreas changed:', selectedSupportAreas);
  }, [selectedSupportAreas]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">지원사업 검색</h2>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex gap-2 relative">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="지원사업 검색..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={handleSearchTermChange}
              />
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              onClick={handleSearch}
            >
              검색하기
            </button>
            <button
              className="px-3 py-1 border rounded-lg text-gray-600 hover:text-blue-600"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className={`w-5 h-5 ${showFilters ? 'text-blue-600' : 'text-gray-600'}`} />
            </button>
          </div>

          {/* Filter Section */}
          {showFilters && (
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">필터</h3>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={clearFilters}
                >
                  필터 초기화
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" /> 지역
                </h4>
                <div className="flex flex-wrap gap-2">
                  {regions.map(region => {
                    // Debug each region button
                    console.log(`Rendering region button: ${region}, isSelected: ${selectedRegions.includes(region)}`);
                    return (
                      <button
                        key={region}
                        className={`px-3 py-1 rounded-full text-sm ${selectedRegions.includes(region)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        onClick={() => toggleRegion(region)}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <Briefcase className="w-4 h-4 mr-1" /> 지원분야
                </h4>
                <div className="flex flex-wrap gap-2">
                  {supportAreas.map(area => {
                    // Debug each support area button
                    console.log(`Rendering support area button: ${area.name}, isSelected: ${selectedSupportAreas.includes(area.name)}`);
                    return (
                      <button
                        key={area.id}
                        className={`px-3 py-1 rounded-full text-sm ${selectedSupportAreas.includes(area.name)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        onClick={() => toggleSupportArea(area.name)}
                      >
                        {area.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* This Week Only Filter */}
              <div className="mb-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" /> 공고 기간
                </h4>
                <button
                  className={`px-3 py-1 rounded-full text-sm ${showThisWeekOnly
                    ? 'bg-blue-100 text-blue-600 font-bold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  onClick={() => setShowThisWeekOnly(!showThisWeekOnly)}
                >
                  이번주 공고만 보기
                </button>
              </div>

              {/* Application Deadline Filter */}
              <div className="mb-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" /> 접수 마감
                </h4>
                <button
                  className={`px-3 py-1 rounded-full text-sm ${showEndingSoon
                    ? 'bg-blue-100 text-blue-600 font-bold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  onClick={() => setShowEndingSoon(!showEndingSoon)}
                >
                  마감 임박 공고만 보기
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  검색하기
                </button>
              </div>
            </div>
          )}

          {/* Selected Filters */}
          {(selectedRegions.length > 0 || selectedSupportAreas.length > 0 || showThisWeekOnly || showEndingSoon) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Display This Week Only filter */}
              {showThisWeekOnly && (
                <div className="flex items-center space-x-1 px-3 py-1 bg-blue-50 rounded-full text-sm">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>이번주 공고만</span>
                  <button
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => setShowThisWeekOnly(false)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Display Ending Soon filter */}
              {showEndingSoon && (
                <div className="flex items-center space-x-1 px-3 py-1 bg-blue-50 rounded-full text-sm">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>마감 임박 공고</span>
                  <button
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => setShowEndingSoon(false)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Display selected regions */}
              {selectedRegions.map(region => (
                <div key={region} className="flex items-center space-x-1 px-3 py-1 bg-blue-50 rounded-full text-sm">
                  <MapPin className="w-3 h-3 text-blue-600" />
                  <span>{region}</span>
                  <button
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => toggleRegion(region)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Display selected support areas */}
              {selectedSupportAreas.map(area => (
                <div key={area} className="flex items-center space-x-1 px-3 py-1 bg-blue-50 rounded-full text-sm">
                  <Briefcase className="w-3 h-3 text-blue-600" />
                  <span>{area}</span>
                  <button
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => toggleSupportArea(area)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error state */}
      {displayError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg my-4">
          <h3 className="font-bold">오류가 발생했습니다</h3>
          <p>{displayError}</p>
          <p className="mt-2 text-sm">API 키가 올바른지 확인하거나, 서버 상태를 확인해 주세요.</p>
          <p className="mt-1 text-sm">API URL: https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do</p>
          <div className="mt-3">
            <button
              onClick={() => {
                setLocalError(null);
                performSearchRef.current(searchTermRef.current, selectedRegionsRef.current, selectedSupportAreasRef.current, showThisWeekOnlyRef.current, showEndingSoonRef.current);
              }}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && !displayError && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {programs.length > 0 ? (
              programs.map((program) => (
                <div key={program.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm hover-card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {program.geographicRegions && program.geographicRegions.map((geoRegion, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                            {geoRegion}
                          </span>
                        ))}
                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                          {translateSupportArea(program.supportArea)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mt-2">{program.title}</h3>
                    </div>
                    <button
                      onClick={() => toggleBookmark(program.id, !program.isBookmarked)}
                      className="text-gray-400 hover:text-blue-600 ml-2"
                    >
                      {program.isBookmarked ? (
                        <Bookmark className="w-5 h-5 fill-yellow-400 text-yellow-500" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">접수마감:</span> {program.applicationDeadline}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">지원분야:</span> {translateSupportArea(program.supportArea)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">담당기관:</span> {program.region}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">지역:</span> {program.geographicRegions ? program.geographicRegions.join(', ') : '전국'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">지원금액:</span> {program.amount}
                    </p>
                  </div>
                  <div className="flex justify-end items-center mt-4">
                    {program.applicationUrl && (
                      <a
                        href={program.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        신청하기
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white p-8 rounded-xl shadow-sm text-center">
                <p className="text-gray-700 font-medium mb-2">검색 결과가 없습니다.</p>
                {(selectedRegions.length > 0 || selectedSupportAreas.length > 0) && (
                  <p className="text-gray-600 text-sm">선택한 필터와 일치하는 지원사업이 없습니다. 다른 지역이나 지원분야를 선택해보세요.</p>
                )}
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-8 pb-8">
            <div className="inline-flex shadow-sm">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className={`px-3 py-1 rounded-l-md border ${page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                처음
              </button>

              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`px-3 py-1 border-t border-b ${page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                이전
              </button>

              {/* Page Numbers */}
              <div className="flex">
                {(() => {
                  // Calculate which page numbers to show
                  const pageNumbers = [];

                  // Always show first page
                  if (page > 3) {
                    pageNumbers.push(1);
                    if (page > 4) {
                      pageNumbers.push('ellipsis1');
                    }
                  }

                  // Show pages around current page
                  const startPage = Math.max(1, page - 1);
                  const endPage = Math.min(totalPages, page + 1);

                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(i);
                  }

                  // Show last page
                  if (page < totalPages - 2) {
                    if (page < totalPages - 3) {
                      pageNumbers.push('ellipsis2');
                    }
                    pageNumbers.push(totalPages);
                  }

                  // Log the page numbers we're showing
                  console.log('Showing page numbers:', pageNumbers);

                  // Render the page numbers
                  return pageNumbers.map((pageNum, idx) => {
                    if (pageNum === 'ellipsis1' || pageNum === 'ellipsis2') {
                      return (
                        <div key={`ellipsis-${idx}`} className="px-3 py-1 border-t border-b text-gray-500">...</div>
                      );
                    }

                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setPage(pageNum as number)}
                        className={`px-3 py-1 border-t border-b ${pageNum === page
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1 border-t border-b ${page === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                다음
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-r-md border ${page === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                마지막
              </button>
            </div>
          </div>

          {/* Pagination Stats */}
          {programs.length > 0 && (
            <div className="text-center text-sm text-gray-500 mt-2">
              총 {totalItems}개 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalItems)}개 표시 중
            </div>
          )}
        </>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Search, X, MapPin, Briefcase } from 'lucide-react';
import { useGovSupport } from '../contexts/GovSupportContext';
import { debouncedSearch } from '../services/governmentSupportService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSupportAreas, setSelectedSupportAreas] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { search, setPage } = useGovSupport();
  
  const regions = ['서울', '부산', '인천', '대구', '광주', '대전', '울산', '경기'];
  const supportAreas = [
    { id: '01', name: '자금' },     // Finance
    { id: '02', name: '기술' },     // Technology
    { id: '03', name: '인력' },     // Manpower
    { id: '04', name: '수출' },     // Export
    { id: '05', name: '내수' },     // Domestic
    { id: '06', name: '창업' },     // Startup
    { id: '07', name: '경영' },     // Management
    { id: '09', name: '기타' },     // Etc
  ];
  
  // Effect to handle delayed search for improved performance
  useEffect(() => {
    // Only auto-search when there's a search term or filters applied
    if ((searchTerm && searchTerm.length >= 2) || 
        selectedRegions.length > 0 || 
        selectedSupportAreas.length > 0) {
      // Set searching state
      setIsSearching(true);
      
      // Set a small delay for the search to avoid API hammering during typing
      const timer = setTimeout(() => {
        const filters = {
          keyword: searchTerm,
          regions: selectedRegions,
          supportAreas: selectedSupportAreas,
        };
        
        // Reset to page 1 for new searches
        setPage(1);
        
        // Execute search and handle results
        search(filters).finally(() => setIsSearching(false));
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchTerm, selectedRegions, selectedSupportAreas]);
  
  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter(r => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };
  
  const toggleSupportArea = (area: string) => {
    if (selectedSupportAreas.includes(area)) {
      setSelectedSupportAreas(selectedSupportAreas.filter(a => a !== area));
    } else {
      setSelectedSupportAreas([...selectedSupportAreas, area]);
    }
  };
  
  const handleSearch = async () => {
    setIsSearching(true);
    
    try {
      await search({
        keyword: searchTerm,
        regions: selectedRegions,
        supportAreas: selectedSupportAreas,
      });
    } finally {
      setIsSearching(false);
      onClose();
    }
  };
  
  const resetFilters = () => {
    setSelectedRegions([]);
    setSelectedSupportAreas([]);
    setSearchTerm('');
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">지원사업 검색</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="지원사업 검색..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-1" /> 지역
            </h4>
            <div className="flex flex-wrap gap-2">
              {regions.map(region => (
                <button
                  key={region}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedRegions.includes(region)
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleRegion(region)}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2 flex items-center">
              <Briefcase className="w-4 h-4 mr-1" /> 지원분야
            </h4>
            <div className="flex flex-wrap gap-2">
              {supportAreas.map(area => (
                <button
                  key={area.id}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedSupportAreas.includes(area.name)
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleSupportArea(area.name)}
                >
                  {area.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
              onClick={resetFilters}
            >
              필터 초기화
            </button>
            <button 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 relative"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <span className="opacity-0">검색하기</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                '검색하기'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
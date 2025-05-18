import React, { useEffect, useState } from 'react';
import { useGovSupport } from '../contexts/GovSupportContext';
import { Bookmark, ExternalLink, RefreshCw } from 'lucide-react';
import { GovSupportProgram } from '../types/governmentSupport';
import { getBookmarkedPrograms } from '../services/governmentSupportService';

export default function BookmarkedPrograms() {
  const { toggleBookmark, reloadBookmarks } = useGovSupport();
  const [bookmarkedPrograms, setBookmarkedPrograms] = useState<GovSupportProgram[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadBookmarks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading bookmarked programs...');
      // First reload the bookmarked IDs in the context
      reloadBookmarks();
      
      // Then fetch the full program data
      const programs = await getBookmarkedPrograms();
      console.log(`Loaded ${programs.length} bookmarked programs`);
      setBookmarkedPrograms(programs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading bookmarks';
      console.error('Error loading bookmarks:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load bookmarked programs on mount
  useEffect(() => {
    loadBookmarks();
  }, []);
  
  // Handle unbookmarking
  const handleUnbookmark = async (programId: string) => {
    try {
      await toggleBookmark(programId, false);
      // Reload all bookmarks to ensure consistent state
      loadBookmarks();
    } catch (err) {
      console.error('Error unbookmarking program:', err);
      setError('북마크 제거 중 오류가 발생했습니다.');
    }
  };
  
  const handleRefresh = () => {
    loadBookmarks();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">북마크된 지원사업</h2>
        <button 
          onClick={handleRefresh}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 flex items-center"
          disabled={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-1" /> 새로고침
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          <h3 className="font-bold">오류가 발생했습니다</h3>
          <p>{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
          >
            다시 시도
          </button>
        </div>
      )}
      
      {!isLoading && !error && bookmarkedPrograms.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p>아직 북마크한 지원사업이 없습니다.</p>
          <p className="text-sm mt-2">관심 있는 지원사업을 북마크해 보세요.</p>
        </div>
      )}
      
      {bookmarkedPrograms.length > 0 && (
        <div className="space-y-4">
          {bookmarkedPrograms.map(program => (
            <div key={program.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg mb-1">{program.title}</h3>
                  <div className="text-sm mb-3 flex flex-wrap gap-1">
                    {program.geographicRegions && program.geographicRegions.map((geoRegion, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {geoRegion}
                      </span>
                    ))}
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {program.supportArea}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleUnbookmark(program.id)}
                  className="text-yellow-500 hover:text-gray-400"
                >
                  <Bookmark className="w-5 h-5 fill-yellow-400" />
                </button>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {program.description}
              </p>
              
              <div className="flex flex-wrap justify-between items-center mt-4 text-sm">
                <div>
                  <span className="text-gray-500">신청 마감일:</span> 
                  <span className="ml-1 font-medium">{program.applicationDeadline}</span>
                </div>
                <div>
                  <span className="text-gray-500">지원금액:</span> 
                  <span className="ml-1 font-medium">{program.amount}</span>
                </div>
              </div>
              
              {program.applicationUrl && (
                <div className="mt-4">
                  <a 
                    href={program.applicationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    신청 바로가기 <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
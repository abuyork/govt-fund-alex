import React from 'react';
import { useGovSupport } from '../contexts/GovSupportContext';
import { Bell, BellOff, ExternalLink } from 'lucide-react';

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
    'Other': '기타'
  };
  
  return supportAreaMap[area] || area;
}

export default function SearchResults() {
  const { 
    programs, 
    isLoading, 
    error, 
    toggleBookmark, 
    page, 
    pageSize, 
    totalItems, 
    setPage 
  } = useGovSupport();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg my-4">
        <h3 className="font-bold">오류가 발생했습니다</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  if (programs.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center my-6">
        <p className="text-gray-700 font-medium mb-2">검색 결과가 없습니다.</p>
        <p className="text-gray-600 text-sm">다른 검색어나 필터를 사용해 보세요.</p>
      </div>
    );
  }
  
  const totalPages = Math.ceil(totalItems / pageSize);
  
  return (
    <div className="my-6">
      <div className="mb-4 text-sm text-gray-600">
        총 {totalItems}개의 검색 결과
      </div>
      
      <div className="space-y-4">
        {programs.map(program => (
          <div key={program.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm mb-3 flex flex-wrap gap-1">
                  {program.geographicRegions && program.geographicRegions.map((geoRegion, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {geoRegion}
                    </span>
                  ))}
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    {translateSupportArea(program.supportArea)}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{program.title}</h3>
              </div>
              <button 
                onClick={() => toggleBookmark(program.id, !program.isBookmarked)}
                className="text-gray-400 hover:text-yellow-500 ml-2"
              >
                {program.isBookmarked ? (
                  <Bell className="w-5 h-5 fill-yellow-400 text-yellow-500" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {program.description}
            </p>
            
            <div className="flex flex-col space-y-2 mt-4 text-sm">
              <p className="text-gray-600">
                <span className="text-gray-500 font-medium">접수마감:</span> 
                <span className="ml-1">{program.applicationDeadline}</span>
              </p>
              <p className="text-gray-600">
                <span className="text-gray-500 font-medium">지원분야:</span> 
                <span className="ml-1">{translateSupportArea(program.supportArea)}</span>
              </p>
              <p className="text-gray-600">
                <span className="text-gray-500 font-medium">담당기관:</span> 
                <span className="ml-1">{program.region}</span>
              </p>
              <p className="text-gray-600">
                <span className="text-gray-500 font-medium">지역:</span> 
                <span className="ml-1">{program.geographicRegions ? program.geographicRegions.join(', ') : '전국'}</span>
              </p>
              <p className="text-gray-600">
                <span className="text-gray-500 font-medium">지원금액:</span> 
                <span className="ml-1">{program.amount}</span>
              </p>
            </div>
            
            {program.applicationUrl && (
              <div className="mt-4 flex justify-end">
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
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8">
          <button 
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={`mx-1 px-3 py-1 rounded ${
              page === 1 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            이전
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = page > 3 
              ? Math.min(totalPages - 4, page - 2) + i 
              : i + 1;
              
            if (pageNum > totalPages) return null;
            
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`mx-1 px-3 py-1 rounded ${
                  pageNum === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          {totalPages > 5 && page < totalPages - 2 && (
            <>
              <span className="mx-1">...</span>
              <button
                onClick={() => setPage(totalPages)}
                className="mx-1 px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button 
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className={`mx-1 px-3 py-1 rounded ${
              page === totalPages 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
} 
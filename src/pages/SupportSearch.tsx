import React, { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import SearchModal from '../components/SearchModal';
import SearchResults from '../components/SearchResults';
import BookmarkedPrograms from '../components/BookmarkedPrograms';
import { GovSupportProvider } from '../contexts/GovSupportContext';

export default function SupportSearch() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'bookmarks'>('search');
  
  return (
    <GovSupportProvider>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">정부 지원사업 검색</h1>
        
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-grow max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="지원사업 검색..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              onClick={() => setIsSearchModalOpen(true)}
              readOnly
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Search className="w-5 h-5 mr-1 inline-block" /> 검색 결과
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'bookmarks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bell className="w-5 h-5 mr-1 inline-block" /> 북마크
            </button>
          </div>
        </div>
        
        <SearchModal 
          isOpen={isSearchModalOpen} 
          onClose={() => setIsSearchModalOpen(false)} 
        />
        
        <div className="mt-6">
          {activeTab === 'search' ? <SearchResults /> : <BookmarkedPrograms />}
        </div>
      </div>
    </GovSupportProvider>
  );
} 
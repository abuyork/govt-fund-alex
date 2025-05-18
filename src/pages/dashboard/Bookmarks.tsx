import React from 'react';
import BookmarkedPrograms from '../../components/BookmarkedPrograms';

export default function Bookmarks() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">북마크</h1>
      <p className="text-gray-600 mb-6">
        북마크한 정부 지원 프로그램을 확인하세요.
      </p>
      
      <BookmarkedPrograms />
    </div>
  );
} 
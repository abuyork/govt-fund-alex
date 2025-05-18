import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-8 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-4">
              <p>주식회사 크리피 솔루션즈</p>
              <p>대표 : 정아린, 민동선</p>
              <p>이메일주소 : contact@crypee.io</p>
              <p>주소 : 서울 특별시 강남구 테헤란로 431, 에스 7018호(삼성동, 저스트코 타워)</p>
              <p>사업자등록번호 : 173-87-02739</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link to="/privacy-policy" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              개인정보 처리방침
            </Link>
            <Link to="/terms-of-use" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              서비스이용약관
            </Link>
          </div>
          <p className="text-sm text-gray-600">© 2025 AI 정부지원금. 모든 권리 보유.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
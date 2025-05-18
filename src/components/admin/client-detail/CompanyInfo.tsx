import React from 'react';
import { Building, BarChart, User, MapPin } from 'lucide-react';

interface CompanyInfoProps {
  company?: string;
  businessNumber?: string;
  phone?: string;
  address?: string;
}

export default function CompanyInfo({ company, businessNumber, phone, address }: CompanyInfoProps) {
  return (
    <div>
      <h4 className="text-lg font-semibold mb-4">기업 정보</h4>
      <div className="space-y-3">
        <div className="flex items-start">
          <Building className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-gray-500">회사명</p>
            <p className="font-medium">{company || '-'}</p>
          </div>
        </div>
        <div className="flex items-start">
          <BarChart className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-gray-500">사업자등록번호</p>
            <p className="font-medium">{businessNumber || '-'}</p>
          </div>
        </div>
        <div className="flex items-start">
          <User className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-gray-500">연락처</p>
            <p className="font-medium">{phone || '-'}</p>
          </div>
        </div>
        <div className="flex items-start">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-gray-500">주소</p>
            <p className="font-medium">{address || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
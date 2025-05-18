import React from 'react';
import { User } from 'lucide-react';

interface ClientHeaderProps {
  name: string;
  email: string;
  plan: string;
  status: string;
}

export default function ClientHeader({ name, email, plan, status }: ClientHeaderProps) {
  const getPlanColorClass = (plan: string): string => {
    switch(plan) {
      case 'free': return 'bg-gray-100 text-gray-600';
      case 'standard': return 'bg-blue-100 text-blue-600';
      case 'premium': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColorClass = (status: string): string => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-600';
      case 'expired': return 'bg-red-100 text-red-600';
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPlanDisplayName = (plan: string): string => {
    switch(plan) {
      case 'free': return '무료';
      case 'standard': return '스탠다드';
      case 'premium': return '프리미엄';
      default: return plan;
    }
  };

  const getStatusDisplayName = (status: string): string => {
    switch(status) {
      case 'active': return '활성';
      case 'expired': return '만료됨';
      case 'pending': return '대기중';
      default: return status;
    }
  };

  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div className="ml-3">
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-gray-600">{email}</p>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <span className={`px-3 py-1 rounded-full text-sm ${getPlanColorClass(plan)}`}>
          {getPlanDisplayName(plan)}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColorClass(status)}`}>
          {getStatusDisplayName(status)}
        </span>
      </div>
    </div>
  );
}
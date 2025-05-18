import React from 'react';
import { Calendar, CreditCard, Clock, DollarSign } from 'lucide-react';

interface SubscriptionInfoProps {
  startDate: string;
  endDate: string;
  paymentMethod?: string;
  billingCycle?: string;
  nextPaymentDate?: string;
}

export default function SubscriptionInfo({
  startDate,
  endDate,
  paymentMethod,
  billingCycle,
  nextPaymentDate,
}: SubscriptionInfoProps) {
  const formatDate = (dateString: string): string => {
    if (dateString === '-') return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  return (
    <div>
      <h4 className="text-lg font-semibold mb-4">구독 정보</h4>
      <div className="space-y-3">
        <div className="flex items-start">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-gray-500">구독 기간</p>
            <p className="font-medium">{formatDate(startDate)} ~ {formatDate(endDate)}</p>
          </div>
        </div>
        <div className="flex items-start">
          <CreditCard className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-gray-500">결제 수단</p>
            <p className="font-medium">{paymentMethod || '-'}</p>
          </div>
        </div>
        <div className="flex items-start">
          <Clock className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-gray-500">결제 주기</p>
            <p className="font-medium">{billingCycle || '-'}</p>
          </div>
        </div>
        <div className="flex items-start">
          <DollarSign className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-gray-500">다음 결제일</p>
            <p className="font-medium">{nextPaymentDate ? formatDate(nextPaymentDate) : '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
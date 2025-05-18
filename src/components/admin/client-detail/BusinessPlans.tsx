import React from 'react';
import { FileText } from 'lucide-react';

interface BusinessPlan {
  id: string;
  title: string;
  type: string;
  createDate: string;
  lastEditDate: string;
}

interface BusinessPlansProps {
  plans: BusinessPlan[];
}

export default function BusinessPlans({ plans }: BusinessPlansProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  return (
    <div>
      <h4 className="text-lg font-semibold mb-4">사업계획서</h4>
      
      {plans.length > 0 ? (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium">{plan.title}</h5>
                  <p className="text-sm text-gray-500">{plan.type} · 최종 수정일: {formatDate(plan.lastEditDate)}</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm">
                보기
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          작성된 사업계획서가 없습니다.
        </div>
      )}
    </div>
  );
}
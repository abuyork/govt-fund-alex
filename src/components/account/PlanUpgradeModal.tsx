import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlanType } from '../../services/paymentService';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
}

export default function PlanUpgradeModal({
  isOpen,
  onClose,
  currentPlan
}: PlanUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    currentPlan === 'free' ? 'pro' : 'free'
  );
  const navigate = useNavigate();

  if (!isOpen) return null;

  const plans = {
    free: {
      name: '무료 플랜',
      price: '0원',
      features: [
        '맞춤 정부지원사업 검색 추천',
        '알림서비스 1년 무료',
        '사업계획서 초안 생성(1회/일)',
      ]
    },
    pro: {
      name: '프로 플랜',
      price: '9,900원/월',
      features: [
        '무료 플랜의 모든 기능 포함',
        '맞춤형 사업계획서 템플릿 제공',
      ]
    }
  };

  const handleContinue = () => {
    if (selectedPlan === currentPlan) {
      onClose();
      return;
    }
    
    // Navigate to billing page with selected plan
    navigate(`/dashboard/billing?plan=${selectedPlan}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">플랜 업그레이드</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          현재 플랜: <span className="font-medium">{plans[currentPlan].name}</span>
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {(Object.keys(plans) as Array<PlanType>).map(planType => (
            <div 
              key={planType}
              className={`border rounded-lg p-6 ${
                planType === selectedPlan 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:border-gray-300 cursor-pointer'
              } ${planType === currentPlan ? 'relative' : ''}`}
              onClick={() => setSelectedPlan(planType)}
            >
              {planType === currentPlan && (
                <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                  현재 플랜
                </div>
              )}
              <h4 className="font-bold text-lg mb-2">{plans[planType].name}</h4>
              <p className="text-xl font-bold mb-4">{plans[planType].price}</p>
              <ul className="space-y-2 mb-6">
                {plans[planType].features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className={`w-full h-1 ${planType === selectedPlan ? 'bg-blue-500' : 'bg-gray-200'} rounded-full mb-4`}></div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button 
            onClick={handleContinue}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            계속하기
          </button>
        </div>
      </div>
    </div>
  );
} 
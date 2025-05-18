import React from 'react';
import { X, Lock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlanType } from '../../services/paymentService';

interface FeatureLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  requiredPlan: PlanType;
  featureName: string;
}

export default function FeatureLockedModal({
  isOpen,
  onClose,
  currentPlan,
  requiredPlan,
  featureName
}: FeatureLockedModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const plans = {
    pro: {
      name: '프로 플랜',
      price: '9,900원/월',
      features: [
        '고급 지원사업 검색 및 필터링',
        '알림 서비스 무제한',
        'AI 사업계획서 무제한 생성',
        '특화 템플릿 무료 이용',
        '사업계획서 PDF/DOCX 변환',
        '전문가 1:1 컨설팅 (월 1회)',
        '우선 지원 및 맞춤 분석'
      ]
    }
  };

  const planToUpgrade = 'pro';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Lock className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold">기능 잠금</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            <strong>{featureName}</strong> 기능은 <strong>{plans[planToUpgrade].name}</strong> 이상의 요금제에서 이용 가능합니다.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-blue-700 mb-2">{plans[planToUpgrade].name} 혜택</h4>
            <ul className="space-y-2">
              {plans[planToUpgrade].features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <p className="text-sm text-gray-600">
            지금 업그레이드하고 더 많은 기능을 이용해보세요.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-lg"
            onClick={onClose}
          >
            취소
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            onClick={() => {
              onClose();
              navigate('/dashboard/account');
            }}
          >
            플랜 업그레이드
          </button>
        </div>
      </div>
    </div>
  );
} 
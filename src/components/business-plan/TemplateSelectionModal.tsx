import React from 'react';
import { X, FileText, Check, AlertCircle } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface Template {
  id: string;
  name: string;
  title: string;
  type: string;
  isFree: boolean; // This property is kept but all templates should be treated as paid
  color: string;
  prompt?: string;
}

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  selectedTemplate: string;
  setSelectedTemplate: (id: string) => void;
  onApplyTemplate: () => void;
  openPlanUpgradeModal?: () => void;
}

export default function TemplateSelectionModal({
  isOpen,
  onClose,
  templates,
  selectedTemplate,
  setSelectedTemplate,
  onApplyTemplate,
  openPlanUpgradeModal,
}: TemplateSelectionModalProps) {
  if (!isOpen) return null;
  
  // Get subscription context
  const { canUseFeature } = useSubscription();
  const hasTemplateAccess = canUseFeature('allTemplates');

  const getTemplateColorClass = (color: string) => {
    switch(color) {
      case 'green': return 'text-green-600';
      case 'blue': return 'text-blue-600';
      case 'purple': return 'text-purple-600';
      case 'orange': return 'text-orange-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-4 md:p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">템플릿 선택</h3>
          <button onClick={onClose} type="button" aria-label="Close">
            <div className="flex items-center justify-center">
              <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
            </div>
          </button>
        </div>
        
        <div 
          className="bg-blue-50 p-3 rounded-lg mb-4 cursor-pointer hover:bg-blue-100 transition-colors" 
          onClick={openPlanUpgradeModal}
        >
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700">
              <strong>가격 안내:</strong> 모든 템플릿은 각 ₩3,000원에 이용하실 수 있으며, <span className="text-blue-600 hover:underline">유료 구독</span> 시 무제한으로 이용 가능합니다.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {templates.map((template) => (
            <div 
              key={template.id} 
              className={`p-4 border rounded-lg cursor-pointer ${
                selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center justify-center">
                  <FileText className={`w-6 h-6 ${getTemplateColorClass(template.color)}`} />
                </div>
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">₩3,000</span>
              </div>
              <h4 className="font-medium">{template.title || template.name}</h4>
              
              {selectedTemplate === template.id && (
                <div className="mt-2 flex items-center text-blue-600">
                  <div className="flex items-center justify-center mr-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-sm">선택됨</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            type="button"
          >
            <span>취소</span>
          </button>
          
          <button 
            onClick={onApplyTemplate}
            className={`px-6 py-2 ${
              !selectedTemplate || !hasTemplateAccess ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-lg`}
            disabled={!selectedTemplate || !hasTemplateAccess}
            type="button"
          >
            <span>{hasTemplateAccess ? '템플릿 적용' : '₩3,000 구매'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
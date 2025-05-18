import React from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

interface DraftPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftPlanContent: string;
  draftPlanTitle: string;
  setDraftPlanTitle: (title: string) => void;
  itemName: string;
  setItemName: (name: string) => void;
  startupItem: string;
  setStartupItem: (item: string) => void;
  isGeneratingDraftPlan: boolean;
  generateDraftPlan: () => void;
  showTemplateModal: () => void;
  savePlan: (type: 'draft' | 'submission') => void;
}

export default function DraftPlanModal({
  isOpen,
  onClose,
  draftPlanContent,
  draftPlanTitle,
  setDraftPlanTitle,
  itemName,
  setItemName,
  startupItem,
  setStartupItem,
  isGeneratingDraftPlan,
  generateDraftPlan,
  showTemplateModal,
  savePlan,
}: DraftPlanModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-4 md:p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">사업계획서 초안</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
        
        {draftPlanContent ? (
          <div className="mb-6">
            <div className="border rounded-lg p-4 mb-4 whitespace-pre-wrap">
              {draftPlanContent.split('\n').map((line, i) => (
                <div key={i} className={line.startsWith('#') ? 'font-bold text-lg mt-4 mb-2' : line.startsWith('##') ? 'font-bold text-base mt-3 mb-2' : 'mb-2'}>
                  {line.replace(/^#+ /, '')}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업계획서 제목
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 2024년 스타트업 성장지원 사업"
                value={draftPlanTitle}
                onChange={(e) => setDraftPlanTitle(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                아이템 이름
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: AI 정부지원사업 검색 서비스"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                창업 아이템 설명
              </label>
              <textarea
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                placeholder="창업 아이템에 대한 간략한 설명을 입력하세요"
                value={startupItem}
                onChange={(e) => setStartupItem(e.target.value)}
              />
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-2">
                AI가 사업계획서 초안을 생성합니다. 다음 정보를 포함합니다:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>문제인식</li>
                <li>시장분석</li>
                <li>실현 가능성</li>
                <li>성장전략</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>혜택:</strong> 구독 요금제에 가입하시면 무제한으로 사업계획서를 생성하실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          {!draftPlanContent ? (
            <button 
              className={`px-6 py-2 ${
                isGeneratingDraftPlan || !draftPlanTitle 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-lg flex items-center`}
              onClick={generateDraftPlan}
              disabled={isGeneratingDraftPlan || !draftPlanTitle}
            >
              {isGeneratingDraftPlan ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  생성 중...
                </>
              ) : (
                'AI 생성하기'
              )}
            </button>
          ) : (
            <>
              <button 
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                onClick={showTemplateModal}
              >
                제출용 사업계획서로 확장하기
              </button>
              <button 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                onClick={() => savePlan('draft')}
              >
                <Save className="w-4 h-4 mr-2" />
                저장하기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
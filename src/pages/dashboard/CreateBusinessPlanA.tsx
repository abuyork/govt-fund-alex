import React, { useState } from 'react';
import { FileText, AlertCircle, ArrowLeft, Save, X } from 'lucide-react';

export default function CreateBusinessPlanA() {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [itemName, setItemName] = useState('');
  const [customerTarget, setCustomerTarget] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState('');
  const [expectedCost, setExpectedCost] = useState('');
  const [expectedRevenue, setExpectedRevenue] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState('');
  
  const generatePlan = () => {
    if (!businessName || !itemName) {
      alert('기업명과 아이템 이름을 입력해주세요.');
      return;
    }
    
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      const plan = `# ${businessName} 사업계획서 초안

## 1. 문제인식
${businessDescription || '이 사업은 혁신적인 기술을 활용하여 시장의 문제점을 해결하고자 합니다.'}
${itemName ? `${itemName}을(를) 통해 ` : ''}사용자들의 불편함을 해소하고 새로운 가치를 제공합니다.

## 2. 시장분석
${targetMarket || '현재 시장 규모는 약 1000억원으로 추정되며, 연간 15% 성장하고 있습니다.'}
대상 고객: ${customerTarget || '중소기업 및 스타트업'}

## 3. 실현 가능성
${competitiveAdvantage || '자체 개발한 AI 기술을 활용하여 경쟁사 대비 30% 높은 정확도를 제공합니다.'}
현재 기술 수준과 시장 환경을 고려했을 때, 사업의 실현 가능성은 높은 편입니다.

## 4. 성장전략
초기에는 B2B 시장을 타겟으로 하여 안정적인 수익을 확보한 후, B2C 시장으로 확장할 계획입니다.
예상 비용: ${expectedCost || '초기 투자금 5천만원'}
예상 수익: ${expectedRevenue || '첫해 1억원, 3년 내 5억원 달성 목표'}

${aiPrompt ? `## 5. 추가 정보\n${aiPrompt}` : ''}`;
      
      setGeneratedPlan(plan);
      setIsGenerating(false);
      setShowPreview(true);
    }, 2000);
  };

  return (
    <div>
      <div className="flex items-center space-x-3 mb-8">
        <FileText className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold">사업계획서 초안 작성</h2>
      </div>

      {!showPreview ? (
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="p-4 mb-6 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">
                  <strong>안내:</strong> 기본 정보를 입력하면 AI가 사업계획서 초안을 자동으로 생성합니다. 모든 항목은 선택사항이지만, 더 많은 정보를 제공할수록 더 자세한 계획서가 작성됩니다.
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>혜택:</strong> 구독 요금제에 가입하시면 무제한으로 사업계획서를 생성하실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">기업 기본 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기업명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="기업명을 입력해주세요"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기업 업종
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  >
                    <option value="">선택하세요</option>
                    <option value="IT/소프트웨어">IT/소프트웨어</option>
                    <option value="제조업">제조업</option>
                    <option value="서비스업">서비스업</option>
                    <option value="바이오/의료">바이오/의료</option>
                    <option value="문화/콘텐츠">문화/콘텐츠</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    문제인식
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                    placeholder="해결하고자 하는 문제와 그 중요성에 대해 설명해주세요"
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">사업 아이템 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    아이템 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="제품 또는 서비스 이름을 입력해주세요"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    대상 고객
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="주요 고객층을 입력해주세요"
                    value={customerTarget}
                    onChange={(e) => setCustomerTarget(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시장분석
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
                    placeholder="시장 규모, 트렌드, 성장 가능성, 경쟁 상황 등"
                    value={targetMarket}
                    onChange={(e) => setTargetMarket(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">실현 가능성</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    경쟁 우위 요소
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
                    placeholder="경쟁 기업과 비교하여 우위에 있는 점, 기술적 실현 가능성"
                    value={competitiveAdvantage}
                    onChange={(e) => setCompetitiveAdvantage(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">성장전략</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예상 비용
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="초기 투자금 및 운영 비용"
                    value={expectedCost}
                    onChange={(e) => setExpectedCost(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예상 수익
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="연간 예상 매출액"
                    value={expectedRevenue}
                    onChange={(e) => setExpectedRevenue(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">AI 프롬프트 설정</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                추가 정보 (AI에게 전달할 내용)
              </label>
              <textarea
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                placeholder="AI에게 전달하고 싶은 추가 정보나 요청사항을 입력해주세요"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              ></textarea>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button 
              className={`px-6 py-2 ${
                isGenerating || !businessName || !itemName
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-lg flex items-center`}
              onClick={generatePlan}
              disabled={isGenerating || !businessName || !itemName}
            >
              {isGenerating ? (
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
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <button 
              className="text-gray-600 hover:text-gray-800 flex items-center"
              onClick={() => setShowPreview(false)}
            >
              <ArrowLeft className="w-5 h-5 mr-1" /> 돌아가기
            </button>
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center">
                <X className="w-4 h-4 mr-2" /> 취소
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <Save className="w-4 h-4 mr-2" /> 저장하기
              </button>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg mb-6">
            <h3 className="text-xl font-bold mb-4">{businessName} 사업계획서 초안</h3>
            <div className="whitespace-pre-wrap">
              {generatedPlan.split('\n').map((line, i) => (
                <div key={i} className={
                  line.startsWith('# ') ? 'text-2xl font-bold my-4' : 
                  line.startsWith('## ') ? 'text-xl font-bold my-3' : 
                  'mb-2'
                }>
                  {line.replace(/^#+ /, '')}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">
                  <strong>활용 안내:</strong> 생성된 사업계획서 초안은 기본 내용만 포함하고 있습니다. 더 상세하고 완성도 높은 계획서를 작성하시려면 템플릿을 적용하여 제출용 사업계획서로 확장하세요.
                </p>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    템플릿으로 확장하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
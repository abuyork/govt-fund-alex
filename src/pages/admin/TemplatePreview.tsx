import React, { useState } from 'react';
import { generateTemplatePrompt } from '../../services/templates/simpleTemplateService';

interface CompanyInfo {
  companyName: string;
  foundYear: string;
  companySize: string;
  industry: string;
  itemName: string;
  itemDescription: string;
  uniquePoint: string;
  targetMarket: string;
}

/**
 * Template Preview component
 * Allows testing of template generation with sample company data
 */
const TemplatePreview: React.FC = () => {
  const [templateContent, setTemplateContent] = useState<string>('');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '테스트 회사',
    foundYear: '2023',
    companySize: '소기업',
    industry: 'IT 서비스',
    itemName: '인공지능 비서',
    itemDescription: '개인화된 AI 비서 서비스',
    uniquePoint: '자연어 처리 기술을 활용한 맞춤형 응답',
    targetMarket: '기업 및 개인 사용자'
  });
  
  // Handle company info change
  const handleCompanyInfoChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Generate preview
  const handleGeneratePreview = () => {
    try {
      const prompt = generateTemplatePrompt(templateContent, companyInfo);
      setGeneratedPrompt(prompt);
      setShowPrompt(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('미리보기를 생성하는 중 오류가 발생했습니다.');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">템플릿 미리보기</h1>
      
      {!showPrompt ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">회사 정보 입력</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                <input
                  type="text"
                  value={companyInfo.companyName}
                  onChange={(e) => handleCompanyInfoChange('companyName', e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설립연도</label>
                <input
                  type="text"
                  value={companyInfo.foundYear}
                  onChange={(e) => handleCompanyInfoChange('foundYear', e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회사규모</label>
                <input
                  type="text"
                  value={companyInfo.companySize}
                  onChange={(e) => handleCompanyInfoChange('companySize', e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">산업분야</label>
                <input
                  type="text"
                  value={companyInfo.industry}
                  onChange={(e) => handleCompanyInfoChange('industry', e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이템명</label>
                <input
                  type="text"
                  value={companyInfo.itemName}
                  onChange={(e) => handleCompanyInfoChange('itemName', e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이템 설명</label>
                <input
                  type="text"
                  value={companyInfo.itemDescription}
                  onChange={(e) => handleCompanyInfoChange('itemDescription', e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">차별화 포인트</label>
                <input
                  type="text"
                  value={companyInfo.uniquePoint}
                  onChange={(e) => handleCompanyInfoChange('uniquePoint', e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">목표 시장</label>
                <input
                  type="text"
                  value={companyInfo.targetMarket}
                  onChange={(e) => handleCompanyInfoChange('targetMarket', e.target.value)}
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">템플릿 HTML</h2>
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <p>템플릿 HTML 코드를 입력하세요. 녹색 텍스트는 <code>&lt;span style="color: green"&gt;녹색 텍스트&lt;/span&gt;</code> 형식으로, 파란색 텍스트는 <code>&lt;span style="color: blue"&gt;파란색 텍스트&lt;/span&gt;</code> 형식으로 입력하세요.</p>
            </div>
            <textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              rows={10}
              className="w-full border rounded-md p-2 font-mono text-sm"
              placeholder="<h1>템플릿 제목</h1>
<p><span style='color: green'>섹션 제목</span></p>
<p><span style='color: blue'>입력 필드 설명</span></p>"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleGeneratePreview}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              미리보기 생성
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">생성된 프롬프트</h2>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              편집으로 돌아가기
            </button>
          </div>
          <pre className="bg-gray-100 p-4 rounded overflow-auto whitespace-pre-wrap text-sm font-mono">
            {generatedPrompt}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TemplatePreview; 
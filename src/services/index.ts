/**
 * Business Plan Services
 * 
 * This file re-exports all the business plan generation services and templates
 * for convenient importing elsewhere in the application.
 */

// Base prompt elements
// export * from './prompts';

// Import template-specific functions
import { getBasicStartupTemplatePlan } from './templates/basicStartupTemplate';
import { getEarlyStartupTemplatePlan } from './templates/earlyStartupTemplate';
import { getStartupSuccessTemplatePlan } from './templates/startupSuccessTemplate';
import { 
  getSocialEnterpriseTemplatePlan, 
  getSocialEnterpriseContent 
} from './templates/socialEnterpriseTemplate';

// Define the type for template functions to ensure consistency
export type TemplateFunction = (
  companyInfo: {
    companyName?: string,
    foundYear?: string,
    companySize?: string,
    industry?: string,
    itemName?: string,
    itemDescription?: string,
    uniquePoint?: string,
    targetMarket?: string
  },
  savedDraftId?: string,
  customPrompt?: string
) => string;

// Re-export template functions
export { 
  getBasicStartupTemplatePlan,
  getEarlyStartupTemplatePlan,
  getStartupSuccessTemplatePlan,
  getSocialEnterpriseTemplatePlan,
  getSocialEnterpriseContent
};

// Empty template placeholder functions for R&D and Export templates
export const getRDFocusedTemplatePlan: TemplateFunction = (companyInfo, savedDraftId, customPrompt) => {
  // Basic implementation to ensure it returns a valid string
  return `
# 사업계획서 생성 요청

다음 정보를 기반으로 전문적인 사업계획서를 생성해주세요:

## 기본 정보
- 사업계획서 제목: R&D 중심 템플릿
- 회사명: ${companyInfo.companyName || '미입력'}
- 설립연도: ${companyInfo.foundYear || '미입력'}
- 회사규모: ${companyInfo.companySize || '미입력'}
- 산업분야: ${companyInfo.industry || '미입력'}

## 사업 아이템 상세
- 아이템명: ${companyInfo.itemName || '미입력'}
- 아이템 설명: ${companyInfo.itemDescription || '미입력'}
- 차별화 포인트: ${companyInfo.uniquePoint || '미입력'}
- 목표 시장: ${companyInfo.targetMarket || '미입력'}

## 추가 지시사항
${customPrompt || '없음'}

## 중요 안내
제목, 헤더, 내용 등 응답의 모든 부분은 반드시 한국어로만 작성해주세요.
영어 제목이나 영어 헤더를 포함하지 마세요.
모든 섹션 제목과 내용은 한국어로만 작성하세요.
영어 단어나 문장을 한국어로 번역해서 사용하세요.
특히 템플릿 이름을 출력하지 마세요 - 한국어로 된 내용만 출력하세요.

## 템플릿 안내
이 템플릿은 R&D 연구개발을 중심으로 하는 기업을 위한 사업계획서 템플릿입니다.
기술 혁신, 연구개발 과정, 지적재산권 보호 전략 등에 초점을 맞추어 작성해주세요.
`;
};

export const getExportCompanyTemplatePlan: TemplateFunction = (companyInfo, savedDraftId, customPrompt) => {
  // Basic implementation to ensure it returns a valid string
  return `
# 사업계획서 생성 요청

다음 정보를 기반으로 전문적인 사업계획서를 생성해주세요:

## 기본 정보
- 사업계획서 제목: 수출기업 템플릿
- 회사명: ${companyInfo.companyName || '미입력'}
- 설립연도: ${companyInfo.foundYear || '미입력'}
- 회사규모: ${companyInfo.companySize || '미입력'}
- 산업분야: ${companyInfo.industry || '미입력'}

## 사업 아이템 상세
- 아이템명: ${companyInfo.itemName || '미입력'}
- 아이템 설명: ${companyInfo.itemDescription || '미입력'}
- 차별화 포인트: ${companyInfo.uniquePoint || '미입력'}
- 목표 시장: ${companyInfo.targetMarket || '미입력'}

## 추가 지시사항
${customPrompt || '없음'}

## 중요 안내
제목, 헤더, 내용 등 응답의 모든 부분은 반드시 한국어로만 작성해주세요.
영어 제목이나 영어 헤더를 포함하지 마세요.
모든 섹션 제목과 내용은 한국어로만 작성하세요.
영어 단어나 문장을 한국어로 번역해서 사용하세요.
특히 템플릿 이름을 출력하지 마세요 - 한국어로 된 내용만 출력하세요.

## 템플릿 안내
이 템플릿은 수출 중심 기업을 위한 사업계획서 템플릿입니다.
해외시장 진출 전략, 국제 경쟁력 분석, 수출 규모 확대 방안 등에 초점을 맞추어 작성해주세요.
`;
};

// Export templateFunctions object for use in BusinessPlan.tsx
export const templateFunctions: Record<string, TemplateFunction> = {
  'basic-startup': getBasicStartupTemplatePlan,
  '2025-early-startup': getEarlyStartupTemplatePlan,
  'social-enterprise': getSocialEnterpriseTemplatePlan,
  'startup-success': getStartupSuccessTemplatePlan,
  'rd-focused': getRDFocusedTemplatePlan,
  'export-company': getExportCompanyTemplatePlan
};

/**
 * Get the appropriate template plan function based on the template ID
 * @param templateId - ID of the selected template
 */
export const getTemplateByIdFunction = (templateId: string): TemplateFunction => {
  const templateFunction = templateFunctions[templateId];
  if (templateFunction) {
    return templateFunction;
  }
  // Default to basic (free) template if template not found
  console.warn(`Template function not found for ID: ${templateId}, using basic-startup instead`);
  return getBasicStartupTemplatePlan;
}; 
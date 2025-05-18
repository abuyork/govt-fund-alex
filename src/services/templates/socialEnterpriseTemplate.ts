/**
 * Social Enterprise Template
 * This file contains the specific structure and content for the social enterprise template.
 */

// Remove import from prompts.ts
// import { getBaseBusinessPlanPrompt } from '../prompts';


/**
 * Template prompt content for the Social Enterprise Template
 */
export const SOCIAL_ENTERPRISE_TEMPLATE_CONTENT = `
○ 사회적 기업의 미션 및 비전
■ 사회적 기업으로서의 비전과 그에 따른 장기적인 목표를 구체적으로 기술하세요.

○ 해결하고자 하는 사회적 문제
■ 기업이 해결하고자 하는 사회적/환경적 문제와 그 배경에 대해 설명하세요.

○ 사회적 가치 창출 방안
■ 제품/서비스를 통해 사회적 가치를 창출하는 구체적인 방법과 그 영향력에 대해 기술하세요.

○ ESG 요소 반영 계획
■ 환경, 사회, 지배구조 측면에서 비즈니스에 반영할 구체적인 계획을 제시하세요.

○ 이해관계자 참여 전략
■ 주요 이해관계자(고객, 지역사회, 파트너 등)와의 협력 및 참여 전략에 대해 설명하세요.

○ 사회적 성과 측정 방법
■ 사회적 가치 및 임팩트를 측정하기 위한 지표와 방법론을 설명하세요.


`;

/**
 * Function to get the social enterprise content for template integration
 */
export const getSocialEnterpriseContent = () => {
  return SOCIAL_ENTERPRISE_TEMPLATE_CONTENT;
};

/**
 * Function to generate a complete Social Enterprise Template plan
 */
export const getSocialEnterpriseTemplatePlan = (
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
) => {
  // Direct implementation instead of using getBaseBusinessPlanPrompt
  const title = "사회적기업 템플릿";
  
  return `
# 사업계획서 생성 요청

다음 정보를 기반으로 전문적인 사업계획서를 생성해주세요:

## 기본 정보
- 사업계획서 제목: ${title}
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
제목, 헤더, 내용 등 응답의 모든 부분은 반드시 한국어로만 작성해주세요. 영어 제목이나 영어 헤더를 포함하지 마세요.

## 템플릿 내용
${SOCIAL_ENTERPRISE_TEMPLATE_CONTENT}
`;
}; 
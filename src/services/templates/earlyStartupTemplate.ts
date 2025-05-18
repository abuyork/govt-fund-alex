/**
 * 2025 Early Startup Package Template
 * This file contains the specific structure and content for the early startup template.
 */

/**
 * Template prompt content for the Early Startup Package
 */
export const EARLY_STARTUP_TEMPLATE_CONTENT = `

2025 초기창업패키지 템플릿

○ 문제 인식
○ 창업 아이템의 필요성
○ 개발하고자 하는 창업 아이템의 국내·외 시장 현황 및 문제점
■ 창업 아이템의 국내외 시장 현황에 대해 서술하세요.
■ 창업 아이템의 문제점에 대해 서술하세요.
■ 문제 해결을 위한 창업 아이템의 개발 필요성
■ 두번째 필요성에 대해 서술하세요.
■ 첫번째 필요성에 대해 서술하세요.


○ 실현 가능성 창업 아이템의 개발 계획
○ 아이디어를 제품·서비스로 개발 또는 구체화하고자 하는 계획(사업기간 내 일정)
■ 6개월간 각 월 별로 추진내용과 추진기간 세부내용(표 형식으로)

< 사업추진 일정(협약기간 내) > 예시
구분,추진 내용,추진 기간,세부 내용
■ 1,시제품 설계,"00년 상반기","시제품 설계 및 프로토타입 제작"
■ 2,시제품 제작,"00.00 ~ 00.00","외주 용역을 통한 시제품 제작"
■ 3,정식 출시,"00년 하반기","신제품 출시"
■ 4,신제품 홍보 프로모션 진행,"00.00 ~ 00.00","OO, OO 프로모션 진행"

○ 개발 창업 아이템의 기능·성능의 차별성
■ 첫번째 차별성에 대해 서술하세요.
■ 두번째 차별성에 대해 서술하세요.
개발 창업 아이템의 기능·성능의 경쟁력 확보 전략
■ 첫번째 경쟁력 확보전략에 대해 서술하세요.
■ 두번째 경쟁력 확보전략에 대해 서술하세요.


○ 성장전략. 사업화 추진 전략
○ 경쟁제품·경쟁사 분석
■ 최대 3-4개의 경쟁사를 표를 통해 비교 분석할 것
○ 창업 아이템의 목표 시장 진입 전략
○ 창업 아이템의 비즈니스 모델(수익화 모델)
○ 창업 아이템의 비즈니스 모델(수익화 모델) 예시 서술
■ 사업 확장을 위한 투자유치(자금확보) 전략
■ 사업 확장을 위한 투자유치(자금확보) 전략 예시 서술
○ 사업 전체 로드맵(일정)
■ 총 3개년 계획을 분기별 예시를 서술하고 아래 표로 추가 작성

■ < 사업추진 일정(전체 사업단계) > 예시
월,추진 내용,추진 기간,세부 내용
■ 1월,제품 기획 회의,"01.01 ~ 01.31","제품 디자인 초안 검토"
■ 2월,개발 진행,"02.01 ~ 02.28","기능 구현 및 테스트"
■ 3월,중간 점검,"03.01 ~ 03.31","프로젝트 리뷰 및 계획 수정"




`;

/**
 * Function to generate a prompt for the Early Startup Package template
 */
export const getEarlyStartupTemplatePlan = (
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
  const title = "2025 초기창업패키지 템플릿";
  
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
${EARLY_STARTUP_TEMPLATE_CONTENT}
`;
}; 
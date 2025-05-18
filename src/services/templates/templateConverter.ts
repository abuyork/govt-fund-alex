import { DynamicTemplate, convertExistingTemplate } from './dynamicTemplateGenerator';

// Import all template content
import { BASIC_STARTUP_TEMPLATE_CONTENT } from './basicStartupTemplate';
import { EARLY_STARTUP_TEMPLATE_CONTENT } from './earlyStartupTemplate';
import { SOCIAL_ENTERPRISE_TEMPLATE_CONTENT } from './socialEnterpriseTemplate';
import { STARTUP_SUCCESS_TEMPLATE_CONTENT } from './startupSuccessTemplate';

/**
 * Converts all existing templates to the new structured format
 * This is a utility function to help migrate from hardcoded template strings
 * to structured templates that can be edited in the admin UI
 */
export function convertAllExistingTemplates(): DynamicTemplate[] {
  return [
    // Basic Startup Template (Free)
    convertExistingTemplate(
      'basic-startup',
      '스타트업 템플릿 (무료)',
      '스타트업에 필요한 기본적인 사업계획서 템플릿. 창업 아이템, 실현 가능성, 성장 전략 등의 섹션을 포함합니다.',
      false, // Not premium (free)
      BASIC_STARTUP_TEMPLATE_CONTENT
    ),
    
    // Early Startup Package Template
    convertExistingTemplate(
      'early-startup',
      '2025 초기창업패키지 템플릿',
      '2025년 초기창업패키지 지원에 최적화된 사업계획서 템플릿. 문제 인식, 실현 가능성, 성장 전략 섹션이 중점적으로 작성되어 있습니다.',
      true, // Premium
      EARLY_STARTUP_TEMPLATE_CONTENT
    ),
    
    // Social Enterprise Template
    convertExistingTemplate(
      'social-enterprise',
      '사회적기업 템플릿',
      '사회적 기업의 미션과 비전, 사회적 가치 창출 방안, ESG 요소 반영 계획 등을 포함한 사회적기업 맞춤형 사업계획서 템플릿.',
      true, // Premium
      SOCIAL_ENTERPRISE_TEMPLATE_CONTENT
    ),
    
    // Startup Success Package Template
    convertExistingTemplate(
      'startup-success',
      '2025 창업성공패키지 템플릿',
      '2025년 창업성공패키지 지원에 최적화된 사업계획서 템플릿. 문제 인식, 실현 가능성, 자금 소요, 시장 진입 전략 등을 포함합니다.',
      true, // Premium
      STARTUP_SUCCESS_TEMPLATE_CONTENT
    )
  ];
}

/**
 * Function to get a specific template by ID
 */
export function getTemplateById(templateId: string): DynamicTemplate | undefined {
  const allTemplates = convertAllExistingTemplates();
  return allTemplates.find(template => template.id === templateId);
}

/**
 * Function to get all free templates
 */
export function getFreeTemplates(): DynamicTemplate[] {
  const allTemplates = convertAllExistingTemplates();
  return allTemplates.filter(template => !template.isPremium);
}

/**
 * Function to get all premium templates
 */
export function getPremiumTemplates(): DynamicTemplate[] {
  const allTemplates = convertAllExistingTemplates();
  return allTemplates.filter(template => template.isPremium);
} 
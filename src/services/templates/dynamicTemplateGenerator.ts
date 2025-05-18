/**
 * Dynamic Template Generator
 * This file contains functions to dynamically generate template prompts from Supabase data.
 */

// Don't import these types - define our own
// import { Template } from '../../types/Template';
// import { TemplateFunction } from '../index';
import { COMMON_TEMPLATE_STYLES } from './commonTemplateStyles';

// Template section types
export interface DynamicTemplateSection {
  id: string;
  type: 'header' | 'subheader' | 'text' | 'input' | 'table';
  content: string;
  required?: boolean;
  maxLength?: number;
  tableFormat?: {
    columns: string[];
    minRows: number;
  };
}

// Template interface
export interface DynamicTemplate {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  sections: DynamicTemplateSection[];
}

// Type for template generation functions
export type DynamicTemplateFunction = (
  companyInfo: {
    companyName?: string;
    foundYear?: string;
    companySize?: string;
    industry?: string;
    itemName?: string;
    itemDescription?: string;
    uniquePoint?: string;
    targetMarket?: string;
  },
  savedDraftId?: string,
  customPrompt?: string
) => string;

/**
 * Parses a template string into structured sections
 * This helps convert our existing templates to the new format
 */
export function parseTemplateString(templateString: string): DynamicTemplateSection[] {
  const sections: DynamicTemplateSection[] = [];
  const lines = templateString.split('\n');
  
  let currentSection: DynamicTemplateSection | null = null;
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Detect headers (green text with ○)
    if (line.includes('○')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      
      currentSection = {
        id: `section-${sections.length}`,
        type: 'header',
        content: line.replace('○', '').trim(),
        required: true
      };
      
      // If this is a single line header, push immediately
      if (!line.includes('■')) {
        sections.push(currentSection);
        currentSection = null;
      }
    } 
    // Detect input fields (blue text with ■)
    else if (line.includes('■')) {
      if (currentSection) {
        // If previous section was a header, change this to a subheader
        if (currentSection.type === 'header' && !sections.includes(currentSection)) {
          sections.push(currentSection);
        }
      }
      
      // Create input section
      currentSection = {
        id: `input-${sections.length}`,
        type: 'input',
        content: line.replace('■', '').trim(),
        required: true,
        maxLength: 150 // Based on the 150 character guideline
      };
      
      sections.push(currentSection);
      currentSection = null;
    }
    // Detect table sections
    else if (line.includes('표') || line.includes('테이블') || line.includes('CSV')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Extract column info if available
      const tableMatch = line.match(/경쟁사|회사|구분|추진/);
      const isCompetitorTable = line.includes('경쟁사');
      const isScheduleTable = line.includes('추진 일정') || line.includes('구분');
      
      let columns: string[] = [];
      if (isCompetitorTable) {
        columns = ['경쟁사', '제품/서비스', '강점', '약점'];
      } else if (isScheduleTable) {
        columns = ['구분', '추진 내용', '추진 기간', '세부 내용'];
      }
      
      currentSection = {
        id: `table-${sections.length}`,
        type: 'table',
        content: line.trim(),
        required: true,
        tableFormat: {
          columns,
          minRows: 3
        }
      };
      
      sections.push(currentSection);
      currentSection = null;
    }
    // Regular text
    else if (line.trim() && !line.includes('##') && !line.includes('...')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      
      currentSection = {
        id: `text-${sections.length}`,
        type: 'text',
        content: line.trim()
      };
      
      sections.push(currentSection);
      currentSection = null;
    }
  }
  
  // Add any remaining section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Generate a prompt for the template based on company info
 */
export function generateTemplatePrompt(
  template: DynamicTemplate,
  companyInfo: {
    companyName?: string;
    foundYear?: string;
    companySize?: string;
    industry?: string;
    itemName?: string;
    itemDescription?: string;
    uniquePoint?: string;
    targetMarket?: string;
  },
  savedDraftId?: string,
  customPrompt?: string
): string {
  // Basic template structure
  const prompt = `
# 사업계획서 생성 요청

다음 정보를 기반으로 전문적인 사업계획서를 생성해주세요:

## 기본 정보
- 사업계획서 제목: ${template.name}
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

## 템플릿 색상 규칙
초록색(○) 글씨는 탬플릿 내 각 주제(항목)입니다. 고정되어져야 합니다.
파란(■) 글씨에 대한 답변이 필요합니다.

## 템플릿 내용
${formatTemplateContent(template)}

## 공통 형식 규칙
${COMMON_TEMPLATE_STYLES}
`;

  return prompt;
}

/**
 * Format the template content for display
 */
function formatTemplateContent(template: DynamicTemplate): string {
  let content = '';
  
  for (const section of template.sections) {
    switch (section.type) {
      case 'header':
        content += `\n○ ${section.content}\n`;
        break;
      case 'subheader':
        content += `○ ${section.content}\n`;
        break;
      case 'text':
        content += `${section.content}\n`;
        break;
      case 'input':
        content += `■ ${section.content}\n`;
        break;
      case 'table':
        if (section.tableFormat) {
          content += `\n${section.content}\n`;
          // Add table format example
          content += `## 테이블 시작 - 아래와 같은 형식으로 테이블을 작성하세요 ##\n`;
          content += `${section.tableFormat.columns.join(',')}\n`;
          
          // Add sample rows
          for (let i = 0; i < section.tableFormat.minRows; i++) {
            const sampleRow = section.tableFormat.columns.map(col => `샘플${col}${i+1}`);
            content += `${sampleRow.join(',')}\n`;
          }
          content += `## 테이블 끝 ##\n\n`;
        } else {
          content += `${section.content}\n`;
        }
        break;
    }
  }
  
  return content;
}

/**
 * Parse a completed template response from AI
 * This helps extract data in a structured way from the AI-generated content
 */
export function parseTemplateResponse(
  template: DynamicTemplate, 
  aiResponse: string
): Record<string, string | string[][]> {
  const result: Record<string, string | string[][]> = {};
  const lines = aiResponse.split('\n');
  
  // Extract all sections
  for (const section of template.sections) {
    if (section.type === 'input') {
      // Find the section content in the AI response
      const sectionText = section.content.replace('■', '').trim();
      let contentIndex = lines.findIndex(line => 
        line.includes(sectionText) || line.includes(section.content)
      );
      
      if (contentIndex >= 0 && contentIndex < lines.length - 1) {
        // Next line should contain the answer
        result[section.id] = lines[contentIndex + 1].trim();
      }
    } else if (section.type === 'table' && section.tableFormat) {
      // Find and parse CSV table
      const tableStart = lines.findIndex(line => {
        // First check if the line contains the table start marker
        if (line.includes('## 테이블 시작')) {
          return true;
        }
        
        // Make sure tableFormat is defined before accessing columns
        const columns = section.tableFormat?.columns || [];
        
        // Check if the line contains the first column name
        return columns.length > 0 && line.includes(columns[0]);
      });
      
      if (tableStart >= 0) {
        const tableData: string[][] = [];
        let rowIndex = tableStart;
        
        // Skip header row
        rowIndex++;
        
        // Ensure tableFormat is defined (should always be true here)
        const columns = section.tableFormat?.columns || [];
        
        // Parse data rows
        while (rowIndex < lines.length && 
               !lines[rowIndex].includes('## 테이블 끝') && 
               lines[rowIndex].includes(',')) {
          const rowData = lines[rowIndex].split(',').map(cell => cell.trim());
          if (rowData.length === columns.length) {
            tableData.push(rowData);
          }
          rowIndex++;
        }
        
        result[section.id] = tableData;
      }
    }
  }
  
  return result;
}

/**
 * Convert existing template strings to the new format
 * This is a utility to help migrate existing templates
 */
export function convertExistingTemplate(
  templateId: string,
  templateName: string,
  description: string,
  isPremium: boolean,
  templateContent: string
): DynamicTemplate {
  const sections = parseTemplateString(templateContent);
  
  return {
    id: templateId,
    name: templateName,
    description,
    isPremium,
    sections
  };
}

/**
 * Convert a Template to a human-readable format for admin preview
 */
export function templateToPreviewFormat(template: DynamicTemplate): string {
  let preview = `# ${template.name}\n\n`;
  preview += `${template.description}\n\n`;
  preview += `프리미엄: ${template.isPremium ? '예' : '아니오'}\n\n`;
  
  // Add sections with color coding
  for (const section of template.sections) {
    switch (section.type) {
      case 'header':
        preview += `### 🟢 ${section.content}\n\n`;
        break;
      case 'subheader':
        preview += `#### 🟢 ${section.content}\n\n`;
        break;
      case 'input':
        preview += `🔵 ${section.content}\n\n`;
        break;
      case 'text':
        preview += `${section.content}\n\n`;
        break;
      case 'table':
        preview += `📊 ${section.content}\n`;
        if (section.tableFormat) {
          preview += `컬럼: ${section.tableFormat.columns.join(', ')}\n\n`;
        } else {
          preview += '\n';
        }
        break;
    }
  }
  
  return preview;
}

/**
 * Creates a template generation function from a template object
 */
export function createDynamicTemplateFunction(template: DynamicTemplate): DynamicTemplateFunction {
  return (companyInfo, savedDraftId, customPrompt) => {
    return generateTemplatePrompt(template, companyInfo, savedDraftId, customPrompt);
  };
} 
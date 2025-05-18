import { EARLY_STARTUP_TEMPLATE_CONTENT } from './earlyStartupTemplate';
import { SOCIAL_ENTERPRISE_TEMPLATE_CONTENT } from './socialEnterpriseTemplate';
import { STARTUP_SUCCESS_TEMPLATE_CONTENT } from './startupSuccessTemplate';
import { BASIC_STARTUP_TEMPLATE_CONTENT } from './basicStartupTemplate';
import { COMMON_TEMPLATE_STYLES } from './commonTemplateStyles';

// Template interface
export interface Template {
  id: string;
  name: string;
  content: string;
  isPremium: boolean;
  type: 'system' | 'custom';
  isHidden?: boolean;
}

/**
 * Add common styles to a template content if not already present
 */
export const addCommonStyles = (content: string): string => {
  // Check if the common styles are already in the content
  if (!content.includes(COMMON_TEMPLATE_STYLES.substring(0, 30))) {
    return `${content}\n\n${COMMON_TEMPLATE_STYLES}`;
  }
  return content;
};

// Initialize with predefined templates
export const defaultTemplates: Template[] = [
  {
    id: 'basic-startup-template',
    name: '스타트업 템플릿',
    content: addCommonStyles(BASIC_STARTUP_TEMPLATE_CONTENT),
    isPremium: true,
    type: 'system'
  },
  {
    id: 'early-startup-template',
    name: '2025 초기창업패키지 템플릿',
    content: addCommonStyles(EARLY_STARTUP_TEMPLATE_CONTENT),
    isPremium: true,
    type: 'system'
  },
  {
    id: 'social-enterprise-template',
    name: '사회적기업 템플릿',
    content: addCommonStyles(SOCIAL_ENTERPRISE_TEMPLATE_CONTENT),
    isPremium: true,
    type: 'system'
  },
  {
    id: 'startup-success-template',
    name: '2025 창업성공패키지 템플릿',
    content: addCommonStyles(STARTUP_SUCCESS_TEMPLATE_CONTENT),
    isPremium: true,
    type: 'system'
  }
];

/**
 * Load templates from localStorage or initialize with defaults
 */
export const loadTemplates = (): Template[] => {
  // Try to load from localStorage first
  const savedTemplates = localStorage.getItem('templates');
  
  if (savedTemplates) {
    try {
      const parsed = JSON.parse(savedTemplates);
      
      // If there are no system templates, add them
      const hasSystemTemplates = parsed.some((t: Template) => t.type === 'system');
      
      if (!hasSystemTemplates) {
        // Combine custom templates with system templates
        const combinedTemplates = [
          ...defaultTemplates,
          ...parsed.map((t: Template) => ({ ...t, type: 'custom' }))
        ];
        
        // Save the combined list back to localStorage
        localStorage.setItem('templates', JSON.stringify(combinedTemplates));
        return combinedTemplates;
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse saved templates', error);
      return defaultTemplates;
    }
  }
  
  // Initialize with default templates if nothing in localStorage
  localStorage.setItem('templates', JSON.stringify(defaultTemplates));
  return defaultTemplates;
};

/**
 * Save templates to localStorage
 */
export const saveTemplates = (templates: Template[]): void => {
  localStorage.setItem('templates', JSON.stringify(templates));
};

/**
 * Create a new template with common styles
 */
export const createNewTemplate = (name: string, content: string, isPremium: boolean): Template => {
  return {
    id: `template-${Date.now()}`,
    name,
    content: addCommonStyles(content),
    isPremium,
    type: 'custom'
  };
};

/**
 * Update an existing template
 */
export const updateTemplate = (templates: Template[], templateId: string, content: string, name: string, isPremium: boolean): Template[] => {
  return templates.map(t => {
    if (t.id === templateId) {
      return {
        ...t,
        content,
        name,
        isPremium
      };
    }
    return t;
  });
};

/**
 * Delete a template
 */
export const deleteTemplate = (templates: Template[], templateId: string): Template[] => {
  // Never delete system templates, just hide them
  if (templates.find(t => t.id === templateId)?.type === 'system') {
    return templates.map(t => 
      t.id === templateId ? { ...t, isHidden: true } : t
    );
  }
  
  // Delete custom templates
  return templates.filter(t => t.id !== templateId);
};

/**
 * Reset templates to default
 */
export const resetToDefaultTemplates = (): Template[] => {
  // Make a clean copy of default templates with isHidden set to false
  const resetTemplates = defaultTemplates.map(template => ({
    ...template,
    isHidden: false
  }));
  
  localStorage.setItem('templates', JSON.stringify(resetTemplates));
  return resetTemplates;
};

/**
 * Get a template by ID
 */
export const getTemplateById = (templates: Template[], id: string): Template | undefined => {
  return templates.find(t => t.id === id);
};

/**
 * Create an empty template with structure
 */
export const createEmptyTemplate = (): Template => {
  return {
    id: `template-${Date.now()}`,
    name: '새 템플릿',
    content: `<p>새 템플릿</p>
<p><br></p>
<p><span style="color: rgb(0, 128, 0);">○ 첫번째 섹션</span></p>
<p><span style="color: rgb(0, 0, 255);">■ 첫번째 섹션에 대한 설명을 입력하세요.</span></p>
<p><br></p>
<p><span style="color: rgb(0, 128, 0);">○ 두번째 섹션</span></p>
<p><span style="color: rgb(0, 0, 255);">■ 두번째 섹션에 대한 설명을 입력하세요.</span></p>
<p><br></p>
${COMMON_TEMPLATE_STYLES}`,
    isPremium: true,
    type: 'custom'
  };
};

/**
 * Simple Template Service
 * Provides utilities for working with the simple template format
 */

/**
 * Convert HTML content with colored text to a template prompt
 * @param htmlContent The HTML content from the editor
 * @param companyInfo Company information to include in the prompt 
 * @param customPrompt Optional custom instructions to add
 */
export function generateTemplatePrompt(
  htmlContent: string,
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
  customPrompt?: string
): string {
  // Extract and process content from HTML
  const plainContent = convertHtmlToPlainText(htmlContent);
  
  // Get template name from first line
  const templateName = plainContent.split('\n')[0] || '템플릿';
  
  // Build the prompt
  const prompt = `
# 사업계획서 생성 요청

다음 정보를 기반으로 전문적인 사업계획서를 생성해주세요:

## 기본 정보
- 사업계획서 제목: ${templateName}
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
${plainContent}

## 공통 형식 규칙
${COMMON_TEMPLATE_STYLES}
`;

  return prompt;
}

/**
 * Convert HTML content to plain text with markers (○, ■)
 * @param htmlContent The HTML content from the editor
 */
export function convertHtmlToPlainText(htmlContent: string): string {
  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Find and process tables
  const tableDivs = tempDiv.querySelectorAll('.template-table-container');
  tableDivs.forEach(tableDiv => {
    const table = tableDiv.querySelector('table');
    if (table) {
      // Convert table to CSV format
      let csvContent = '## 테이블 시작 ##\n';
      
      // Process header row
      const headerRow = table.querySelector('thead tr');
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('th');
        const headerTexts = Array.from(headerCells).map(cell => cell.textContent || '');
        csvContent += headerTexts.join(',') + '\n';
      }
      
      // Process data rows
      const dataRows = table.querySelectorAll('tbody tr');
      dataRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const cellTexts = Array.from(cells).map(cell => cell.textContent || '');
        csvContent += cellTexts.join(',') + '\n';
      });
      
      csvContent += '## 테이블 끝 ##';
      
      // Replace the table with the CSV representation
      const csvPre = document.createElement('div');
      csvPre.textContent = csvContent;
      tableDiv.parentNode?.replaceChild(csvPre, tableDiv);
    }
  });
  
  // Process the content
  const processed = processContentNode(tempDiv);
  
  // Clean up the text (remove extra spaces and line breaks)
  return processed
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Process an HTML node to extract content with proper formatting
 */
function processContentNode(node: Node): string {
  let result = '';
  
  // Process the node based on its type
  if (node.nodeType === Node.TEXT_NODE) {
    // Text node - just get the text content
    return node.textContent || '';
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    
    // Check for color styling
    const style = element.getAttribute('style') || '';
    const color = style.match(/color:\s*(green|rgb\(0,\s*128,\s*0\)|#00(?:80)?00|blue|rgb\(0,\s*0,\s*255\)|#0000(?:ff)?)/i);
    
    // Handle different types of elements
    switch (element.tagName.toLowerCase()) {
      case 'h1':
      case 'h2':
      case 'h3':
        // Handle headings
        const headingText = Array.from(element.childNodes)
          .map(child => processContentNode(child))
          .join('');
        return `${headingText}\n\n`;
        
      case 'p':
        // Handle paragraphs
        const paragraphText = Array.from(element.childNodes)
          .map(child => processContentNode(child))
          .join('');
        return `${paragraphText}\n\n`;
        
      case 'span':
        // Handle colored spans
        if (color) {
          const isGreen = /green|rgb\(0,\s*128,\s*0\)|#00(?:80)?00/i.test(color[1]);
          const isBlue = /blue|rgb\(0,\s*0,\s*255\)|#0000(?:ff)?/i.test(color[1]);
          
          const spanText = Array.from(element.childNodes)
            .map(child => processContentNode(child))
            .join('');
          
          if (isGreen && !spanText.startsWith('○')) {
            return `○ ${spanText}`;
          } else if (isBlue && !spanText.startsWith('■')) {
            return `■ ${spanText}`;
          } else {
            return spanText;
          }
        } else {
          // Normal span
          return Array.from(element.childNodes)
            .map(child => processContentNode(child))
            .join('');
        }
        
      case 'br':
        // Handle line breaks
        return '\n';
        
      case 'div':
      case 'strong':
      case 'em':
      case 'b':
      case 'i':
      default:
        // Process child nodes recursively
        return Array.from(element.childNodes)
          .map(child => processContentNode(child))
          .join('');
    }
  }
  
  return '';
}

/**
 * Force reset all templates to default (ignoring current localStorage)
 * Use this function when you need to completely refresh the templates
 */
export const forceResetAllTemplates = (): Template[] => {
  // Clear localStorage templates
  localStorage.removeItem('templates');
  
  // Create fresh copies of all default templates
  const freshTemplates = defaultTemplates.map(template => ({
    ...template,
    isHidden: false
  }));
  
  // Save to localStorage
  localStorage.setItem('templates', JSON.stringify(freshTemplates));
  
  return freshTemplates;
}; 
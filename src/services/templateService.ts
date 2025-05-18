import { supabase } from './supabase';
import { Template } from '../types/Template';
import { CompanyInfo } from '../interfaces/CompanyInfo';
import { COMMON_TEMPLATE_STYLES } from './templates/commonTemplateStyles';

// Interface for the simplified template format used in the editor
export interface SimpleTemplate {
  id: string;
  name: string;
  content: string;
  isPremium: boolean;
  type: 'system' | 'custom';
  isHidden?: boolean;
}

/**
 * Fetches all templates from Supabase
 * All users can see templates, but only paid users can access them
 */
export const fetchTemplates = async (): Promise<Template[]> => {
  try {
    // Fetch templates from database
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchTemplates:', error);
    return [];
  }
};

/**
 * Fetches all templates and converts them to simple template format
 */
export const fetchSimpleTemplates = async (): Promise<SimpleTemplate[]> => {
  try {
    const templates = await fetchTemplates();
    console.log('Raw templates fetched from database:', templates);
    
    const simpleTemplates = templates.map(templateToSimpleTemplate);
    console.log('Converted to SimpleTemplates:', simpleTemplates);
    
    return simpleTemplates;
  } catch (error) {
    console.error('Error in fetchSimpleTemplates:', error);
    return [];
  }
};

/**
 * Fetches a template by its ID
 */
export const fetchTemplateById = async (templateId: string): Promise<Template | null> => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('template_id', templateId)
      .single();
      
    if (error) {
      console.error(`Error fetching template with ID ${templateId}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error in fetchTemplateById for ID ${templateId}:`, error);
    return null;
  }
};

/**
 * Fetches a simple template by its ID
 */
export const fetchSimpleTemplateById = async (templateId: string): Promise<SimpleTemplate | null> => {
  try {
    console.log(`Fetching template by ID ${templateId} directly from database`);
    
    // Add a timestamp parameter to avoid any caching issues
    const timestamp = Date.now();
    
    // Get fresh data directly from the database
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('template_id', templateId)
      .single();
      
    if (error) {
      console.error(`Error fetching template with ID ${templateId}:`, error);
      return null;
    }
    
    if (!data) {
      console.error(`No template found with ID ${templateId}`);
      return null;
    }
    
    console.log(`Template data retrieved from database:`, data);
    
    // Convert to simple template format
    const simpleTemplate = templateToSimpleTemplate(data);
    
    // Add a timestamp to the content to ensure it's always fresh
    simpleTemplate.content = simpleTemplate.content.replace(/<!-- Updated: .*? -->/g, '');
    simpleTemplate.content += `<!-- Loaded: ${new Date().toISOString()} -->`;
    
    return simpleTemplate;
  } catch (error) {
    console.error(`Error in fetchSimpleTemplateById for ID ${templateId}:`, error);
    return null;
  }
};

/**
 * Fetches templates by type (기본 양식 or 특화 양식)
 */
export const fetchTemplatesByType = async (type: string): Promise<Template[]> => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('type', type)
      .order('name');
      
    if (error) {
      console.error(`Error fetching templates of type ${type}:`, error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error in fetchTemplatesByType for type ${type}:`, error);
    return [];
  }
};

/**
 * Fetches free templates only
 */
export const fetchFreeTemplates = async (): Promise<Template[]> => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('is_free', true)
      .order('name');
      
    if (error) {
      console.error('Error fetching free templates:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchFreeTemplates:', error);
    return [];
  }
};

/**
 * For admin: Create a new template
 */
export const createTemplate = async (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template | null> => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .insert([template])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating template:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createTemplate:', error);
    return null;
  }
};

/**
 * Convert a SimpleTemplate to the Template format for database storage
 */
export const simpleTemplateToTemplate = (simpleTemplate: SimpleTemplate): Omit<Template, 'id' | 'created_at' | 'updated_at'> => {
  // Make sure we have a valid name
  const templateName = simpleTemplate.name && simpleTemplate.name.trim() 
    ? simpleTemplate.name.trim()
    : `Template ${new Date().toISOString().substring(0, 10)}`;
    
  // Extract title from the content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = simpleTemplate.content;
  
  // Try to get title from first paragraph/heading
  const firstElement = tempDiv.querySelector('p, h1, h2, h3, h4, h5, h6');
  const title = firstElement && firstElement.textContent 
    ? firstElement.textContent.trim() 
    : templateName;
  
  // Extract sections from colored text
  const greenElements = tempDiv.querySelectorAll('span[style*="color: rgb(0, 128, 0)"], span[style*="color: green"]');
  const sections = Array.from(greenElements).map(element => {
    const text = element.textContent || '';
    // Remove the ○ marker if present
    return text.startsWith('○') ? text.substring(1).trim() : text.trim();
  });
  
  // Generate a unique template_id if one doesn't exist
  const template_id = simpleTemplate.id || `template-${Date.now()}`;
  
  // Ensure prompt includes common styles
  let promptContent = simpleTemplate.content;
  if (!promptContent.includes(COMMON_TEMPLATE_STYLES.substring(0, 30))) {
    promptContent = `${promptContent}\n\n${COMMON_TEMPLATE_STYLES}`;
  }
  
  console.log('Converting template with name:', templateName);
  console.log('Template title extracted from content:', title);
  console.log('Sections found:', sections.length);
  
  return {
    name: templateName,
    title: title,
    subtitle: ['사업계획서'], // Default subtitle
    type: simpleTemplate.isPremium ? '특화 양식' : '기본 양식',
    is_free: false, // All templates are now paid
    color: simpleTemplate.isPremium ? 'blue' : 'green',
    sections: sections,
    prompt: promptContent, // Store the full HTML content with common styles in the prompt field
    template_id: template_id
  };
};

/**
 * Convert a Template to SimpleTemplate format for the editor
 */
export const templateToSimpleTemplate = (template: Template): SimpleTemplate => {
  try {
    console.log('Converting Template to SimpleTemplate:', { 
      id: template.template_id,
      name: template.name,
      type: template.type
    });
    
    return {
      id: template.template_id,
      name: template.name,
      content: template.prompt || '',
      isPremium: true, // Always set isPremium to true for all templates
      type: 'system', // System templates are from the database
    };
  } catch (error) {
    console.error('Error converting template to SimpleTemplate:', error);
    return {
      id: template.template_id || 'error',
      name: template.name || 'Error Template',
      content: '',
      isPremium: true,
      type: 'system',
    };
  }
};

/**
 * Generate default content for a template if prompt is empty
 */
const generateDefaultContent = (template: Template): string => {
  let content = `<p>${template.title}</p><p><br></p>`;
  
  // Add sections as green-colored headings
  template.sections.forEach(section => {
    content += `<p><span style="color: rgb(0, 128, 0);">○ ${section}</span></p>`;
    content += `<p><span style="color: rgb(0, 0, 255);">■ ${section}에 대한 내용을 입력하세요.</span></p>`;
    content += `<p><br></p>`;
  });
  
  // Add common styles
  content += COMMON_TEMPLATE_STYLES;
  
  return content;
};

/**
 * For admin: Create a new template from SimpleTemplate format
 */
export const createSimpleTemplate = async (simpleTemplate: SimpleTemplate): Promise<SimpleTemplate | null> => {
  try {
    const templateData = simpleTemplateToTemplate(simpleTemplate);
    const template = await createTemplate(templateData);
    
    if (!template) return null;
    
    return templateToSimpleTemplate(template);
  } catch (error) {
    console.error('Error in createSimpleTemplate:', error);
    return null;
  }
};

/**
 * For admin: Update an existing template
 */
export const updateTemplate = async (templateId: string, updates: Partial<Template>): Promise<Template | null> => {
  try {
    console.log(`Updating template in database with ID: ${templateId}`);
    console.log('Update payload:', JSON.stringify(updates, null, 2));
    
    // Check if the template exists first
    const { data: existingTemplate, error: checkError } = await supabase
      .from('templates')
      .select('*')
      .eq('template_id', templateId)
      .single();
    
    if (checkError) {
      console.error(`Error checking template with ID ${templateId}:`, checkError);
      throw new Error(`Template not found: ${checkError.message}`);
    }
    
    if (!existingTemplate) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    
    console.log('Existing template found:', existingTemplate);
    
    // Now perform the actual update
    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('template_id', templateId)
      .select()
      .single();
      
    if (error) {
      console.error(`Error updating template with ID ${templateId}:`, error);
      throw new Error(`Failed to update template: ${error.message}`);
    }
    
    if (!data) {
      console.error(`No data returned after update for template ID ${templateId}`);
      throw new Error('Update succeeded but no data returned');
    }
    
    console.log('Database update response:', data);
    return data;
  } catch (error) {
    console.error(`Error in updateTemplate for ID ${templateId}:`, error);
    return null;
  }
};

/**
 * For admin: Update an existing template using SimpleTemplate format
 */
export const updateSimpleTemplate = async (simpleTemplate: SimpleTemplate): Promise<SimpleTemplate | null> => {
  try {
    // Add a timestamp to avoid any caching issues
    const templateWithTimestamp = {
      ...simpleTemplate,
      content: simpleTemplate.content + `<!-- Updated: ${new Date().toISOString()} -->`
    };
    
    const templateData = simpleTemplateToTemplate(templateWithTimestamp);
    
    // Log the template data that's being saved for debugging
    console.log('Updating template with data:', templateData);
    
    const template = await updateTemplate(simpleTemplate.id, templateData);
    
    if (!template) {
      console.error('Failed to update template - received null response');
      return null;
    }
    
    // Convert back to simple template format and return
    const result = templateToSimpleTemplate(template);
    console.log('Template updated successfully:', result);
    return result;
  } catch (error) {
    console.error(`Error in updateSimpleTemplate for ID ${simpleTemplate.id}:`, error);
    return null;
  }
};

/**
 * For admin: Delete a template
 */
export const deleteTemplate = async (templateId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('template_id', templateId);
      
    if (error) {
      console.error(`Error deleting template with ID ${templateId}:`, error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Error in deleteTemplate for ID ${templateId}:`, error);
    return false;
  }
};

/**
 * Generate a template prompt with company information
 * @param templateId - The ID of the template to generate
 * @param companyInfo - Information about the company
 */
export async function generateTemplatePrompt(templateId: string, companyInfo: CompanyInfo): Promise<string> {
  try {
    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (error) {
      throw error;
    }

    if (!template) {
      throw new Error('Template not found');
    }

    // Use the template's prompt and replace placeholders with company info
    let processedTemplate = template.prompt;
    
    // Create a data object with properly mapped fields
    const promptData = {
      // Map fields with potential different naming conventions
      foundYear: companyInfo.foundYear || companyInfo.foundingDate?.split('-')[0] || '',
      companySize: companyInfo.companySize || (companyInfo.employeeCount ? companyInfo.employeeCount.toString() : ''),
      
      // Include all other fields directly from companyInfo
      ...companyInfo
    };
    
    // Replace all placeholders in the template
    Object.entries(promptData).forEach(([key, value]) => {
      if (value !== undefined) {
        const placeholder = `{{${key}}}`;
        processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), String(value));
      }
    });

    // Ensure the template includes common styles
    // Check if the common styles are already included by looking for a distinctive substring
    if (!processedTemplate.includes(COMMON_TEMPLATE_STYLES.substring(0, 30))) {
      processedTemplate = `${processedTemplate}\n\n${COMMON_TEMPLATE_STYLES}`;
    }

    return processedTemplate;
  } catch (error) {
    console.error('Error generating template prompt:', error);
    throw error;
  }
}

/**
 * Validate template HTML for required structure and placeholders
 * @param templateHtml - HTML template to validate
 */
export const validateTemplate = (templateHtml: string): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if template is empty
  if (!templateHtml.trim()) {
    errors.push('Template cannot be empty');
    return { isValid: false, errors, warnings };
  }
  
  // Check for basic HTML structure
  if (!templateHtml.includes('<html') && !templateHtml.includes('<body')) {
    errors.push('Template should include basic HTML structure (<html>, <body>)');
  }
  
  // Check for common template styles
  if (!templateHtml.includes(COMMON_TEMPLATE_STYLES.substring(0, 30))) {
    warnings.push('Template does not include common formatting styles. These will be automatically added.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}; 
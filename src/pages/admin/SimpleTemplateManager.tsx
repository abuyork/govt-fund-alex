import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleTemplateEditor from '../../components/admin/SimpleTemplateEditor';
import TemplateViewer from '../../components/admin/TemplateViewer';
import TemplateTitle from '../../components/admin/TemplateTitle';
import {
  fetchSimpleTemplates,
  fetchSimpleTemplateById,
  createSimpleTemplate,
  updateSimpleTemplate,
  deleteTemplate,
  SimpleTemplate
} from '../../services/templateService';

/**
 * A simplified template manager that uses a rich text editor
 * This allows admins to create and edit templates with minimal complexity
 */
const SimpleTemplateManager: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<SimpleTemplate[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Load templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const loadedTemplates = await fetchSimpleTemplates();
        setTemplates(loadedTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, []);
  
  // Start editing a template
  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(templateId);
    setIsCreating(false);
  };
  
  // Start creating a new template
  const handleCreateTemplate = () => {
    setEditingTemplateId(null);
    setIsCreating(true);
  };
  
  // Extract a clean title from HTML content
  const extractCleanTitle = (content: string): string => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Get the first paragraph or heading text content
      const firstElement = tempDiv.querySelector('p, h1, h2, h3');
      if (firstElement && firstElement.textContent) {
        const text = firstElement.textContent.trim();
        if (text) return text;
      }
      
      // If no suitable element found, use default name with timestamp
      return `템플릿 ${new Date().toISOString().substring(0, 10)}`;
    } catch (error) {
      console.error('Error extracting title:', error);
      return `템플릿 ${new Date().toISOString().substring(0, 10)}`;
    }
  };
  
  // Handle save template
  const handleSaveTemplate = async (templateId: string, content: string, isPremium: boolean) => {
    setLoading(true);
    try {
      console.log('Saving template with content length:', content.length);
      const cleanName = extractCleanTitle(content);
      console.log('Extracted clean name:', cleanName);
      
      let savedTemplate = null;
      
      if (isCreating) {
        // Create new template
        const newTemplate: SimpleTemplate = {
          id: `template-${Date.now()}`,
          name: cleanName,
          content,
          isPremium,
          type: 'custom'
        };
        
        savedTemplate = await createSimpleTemplate(newTemplate);
        console.log('New template created:', savedTemplate);
      } else {
        // Update existing template
        const template = templates.find(t => t.id === templateId);
        if (template) {
          const updatedTemplate = {
            ...template,
            name: cleanName,
            content,
            isPremium
          };
          
          savedTemplate = await updateSimpleTemplate(updatedTemplate);
          console.log('Template updated:', savedTemplate);
        }
      }
      
      // Show success message
      alert('템플릿이 성공적으로 저장되었습니다. 변경사항을 확인하기 위해 페이지가 새로고침됩니다.');
      
      // Force a complete browser refresh to ensure template changes are displayed
      window.location.reload();
      
    } catch (error) {
      console.error('Error saving template:', error);
      alert('템플릿 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setEditingTemplateId(null);
      setIsCreating(false);
    }
  };
  
  // Handle manual refresh of templates
  const handleRefreshTemplates = async () => {
    setLoading(true);
    try {
      const refreshedTemplates = await fetchSimpleTemplates();
      console.log('Manually refreshed templates:', refreshedTemplates);
      setTemplates(refreshedTemplates);
    } catch (error) {
      console.error('Error refreshing templates:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingTemplateId(null);
    setIsCreating(false);
  };
  
  // Delete a template
  const handleDeleteTemplate = async (templateId: string) => {
    // Check if it's a system template
    const isSystemTemplate = templates.find(t => t.id === templateId)?.type === 'system';
    
    const confirmMessage = isSystemTemplate
      ? '이 시스템 템플릿을 숨기시겠습니까? (나중에 초기화 버튼으로 복원할 수 있습니다)'
      : '이 템플릿을 삭제하시겠습니까?';
      
    if (window.confirm(confirmMessage)) {
      setLoading(true);
      try {
        const success = await deleteTemplate(templateId);
        if (success) {
          setTemplates(prev => prev.filter(t => t.id !== templateId));
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('템플릿 삭제 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Handle reset templates
  const handleResetTemplates = async () => {
    if (window.confirm('모든 템플릿을 초기화하고 기본 템플릿으로 되돌리시겠습니까?')) {
      setLoading(true);
      try {
        // Fetch all templates again to reset
        const loadedTemplates = await fetchSimpleTemplates();
        setTemplates(loadedTemplates);
      } catch (error) {
        console.error('Error resetting templates:', error);
        alert('템플릿 초기화 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Get the current template being edited
  const getEditingTemplate = async (): Promise<SimpleTemplate | null> => {
    if (isCreating) {
      return {
        id: `new-template-${Date.now()}`,
        name: '새 템플릿',
        content: `<p>새 템플릿</p>
<p><br></p>
<p><span style="color: rgb(0, 128, 0);">○ 첫번째 섹션</span></p>
<p><span style="color: rgb(0, 0, 255);">■ 첫번째 섹션에 대한 설명을 입력하세요.</span></p>
<p><br></p>
<p><span style="color: rgb(0, 128, 0);">○ 두번째 섹션</span></p>
<p><span style="color: rgb(0, 0, 255);">■ 두번째 섹션에 대한 설명을 입력하세요.</span></p>
<p><br></p>`,
        isPremium: false,
        type: 'custom'
      };
    } else if (editingTemplateId) {
      try {
        // Force a fresh template fetch from the database with a cache-busting query
        console.log('Fetching template with ID:', editingTemplateId);
        const template = await fetchSimpleTemplateById(editingTemplateId);
        
        if (template) {
          console.log('Loaded template for editing:', {
            id: template.id,
            name: template.name,
            contentLength: template.content.length
          });
        } else {
          console.error('Template not found for editing');
        }
        
        return template;
      } catch (error) {
        console.error('Error fetching template for editing:', error);
        return null;
      }
    }
    
    return null;
  };
  
  const [editingTemplate, setEditingTemplate] = useState<SimpleTemplate | null>(null);
  
  // Load the editing template when editingTemplateId changes
  useEffect(() => {
    const loadEditingTemplate = async () => {
      const template = await getEditingTemplate();
      
      if (template) {
        // Create a completely new object to ensure React treats it as a new template
        setEditingTemplate({
          ...template,
          content: template.content + `<!-- Force refresh: ${Date.now()} -->`
        });
      } else {
        setEditingTemplate(null);
      }
    };
    
    loadEditingTemplate();
  }, [editingTemplateId, isCreating]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">간편 템플릿 관리</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRefreshTemplates}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            새로고침
          </button>
          <button
            onClick={handleResetTemplates}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            초기화
          </button>
          <button
            onClick={handleCreateTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 새 템플릿
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">템플릿을 불러오는 중...</p>
        </div>
      ) : editingTemplate ? (
        <SimpleTemplateEditor
          key={`editor-${editingTemplate.id}-${Date.now()}`}
          templateId={editingTemplate.id}
          initialContent={editingTemplate.content}
          initialIsPremium={editingTemplate.isPremium}
          isSystemTemplate={editingTemplate.type === 'system'}
          onSave={handleSaveTemplate}
          onCancel={handleCancelEdit}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium text-lg">
                  <TemplateTitle content={template.name || template.content} />
                  {template.type === 'system' && (
                    <span className="ml-2 text-xs text-gray-500 font-normal">시스템</span>
                  )}
                </h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  template.isPremium 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {template.isPremium ? '프리미엄' : '무료'}
                </span>
              </div>
              
              <div className="h-32 overflow-hidden text-sm text-gray-600 mb-4">
                <TemplateViewer content={template.content.substring(0, 300) + '...'} />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => navigate(`/admin/templates/view/${template.id}`)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  보기
                </button>
                <button
                  onClick={() => handleEditTemplate(template.id)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                >
                  편집
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  {template.type === 'system' ? '숨기기' : '삭제'}
                </button>
              </div>
            </div>
          ))}
          
          {templates.length === 0 && !isCreating && (
            <div className="col-span-full text-center py-10 text-gray-500">
              <p>등록된 템플릿이 없습니다. '새 템플릿' 버튼을 클릭하여 템플릿을 추가하세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleTemplateManager; 
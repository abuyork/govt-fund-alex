import React, { useState, useEffect } from 'react';
import { DynamicTemplate } from '../../services/templates/dynamicTemplateGenerator';
import { 
  convertAllExistingTemplates, 
  getTemplateById 
} from '../../services/templates/templateConverter';
import TemplateEditor from '../../components/admin/TemplateEditor';

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<DynamicTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<DynamicTemplate | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  
  // Load all templates on mount
  useEffect(() => {
    setTemplates(convertAllExistingTemplates());
  }, []);
  
  // Start editing a specific template
  const handleEditTemplate = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      setEditingTemplate(template);
      setIsCreating(false);
    }
  };
  
  // Start creating a new template
  const handleCreateTemplate = () => {
    setEditingTemplate(undefined);
    setIsCreating(true);
  };
  
  // Handle template save (update or create)
  const handleSaveTemplate = (template: DynamicTemplate) => {
    if (isCreating) {
      setTemplates(prev => [...prev, template]);
    } else {
      setTemplates(prev => 
        prev.map(t => t.id === template.id ? template : t)
      );
    }
    
    setEditingTemplate(undefined);
    setIsCreating(false);
    
    // In a real implementation, you would save this to your database
    // For example using Supabase client:
    // const { error } = await supabaseClient
    //   .from('templates')
    //   .upsert(template);
  };
  
  // Handle cancel edit/create
  const handleCancelEdit = () => {
    setEditingTemplate(undefined);
    setIsCreating(false);
  };
  
  // Delete a template
  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('이 템플릿을 정말 삭제하시겠습니까?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      // In a real implementation, you would delete from your database
      // For example using Supabase client:
      // const { error } = await supabaseClient
      //   .from('templates')
      //   .delete()
      //   .eq('id', templateId);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">템플릿 관리</h1>
        <button
          onClick={handleCreateTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 새 템플릿
        </button>
      </div>
      
      {(isCreating || editingTemplate) ? (
        <TemplateEditor
          template={editingTemplate}
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
                <h3 className="font-medium text-lg">{template.name}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  template.isPremium 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {template.isPremium ? '프리미엄' : '무료'}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {template.description}
              </p>
              
              <div className="text-sm text-gray-500 mb-4">
                섹션 수: {template.sections.length}개
              </div>
              
              <div className="flex justify-end space-x-2">
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
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateManager; 
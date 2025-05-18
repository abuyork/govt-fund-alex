import React, { useState, useEffect } from 'react';
import { DynamicTemplate, DynamicTemplateSection, templateToPreviewFormat } from '../../services/templates/dynamicTemplateGenerator';
import TemplateSectionEditor from './TemplateSectionEditor';

interface TemplateEditorProps {
  template?: DynamicTemplate;
  onSave: (template: DynamicTemplate) => void;
  onCancel: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel
}) => {
  // Initialize with empty template or provided template
  const [editingTemplate, setEditingTemplate] = useState<DynamicTemplate>(() => template || {
    id: `template-${Date.now()}`,
    name: '새 템플릿',
    description: '템플릿 설명',
    isPremium: false,
    sections: []
  });
  
  const [showPreview, setShowPreview] = useState(false);
  
  // Reset editing template when prop changes
  useEffect(() => {
    if (template) {
      setEditingTemplate(template);
    }
  }, [template]);
  
  // Handle basic template info changes
  const handleBasicInfoChange = (field: keyof DynamicTemplate, value: any) => {
    setEditingTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Section management
  const handleAddSection = (type: DynamicTemplateSection['type']) => {
    const newSection: DynamicTemplateSection = {
      id: `section-${Date.now()}`,
      type,
      content: type === 'header' ? '새 섹션' : (
        type === 'input' ? '새 입력 필드' : '일반 텍스트'
      ),
      required: type === 'input',
    };
    
    // Add table format if it's a table
    if (type === 'table') {
      newSection.content = '표 제목';
      newSection.tableFormat = {
        columns: ['컬럼1', '컬럼2', '컬럼3'],
        minRows: 3
      };
    }
    
    setEditingTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };
  
  const handleUpdateSection = (index: number, updatedSection: DynamicTemplateSection) => {
    setEditingTemplate(prev => {
      const newSections = [...prev.sections];
      newSections[index] = updatedSection;
      return {
        ...prev,
        sections: newSections
      };
    });
  };
  
  const handleDeleteSection = (index: number) => {
    setEditingTemplate(prev => {
      const newSections = [...prev.sections];
      newSections.splice(index, 1);
      return {
        ...prev,
        sections: newSections
      };
    });
  };
  
  // Move sections up or down
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === editingTemplate.sections.length - 1) return;
    
    setEditingTemplate(prev => {
      const newSections = [...prev.sections];
      const movingSection = newSections[index];
      
      if (direction === 'up') {
        newSections[index] = newSections[index - 1];
        newSections[index - 1] = movingSection;
      } else {
        newSections[index] = newSections[index + 1];
        newSections[index + 1] = movingSection;
      }
      
      return {
        ...prev,
        sections: newSections
      };
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editingTemplate);
  };
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {template ? '템플릿 편집' : '새 템플릿 추가'}
      </h2>
      
      <div className="mb-4 flex justify-end space-x-2">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="px-4 py-2 text-sm bg-gray-200 rounded"
        >
          {showPreview ? '편집 모드' : '미리보기'}
        </button>
      </div>
      
      {showPreview ? (
        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <pre className="whitespace-pre-wrap">
            {templateToPreviewFormat(editingTemplate)}
          </pre>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">템플릿 이름</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프리미엄 템플릿</label>
                <input
                  type="checkbox"
                  checked={editingTemplate.isPremium}
                  onChange={(e) => handleBasicInfoChange('isPremium', e.target.checked)}
                  className="h-5 w-5"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">템플릿 설명</label>
              <textarea
                value={editingTemplate.description}
                onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                rows={3}
                className="w-full border rounded-md p-2"
              />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-medium mb-4">섹션</h3>
            
            <div className="space-y-1 mb-4">
              {editingTemplate.sections.map((section, index) => (
                <div key={section.id} className="flex items-start space-x-2">
                  <div className="flex flex-col space-y-1">
                    <button
                      type="button"
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      className={`text-sm px-2 py-1 rounded ${
                        index === 0 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === editingTemplate.sections.length - 1}
                      className={`text-sm px-2 py-1 rounded ${
                        index === editingTemplate.sections.length - 1 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      ↓
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <TemplateSectionEditor
                      section={section}
                      onChange={(updatedSection) => handleUpdateSection(index, updatedSection)}
                      onDelete={() => handleDeleteSection(index)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">섹션 추가</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAddSection('header')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                >
                  + 제목 (○)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection('subheader')}
                  className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
                >
                  + 부제목 (○)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection('input')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  + 입력 필드 (■)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection('text')}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                >
                  + 일반 텍스트
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection('table')}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  + 테이블
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TemplateEditor; 
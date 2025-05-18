import React, { useState } from 'react';
import { DynamicTemplateSection } from '../../services/templates/dynamicTemplateGenerator';

interface TemplateSectionEditorProps {
  section: DynamicTemplateSection;
  onChange: (updatedSection: DynamicTemplateSection) => void;
  onDelete: () => void;
}

const TemplateSectionEditor: React.FC<TemplateSectionEditorProps> = ({
  section,
  onChange,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as DynamicTemplateSection['type'];
    onChange({
      ...section,
      type: newType
    });
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...section,
      content: e.target.value
    });
  };
  
  const handleRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...section,
      required: e.target.checked
    });
  };
  
  const handleMaxLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      onChange({
        ...section,
        maxLength: value
      });
    }
  };
  
  // Table format editing
  const handleTableColumnChange = (value: string) => {
    const columns = value.split(',').map(col => col.trim());
    onChange({
      ...section,
      tableFormat: {
        ...(section.tableFormat || { minRows: 3 }),
        columns
      }
    });
  };
  
  const handleTableRowsChange = (value: number) => {
    onChange({
      ...section,
      tableFormat: {
        ...(section.tableFormat || { columns: [] }),
        minRows: value
      }
    });
  };
  
  // Render section with appropriate color coding
  const renderSectionPreview = () => {
    switch (section.type) {
      case 'header':
        return <div className="text-lg font-bold mt-4 text-green-600">○ {section.content}</div>;
      case 'subheader':
        return <div className="text-md font-semibold mt-3 text-green-600">○ {section.content}</div>;
      case 'input':
        return <div className="mt-2 text-blue-600">■ {section.content}</div>;
      case 'text':
        return <div className="mt-2 text-gray-700">{section.content}</div>;
      case 'table':
        return (
          <div className="mt-3 mb-2">
            <div className="text-gray-700">{section.content}</div>
            {section.tableFormat && (
              <div className="mt-1 text-xs text-gray-500">
                테이블 컬럼: {section.tableFormat.columns.join(', ')}
              </div>
            )}
          </div>
        );
      default:
        return <div>{section.content}</div>;
    }
  };
  
  return (
    <div className="border p-4 rounded-lg mb-4 bg-white shadow-sm">
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">섹션 유형</label>
              <select 
                value={section.type} 
                onChange={handleTypeChange}
                className="w-full border rounded-md p-2"
              >
                <option value="header">제목 (○)</option>
                <option value="subheader">부제목 (○)</option>
                <option value="input">입력 필드 (■)</option>
                <option value="text">일반 텍스트</option>
                <option value="table">테이블</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">필수 항목</label>
              <input 
                type="checkbox" 
                checked={section.required} 
                onChange={handleRequiredChange}
                className="h-5 w-5"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              value={section.content}
              onChange={handleContentChange}
              rows={3}
              className="w-full border rounded-md p-2"
            />
          </div>
          
          {section.type === 'input' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최대 길이</label>
              <input
                type="number"
                value={section.maxLength || 150}
                onChange={handleMaxLengthChange}
                className="w-full border rounded-md p-2"
              />
            </div>
          )}
          
          {section.type === 'table' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">테이블 컬럼 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={section.tableFormat?.columns.join(', ') || ''}
                  onChange={(e) => handleTableColumnChange(e.target.value)}
                  className="w-full border rounded-md p-2"
                  placeholder="예: 이름, 날짜, 내용"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최소 행 수</label>
                <input
                  type="number"
                  value={section.tableFormat?.minRows || 3}
                  onChange={(e) => handleTableRowsChange(parseInt(e.target.value))}
                  className="w-full border rounded-md p-2"
                  min={1}
                />
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-2 mt-4">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-sm bg-gray-200 rounded"
            >
              취소
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
            >
              저장
            </button>
            <button 
              onClick={onDelete}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded"
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        <div>
          {renderSectionPreview()}
          <div className="flex justify-end mt-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              수정
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSectionEditor; 
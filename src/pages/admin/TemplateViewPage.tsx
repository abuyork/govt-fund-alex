import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TemplateViewer from '../../components/admin/TemplateViewer';
import { loadTemplates, getTemplateById } from '../../services/templates/simpleTemplateService';

/**
 * Template View Page
 * This component allows users to view a template without editing
 */
const TemplateViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [templateContent, setTemplateContent] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    setLoading(true);
    // Load templates from template service
    if (id) {
      try {
        const templates = loadTemplates();
        const template = templates.find((t) => t.id === id);
        
        if (template) {
          setTemplateContent(template.content);
          setTemplateName(template.name);
          setIsPremium(template.isPremium);
        } else {
          console.error('Template not found');
        }
      } catch (error) {
        console.error('Failed to load template:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [id]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{templateName || '템플릿 보기'}</h1>
          {isPremium && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
              프리미엄
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/admin/templates')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            돌아가기
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            인쇄
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">템플릿을 불러오는 중...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow border">
          <TemplateViewer content={templateContent} />
        </div>
      )}
    </div>
  );
};

export default TemplateViewPage; 
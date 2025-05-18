import React from 'react';
import { FileText } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  title: string;
  type: string;
  isFree: boolean;
  color: string;
}

interface TemplateListProps {
  templates: Template[];
  onSelectTemplate: (id: string) => void;
}

export default function TemplateList({ templates, onSelectTemplate }: TemplateListProps) {
  const getTemplateColorClass = (color: string) => {
    switch(color) {
      case 'green': return 'text-green-600';
      case 'blue': return 'text-blue-600';
      case 'purple': return 'text-purple-600';
      case 'orange': return 'text-orange-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {templates.map((template) => (
        <div 
          key={template.id} 
          className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer"
          onClick={() => onSelectTemplate(template.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <FileText className={`w-6 h-6 ${getTemplateColorClass(template.color)}`} />
            {!template.isFree && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">₩3,000</span>
            )}
          </div>
          <h4 className="font-medium">{template.title || template.name}</h4>
        </div>
      ))}
    </div>
  );
}
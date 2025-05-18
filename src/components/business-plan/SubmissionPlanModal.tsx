import React, { useState } from 'react';
import { X, FileText, Edit, Save, Download, RefreshCw } from 'lucide-react';
import { exportToPdf, exportToDocx } from '../../utils/exportUtils';
import { showDownloadFormatGuide } from '../../utils/downloadHelper';

interface Section {
  title: string;
  content: string;
  isEditing?: boolean;
}

interface SubmissionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  onUpdateSection: (index: number, content: string) => void;
  selectedTemplateTitle?: string;
  templateColor?: string;
  draftPlanTitle?: string;
  onSavePlan?: () => void;
  onRegeneratePlan?: () => void;
  onChangeTemplate?: () => void;
}

export default function SubmissionPlanModal({
  isOpen,
  onClose,
  sections,
  onUpdateSection,
  selectedTemplateTitle = '스타트업 템플릿',
  templateColor = 'green',
  draftPlanTitle = '사업계획서',
  onSavePlan = () => {},
  onRegeneratePlan = () => {},
  onChangeTemplate = () => {},
}: SubmissionPlanModalProps) {
  if (!isOpen) return null;
  
  // Function to get the appropriate background color class based on template color
  const getColorClass = (color: string) => {
    switch(color) {
      case 'green': return 'bg-green-50 text-green-600';
      case 'blue': return 'bg-blue-50 text-blue-600';
      case 'purple': return 'bg-purple-50 text-purple-600';
      case 'orange': return 'bg-orange-50 text-orange-600';
      case 'red': return 'bg-red-50 text-red-600';
      default: return 'bg-green-50 text-green-600';
    }
  };

  const colorClass = getColorClass(templateColor);
  
  // Render content helper function
  const renderContent = (content: string, isEditing: boolean, sectionIndex: number) => {
    if (isEditing) {
      return (
        <textarea
          className="w-full h-40 p-2 border border-gray-300 rounded"
          value={content}
          onChange={(e) => onUpdateSection(sectionIndex, e.target.value)}
        />
      );
    }
    
    // Display as formatted text
    const lines = content.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Format paragraphs
      if (line.trim() === '') {
        result.push(<div key={`space-${i}`} className="my-1"></div>);
        continue;
      }
      
      // Add bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        result.push(<div key={`bullet-${i}`} className="ml-4 my-1">{line}</div>);
        continue;
      }
      
      // Regular paragraph
      result.push(<p key={`para-${i}`} className="my-1">{line}</p>);
    }
    
    return (
      <div className="w-full">
        <div className="prose max-w-none w-full">
          {result}
        </div>
      </div>
    );
  };

  // Function to handle download option click
  const handleDownloadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropdown = document.getElementById('submission-download-format-dropdown');
    if (dropdown) {
      // Always hide first, then calculate and show
      dropdown.classList.add('hidden');
      
      // Make it visible off-screen temporarily to calculate height
      dropdown.style.position = 'fixed';
      dropdown.style.top = '-1000px';
      dropdown.style.left = '-1000px';
      dropdown.classList.remove('hidden');
      
      // Get the height and position
      const rect = e.currentTarget.getBoundingClientRect();
      const dropdownHeight = dropdown.offsetHeight;
      
      // Position above button
      dropdown.style.top = `${rect.top - dropdownHeight - 10}px`;
      dropdown.style.left = `${rect.left}px`;
      dropdown.style.zIndex = '50';
      
      // Show download format guide
      showDownloadFormatGuide();
    }
  };

  // Function to download in different formats
  const downloadPlan = (format: 'txt' | 'pdf' | 'docx') => {
    switch(format) {
      case 'txt':
        // Create text content from sections
        const textContent = sections.map(section => {
          return `## ${section.title}\n\n${section.content}\n\n`;
        }).join('');
        
        // Create a blob with the content
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${draftPlanTitle}_제출용_${selectedTemplateTitle}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
        
      case 'pdf':
        const submissionElement = document.querySelector('.border.rounded-lg.overflow-hidden') as HTMLElement;
        exportToPdf(submissionElement, `${draftPlanTitle}_제출용`);
        break;
        
      case 'docx':
        exportToDocx(sections, `${draftPlanTitle}_제출용`);
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-4 md:p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">제출용 사업계획서</h3>
          <button onClick={onClose} type="button" aria-label="Close">
            <div className="flex items-center justify-center">
              <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
            </div>
          </button>
        </div>
        
        <div className="mb-6">
          <div className={`p-4 ${colorClass.split(' ')[0]} rounded-lg mb-4 flex justify-between items-center`}>
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center">
                <FileText className={`w-5 h-5 ${colorClass.split(' ')[1]}`} />
              </div>
              <span className="font-medium">선택된 템플릿: {selectedTemplateTitle}</span>
            </div>
            <button 
              className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
              onClick={onChangeTemplate}
            >
              템플릿 변경하기
            </button>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            {sections.map((section, sectionIndex) => {
              const sectionTitle = section.title;
              
              // Make sure section content doesn't start with template name
              let sectionContent = section.content;
              if (sectionContent.match(/^Basic Startup Template|^Template/i)) {
                sectionContent = sectionContent.replace(/^.*Template.*(\(Free\))?\s*\n*/i, '');
              }
              
              return (
                <div key={sectionIndex} className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-300 pb-1">
                      {sectionTitle}
                    </h3>
                    <button
                      onClick={() => {
                        const updatedSections = [...sections];
                        updatedSections[sectionIndex].isEditing = !updatedSections[sectionIndex].isEditing;
                        onUpdateSection(sectionIndex, updatedSections[sectionIndex].content);
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        section.isEditing 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {section.isEditing ? '저장' : '편집'}
                    </button>
                  </div>
                  <div className="pl-2">
                    {renderContent(sectionContent, section.isEditing || false, sectionIndex)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            <span>취소</span>
          </button>
          
          <button 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRegeneratePlan();
            }}
          >
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              <span>재생성</span>
            </div>
          </button>
          
          <button 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSavePlan();
            }}
          >
            <div className="flex items-center">
              <Save className="w-4 h-4 mr-2" />
              <span>저장하기</span>
            </div>
          </button>
          
          <button 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            onClick={handleDownloadClick}
          >
            <div className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              <span>다운로드 (옵션 클릭)</span>
            </div>
          </button>
        </div>
        
        {/* Submission Download Format Dropdown */}
        <div id="submission-download-format-dropdown" className="fixed mt-2 bg-white shadow-lg rounded-lg border border-gray-200 p-2 z-50 hidden">
          <button 
            className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              downloadPlan('txt');
            }}
          >
            TXT 형식으로 다운로드
          </button>
          <button 
            className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              downloadPlan('pdf');
            }}
          >
            PDF 형식으로 다운로드
          </button>
          <button 
            className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              downloadPlan('docx');
            }}
          >
            DOCX 형식으로 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}
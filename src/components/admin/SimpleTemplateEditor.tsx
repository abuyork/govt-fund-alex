import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface SimpleTemplateEditorProps {
  templateId: string;
  initialContent: string;
  onSave: (templateId: string, content: string, isPremium: boolean) => void;
  onCancel: () => void;
  isSystemTemplate?: boolean;
  initialIsPremium?: boolean;
}

const SimpleTemplateEditor: React.FC<SimpleTemplateEditorProps> = ({
  templateId,
  initialContent,
  onSave,
  onCancel,
  isSystemTemplate = false,
  initialIsPremium = false
}) => {
  console.log(`Mounting editor for template ${templateId} with content length:`, initialContent?.length);
  
  // Clean initial content of any timestamp comments
  const cleanInitialContent = initialContent?.replace(/<!-- (Updated|Loaded): .*? -->/g, '') || '';
  
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [isPremium, setIsPremium] = useState(initialIsPremium);
  const [editorInitialized, setEditorInitialized] = useState(false);
  
  // Extract name from template content
  useEffect(() => {
    if (!name) {
      console.log('Extracting name from initialContent, length:', cleanInitialContent.length);
      
      // Create a temp div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cleanInitialContent;
      
      // Get the first paragraph or heading text content
      const firstElement = tempDiv.querySelector('p, h1, h2, h3, h4, h5, h6');
      if (firstElement) {
        const extractedName = firstElement.textContent || '새 템플릿';
        console.log('Extracted name from first element:', extractedName);
        setName(extractedName);
      } else {
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        const firstLine = textContent.split('\n')[0];
        const extractedName = firstLine || '새 템플릿';
        console.log('Extracted name from text content:', extractedName);
        setName(extractedName);
      }
    }
  }, [cleanInitialContent, name]);

  // Setup Quill editor modules
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'list', 'bullet'
  ];

  // Initialize content properly
  useEffect(() => {
    console.log('Initializing editor with content, length:', cleanInitialContent.length);
    
    // Always reset the editor state when initialContent changes
    setEditorInitialized(false);
    
    // If initialContent has raw HTML tags showing, parse them
    if (cleanInitialContent.includes('&lt;') || cleanInitialContent.includes('&gt;')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cleanInitialContent;
      setContent(tempDiv.innerHTML);
    } else {
      // Set content directly if it's already valid HTML
      setContent(cleanInitialContent);
    }
    
    setEditorInitialized(true);
  }, [cleanInitialContent]); // Only depend on cleanInitialContent

  const handleSave = () => {
    console.log('Saving template with content length:', content.length);
    
    try {
      // Process the content to identify sections
      const processedContent = processTemplateContent(content);
      console.log('Processed content length:', processedContent.length);
      
      // Update the first paragraph to include the template name if provided
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = processedContent;
      
      // Find the first paragraph element
      const firstParagraph = tempDiv.querySelector('p');
      if (name && firstParagraph) {
        // If name is provided and different from first paragraph, update it
        firstParagraph.innerHTML = name;
        console.log('Updated first paragraph with name:', name);
      } else if (name && !firstParagraph) {
        // If no first paragraph but we have a name, create one
        const newFirstParagraph = document.createElement('p');
        newFirstParagraph.innerHTML = name;
        if (tempDiv.firstChild) {
          tempDiv.insertBefore(newFirstParagraph, tempDiv.firstChild);
        } else {
          tempDiv.appendChild(newFirstParagraph);
        }
        console.log('Created new first paragraph with name:', name);
      }
      
      // Get the final content with name update
      const finalContent = tempDiv.innerHTML;
      console.log('Final content length:', finalContent.length);
      
      // Call the save handler with the processed content
      onSave(templateId, finalContent, isPremium);
    } catch (error) {
      console.error('Error processing template content:', error);
      alert('템플릿 처리 중 오류가 발생했습니다.');
    }
  };

  // Process template content to mark section types
  const processTemplateContent = (htmlContent: string): string => {
    // Make sure content is properly decoded
    const decodedContent = htmlContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    
    // Convert the HTML to a temp element to parse
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = decodedContent;
    
    // Find all green and blue text elements
    const greenElements = tempDiv.querySelectorAll('span[style*="color: rgb(0, 128, 0)"], span[style*="color: green"]');
    const blueElements = tempDiv.querySelectorAll('span[style*="color: rgb(0, 0, 255)"], span[style*="color: blue"]');
    
    // Add markers to green text elements (but avoid adding duplicate markers)
    greenElements.forEach(element => {
      const text = element.textContent || '';
      if (!text.trim().startsWith('○')) {
        element.textContent = `○ ${text}`;
      }
    });
    
    // Add markers to blue text elements (but avoid adding duplicate markers)
    blueElements.forEach(element => {
      const text = element.textContent || '';
      if (!text.trim().startsWith('■')) {
        element.textContent = `■ ${text}`;
      }
    });
    
    return tempDiv.innerHTML;
  };
  
  // Insert a table template at the current cursor position
  const insertTableTemplate = () => {
    const tableTemplate = `
<p><span style="color: rgb(0, 0, 255);">■ 아래 항목에 맞게 표를 작성하세요.</span></p>
<p><br></p>
<p>## 테이블 시작 ##</p>
<p>항목,내용,설명</p>
<p>항목1,내용1,설명1</p>
<p>항목2,내용2,설명2</p>
<p>항목3,내용3,설명3</p>
<p>## 테이블 끝 ##</p>
<p><br></p>`;
    
    setContent(prevContent => {
      return prevContent + tableTemplate;
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">템플릿 이름</label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md p-2"
            placeholder="템플릿 이름 (자동으로 첫 문단에서 추출됩니다)"
          />
        </div>
        
        <div className="mb-4 flex items-center">
          <input 
            type="checkbox"
            checked={isPremium}
            onChange={(e) => setIsPremium(e.target.checked)}
            className="h-5 w-5 mr-2"
          />
          <label className="text-sm font-medium text-gray-700">프리미엄 템플릿</label>
          
          {isSystemTemplate && (
            <span className="ml-4 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              시스템 템플릿
            </span>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="p-3 bg-gray-100 rounded mb-2 text-sm">
          <p><span className="text-green-600 font-bold">녹색 텍스트</span>: 템플릿 섹션 제목 (○ 기호가 자동으로 추가됨)</p>
          <p><span className="text-blue-600 font-bold">파란색 텍스트</span>: 입력 필드 (■ 기호가 자동으로 추가됨)</p>
          <p>에디터의 색상 도구를 사용하여 텍스트 색상을 변경하세요.</p>
        </div>
        
        <div className="mb-2">
          <button 
            onClick={insertTableTemplate}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            표 템플릿 삽입
          </button>
        </div>
        
        <ReactQuill 
          key={`quill-editor-${templateId}-${Date.now()}`}
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          formats={formats}
          style={{ height: '500px', marginBottom: '50px' }}
        />
      </div>
      
      <div className="flex justify-end space-x-2 mt-16">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          저장
        </button>
      </div>
    </div>
  );
};

export default SimpleTemplateEditor; 
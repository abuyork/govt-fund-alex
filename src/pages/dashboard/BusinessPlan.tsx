import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, AlertCircle, X, Check, Edit, Save, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { generateBusinessPlan, generateBusinessPlanStream, isOpenAIConfigured } from '../../services/openai';
import { templateFunctions } from '../../services';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import TableRenderer from '../../components/business-plan/TableRenderer';
import { fetchTemplates } from '../../services/templateService';
import { Template } from '../../types/Template';
import { exportToPdf, exportToDocx } from '../../utils/exportUtils';
import { showDownloadFormatGuide } from '../../utils/downloadHelper';
import SubmissionPlanModal from '../../components/business-plan/SubmissionPlanModal';
import { PlanUpgradeModal } from '../../components/account';

export default function BusinessPlan() {
  const navigate = useNavigate();
  const [showDraftPlanModal, setShowDraftPlanModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPlanUpgradeModal, setShowPlanUpgradeModal] = useState(false);
  const [showSubmissionPlanModal, setShowSubmissionPlanModal] = useState(false);
  const [openAIConfigured, setOpenAIConfigured] = useState(false);
  const [openAIError, setOpenAIError] = useState<string | null>(null);
  
  // Get subscription context
  const { currentPlan, canUseFeature, remainingUsage, refreshSubscription } = useSubscription();

  // Refresh subscription data when component mounts
  useEffect(() => {
    // Ensure we have the latest subscription data from the server
    const refreshData = async () => {
      await refreshSubscription();
      console.log('Refreshed subscription data, current plan:', currentPlan);
      
      // Add a small delay to allow state to update
      setTimeout(() => {
        const hasAccess = canUseFeature('allTemplates');
        console.log('After refresh - template access:', hasAccess);
        if (currentPlan === 'pro' && !hasAccess) {
          console.log('Forcing refresh again as pro plan should have template access');
          refreshSubscription();
        }
      }, 500);
    };
    
    refreshData();
    // Empty dependency array means this only runs once on mount
  }, []);

  // Check if OpenAI is configured on component mount
  useEffect(() => {
    setOpenAIConfigured(isOpenAIConfigured());
  }, []);
  
  // For Draft Plan (Plan A)
  const [draftPlanContent, setDraftPlanContent] = useState('');
  const [draftPlanTitle, setDraftPlanTitle] = useState('');
  const [itemName, setItemName] = useState('');
  const [isGeneratingDraftPlan, setIsGeneratingDraftPlan] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Company basic info
  const [companyName, setCompanyName] = useState('');
  const [companyFoundYear, setCompanyFoundYear] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  
  // Business item details
  const [itemDescription, setItemDescription] = useState('');
  const [itemUniquePoint, setItemUniquePoint] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  
  // AI Prompt
  const [customPrompt, setCustomPrompt] = useState('');
  
  // For Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateSource, setTemplateSource] = useState<'draft' | 'submission'>('submission');
  
  // For Submission Plan (Plan B)
  const [submissionPlanSections, setSubmissionPlanSections] = useState<{ title: string, content: string, isEditing?: boolean }[]>([]);
  
  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'txt' | 'pdf' | 'docx' | null>(null);
  
  // Add new state to manage saved plans
  const [savedPlans, setSavedPlans] = useState<Array<{
    id: string;
    title: string;
    type: string;
    content: string;
    template?: string;
    date: string;
    status: string;
  }>>([]);
  
  // Get the current user ID from auth context
  const { user } = useAuth();
  
  // Add a new state variable to store the selected template name in Korean and title
  const [selectedTemplateTitle, setSelectedTemplateTitle] = useState<string>('');
  
  // New state for templates loaded from Supabase
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  // Fetch templates from Supabase
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const data = await fetchTemplates();
        console.log('Loaded templates from Supabase:', data);
        setTemplates(data);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('템플릿을 불러오는 중 오류가 발생했습니다.');
        // Set fallback templates if Supabase loading fails
        setTemplates([
          { id: 'fallback-id', name: '스타트업 템플릿', title: '스타트업 사업계획서', type: '기본 양식', is_free: true, color: 'green', sections: [], subtitle: [], prompt: '', template_id: 'basic-startup', created_at: '', updated_at: '' }
        ]);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);
  
  // Add a function to filter templates based on the type
  const getFilteredTemplates = (type: 'draft' | 'submission') => {
    // For draft plans, don't show any templates
    if (type === 'draft') {
      return [];
    }
    // Show all templates for submission type
    return templates;
  };
  
  // Generate draft plan logic, updated to check for AI usage limits
  const generateDraftPlan = async () => {
    // Check if user has unlimited AI plans or still has free generations left
    if (!canUseFeature('unlimitedAiPlans') && remainingUsage.aiBusinessPlans <= 0) {
      toast.error('무료 AI 사업계획서 생성 횟수를 모두 사용하셨습니다. 플랜을 업그레이드하여 무제한으로 사용하세요.');
      setShowPlanUpgradeModal(true);
      return;
    }

    setIsGeneratingDraftPlan(true);
    setOpenAIError(null);
    
    try {
      // For draft business plans, always use this specific prompt
      const draftPrompt = `
# Draft business plan prompts

- Overview
    - The overview must include 'Item Overview', 'Background and Need for Startup', 'Item Preparation Status and Realization Plan', and 'Target Market and Creation Plan'.
- Problem recognition
    - Background and need for your business idea
        - Present the background of the service development and the rationale and motivation to support it.
        - external background and motivation, such as socio-economic and technological perspectives, problems and opportunities in domestic and international markets, etc,
        - internal background and motivation, e.g. from the perspective of the representative's experience, values, vision, etc.
        - Describe the problem and solution found in the background and need, the need, and the purpose of developing and refining it.
    - Analyze your startup's target market (customers)
        - Specify the value to be provided to the defined customer and the detailed market to be served based on the background and need for the startup item development.
        - Describe the size, situation, and characteristics of the market to be entered, competition intensity, future prospects, customer characteristics, etc.
        - Effects expected through product/service development and refinement, etc.
- Solution
    - Current status
    - Describe the progress made in recognizing the problem of the need for products and services and planning and promoting the development and materialization of such products and services.
    - Describe the overall status of the item's development and refinement, the response from the target market, and key quantitative and qualitative outcomes to date.
- How to realize and materialize
    - What you want to realize and materialize
    - Describe specific development and specificization plans through core functions, performance, design, commercialization activities, etc. for problems and improvements identified through target market analysis.
    - Describe the ability to secure competitiveness, differentiation, etc. based on the company's own capabilities for the problems and improvements identified through comparison with competing products and services in the existing market.
- Scale-up
    - Commercialization strategy
        - Strategy for building a business model to generate revenue
        - Specific customer acquisition and monetization strategies to reach a defined target market.
        - Commercialization outcomes you want to achieve within one year (revenue, investment, employment, etc.)
        - A detailed plan for sustaining the business beyond one year.
- Business-wide roadmap
    - A three-year quarterly plan outlining the goals and comprehensive timeline for all phases of the business.

## 기본 정보
- 회사명: ${companyName || '미입력'}
- 설립연도: ${companyFoundYear || '미입력'}
- 회사규모: ${companySize || '미입력'}
- 산업분야: ${companyIndustry || '미입력'}

## 사업 아이템 상세
- 아이템명: ${itemName || '미입력'}
- 아이템 설명: ${itemDescription || '미입력'}
- 차별화 포인트: ${itemUniquePoint || '미입력'}
- 목표 시장: ${targetMarket || '미입력'}

## 추가 지시사항
${customPrompt || '없음'}
`;

      // Using OpenAI API
      const response = await generateBusinessPlan(draftPrompt);
      
      if (response.success && response.content) {
        setDraftPlanContent(response.content);
        setShowTemplateModal(false);
        setShowDraftPlanModal(true);
      } else {
        setOpenAIError(response.error || "사업계획서 생성에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("Error generating draft plan:", error);
      setOpenAIError(error.message || "사업계획서 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingDraftPlan(false);
    }
  };
  
  const generateSubmissionPlan = async () => {
    // Debug logs to show plan information
    console.log('Current plan:', currentPlan);
    const hasTemplateAccess = canUseFeature('allTemplates');
    console.log('Has template access:', hasTemplateAccess);
    
    // Check if user has access to templates
    if (!hasTemplateAccess) {
      toast.error('템플릿 이용을 위해 개별 구매 또는 구독이 필요합니다.');
      setShowPlanUpgradeModal(true);
      return;
    }
    
    // Ensure we're generating a submission plan with a template
    if (templateSource !== 'submission' || !selectedTemplate) {
      toast.error('제출용 사업계획서에는 템플릿 선택이 필요합니다.');
      setTemplateSource('submission');
      setShowTemplateModal(true);
      return;
    }
    
    setIsGeneratingDraftPlan(true);
    setOpenAIError(null);
    
    try {
      // Changed to use template_id instead of id
      const template = templates.find(t => t.template_id === selectedTemplate);
      
      // Safety check - if no template is selected, default to basic-startup
      const templateId = selectedTemplate || 'basic-startup';
      
      // Get the appropriate template function based on the selected template ID
      // Add safety check to ensure the function exists
      const templateFunction = templateFunctions[templateId as keyof typeof templateFunctions];
      
      // Set the selected template title based on the template's title
      const templateTitle = template ? template.title : '스타트업 템플릿';
      
      setSelectedTemplateTitle(templateTitle);
      
      if (!templateFunction) {
        console.error("Template function not found for ID:", templateId);
        // Fallback to basic startup
        setSelectedTemplate('basic-startup');
        toast.error('템플릿을 불러오는 데 문제가 있습니다. 기본 템플릿을 사용합니다.');
      }
      
      // Always use a valid template function
      const validTemplateFunction = templateFunction || templateFunctions['basic-startup'];
      
      const prompt = validTemplateFunction({
        companyName,
        foundYear: companyFoundYear,
        companySize,
        industry: companyIndustry,
        itemName,
        itemDescription,
        uniquePoint: itemUniquePoint,
        targetMarket
      }, undefined, customPrompt);

      // Using OpenAI API for submission plans
      const response = await generateBusinessPlan(prompt);
      
      if (response.success && response.content) {
        try {
          // Pre-process to remove any template headers in English
          let processedContent = response.content;
          
          // Remove any "Basic Startup Template (Free)" or similar headers
          processedContent = processedContent.replace(/^.*Template.*(\(Free\))?\s*\n*/gmi, '');
          
          // Try to parse the JSON response from OpenAI
          let parsedContent;
          try {
            parsedContent = JSON.parse(processedContent);
          } catch (parseError) {
            // If parsing fails, it's likely markdown format
            // Extract sections from markdown instead
            const sections = extractSectionsFromMarkdown(processedContent);
            // Clean up the content
            const cleanedSections = sections.map(section => ({
              ...section,
              content: cleanContentFormat(section.content)
            }));
            setSubmissionPlanSections(cleanedSections);
            setShowTemplateModal(false);
            setShowSubmissionPlanModal(true);
            setIsGeneratingDraftPlan(false);
            return;
          }
          
          // If the content is an array, use it directly
          if (Array.isArray(parsedContent)) {
            const cleanedContent = parsedContent.map(section => ({
              ...section,
              // Remove translation of title
              title: section.title,
              content: cleanContentFormat(section.content)
            }));
            setSubmissionPlanSections(cleanedContent);
          } else {
            // Otherwise, convert object into array format expected by the component
            const sectionsArray = Object.entries(parsedContent).map(([key, value]) => ({
              // Remove translation of key
              title: key,
              content: cleanContentFormat(typeof value === 'string' ? value : JSON.stringify(value))
            }));
            
            setSubmissionPlanSections(sectionsArray);
          }
          
          setShowTemplateModal(false);
          setShowSubmissionPlanModal(true);
        } catch (error) {
          console.error("Error processing OpenAI response:", error);
          setOpenAIError("API 응답을 처리하는 중 오류가 발생했습니다.");
        }
      } else {
        setOpenAIError(response.error || "사업계획서 생성에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("Error generating submission plan:", error);
      setOpenAIError(error.message || "사업계획서 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingDraftPlan(false);
    }
  };

  // Helper function to clean content formatting
  const cleanContentFormat = (content: string): string => {
    // Remove ** markers used for bold text in markdown
    let cleanedContent = content.replace(/\*\*/g, '');
    
    // Remove character count guidance like (약 100자)
    cleanedContent = cleanedContent.replace(/\([약]*\s*\d+[자]*\)/g, '');
    
    // Remove any bullet point markers that might be present
    cleanedContent = cleanedContent.replace(/^[-*]\s+/gm, '');
    
    // Remove template titles at the beginning, such as "Basic Startup Template (Free)"
    cleanedContent = cleanedContent.replace(/^Basic Startup Template\s*(\(Free\))?\s*\n*/im, '');
    cleanedContent = cleanedContent.replace(/^2025 Early Startup Package Template\s*\n*/i, '');
    cleanedContent = cleanedContent.replace(/^Social Enterprise Template\s*\n*/i, '');
    cleanedContent = cleanedContent.replace(/^2025 Startup Success Package Template\s*\n*/i, '');
    cleanedContent = cleanedContent.replace(/^R&D[- ]focused Template\s*\n*/i, '');
    cleanedContent = cleanedContent.replace(/^Export Company Template\s*\n*/i, '');
    
    // More aggressive pattern to catch all variations of template titles in English
    cleanedContent = cleanedContent.replace(/^.*(Template|template).*(\(Free\))?\s*\n*/gm, '');
    
    // Remove ChatGPT-style headers like "Background/Challenges":
    cleanedContent = cleanedContent.replace(/^(?:Background|Problems|Challenges|Solutions|Motivation|Introduction|Overview|Analysis|Strategy|Market|Business|Financial|Goals)[\/&:\s][a-zA-Z\s]+:?/gmi, '');
    
    // Remove any English section titles that might appear at the beginning of sections
    cleanedContent = cleanedContent.replace(/^(Executive Summary|Company Overview|Market Analysis|Product Description|Competitive Analysis|Marketing Strategy|Financial Plan|Implementation Plan|Risk Analysis|Conclusion):\s*\n*/gmi, '');
    
    // Clean up any double line breaks that might result from the removals
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return cleanedContent.trim();
  };

  // Helper function to extract sections from markdown format
  const extractSectionsFromMarkdown = (markdown: string): { title: string, content: string }[] => {
    const sections: { title: string, content: string }[] = [];
    const lines = markdown.split('\n');
    
    let currentTitle = '';
    let currentContent = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a heading (starts with # or ##)
      if (line.startsWith('# ') || line.startsWith('## ')) {
        // Save the previous section if we have one
        if (currentTitle) {
          sections.push({
            title: currentTitle,
            content: currentContent.trim()
          });
        }
        
        // Start a new section (no translation)
        currentTitle = line.replace(/^#+ /, '');
        currentContent = '';
      } else {
        // Add to the current content
        currentContent += line + '\n';
      }
    }
    
    // Add the last section
    if (currentTitle) {
      sections.push({
        title: currentTitle,
        content: currentContent.trim()
      });
    }
    
    return sections;
  };

  const updateSectionContent = (index: number, newContent: string) => {
    const updatedSections = [...submissionPlanSections];
    updatedSections[index].content = newContent;
    setSubmissionPlanSections(updatedSections);
  };
  
  // Function to get background color based on template color
  const getTemplateColorClass = (color: string) => {
    switch(color) {
      case 'green': return 'bg-green-100 text-green-600';
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'orange': return 'bg-orange-100 text-orange-600';
      case 'red': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Function to save a business plan
  const savePlan = async (type: 'draft' | 'submission') => {
    try {
      // Check if user is logged in
      if (!user || !user.id) {
        toast.error('로그인이 필요합니다.');
        return;
      }
      
      // Create a new plan object
      const planData = {
        user_id: user.id,
        title: type === 'draft' ? draftPlanTitle || '제목 없음' : '제출용 사업계획서',
        type: type === 'draft' ? '기본 계획서 (A)' : '완성 계획서 (B)',
        content: type === 'draft' ? draftPlanContent : JSON.stringify(submissionPlanSections),
        template: type === 'submission' ? 
          templates.find(t => t.template_id === selectedTemplate)?.title : null,
        status: type === 'draft' ? '초안' : '완료'
      };
      
      // Get plan ID from URL if it exists (for updating existing plans)
      const urlParams = new URLSearchParams(window.location.search);
      const planId = urlParams.get('plan_id');
      
      let result;
      
      if (planId) {
        // Update existing plan
        const { data, error } = await supabase
          .from('business_plans')
          .update(planData)
          .eq('id', planId)
          .eq('user_id', user.id)
          .select();
        
        if (error) {
          console.error('Error updating business plan in Supabase:', error);
          toast.error('사업계획서 업데이트 중 오류가 발생했습니다.');
          return;
        }
        
        result = data;
        
        // Update the local state with the updated plan
        if (data && data.length > 0) {
          setSavedPlans(prevPlans => 
            prevPlans.map(p => p.id === planId ? data[0] : p)
          );
          
          // Show success message with toast
          toast.success('사업계획서가 성공적으로 업데이트되었습니다.', {
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          });
        }
      } else {
        // Create new plan
        const { data, error } = await supabase
          .from('business_plans')
          .insert(planData)
          .select();
        
        if (error) {
          console.error('Error saving business plan to Supabase:', error);
          toast.error('사업계획서 저장 중 오류가 발생했습니다.');
          return;
        }
        
        result = data;
        
        // Update the local state with the new plan
        if (data && data.length > 0) {
          setSavedPlans(prevPlans => [...prevPlans, data[0]]);
          
          // Add the plan ID to the URL for future updates
          const url = new URL(window.location.href);
          url.searchParams.set('plan_id', data[0].id);
          window.history.pushState({}, '', url);
          
          // Show success message with toast
          toast.success('사업계획서가 성공적으로 저장되었습니다. 계정 관리 페이지에서 확인할 수 있습니다.', {
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          });
        }
      }
      
      // Close modals
      if (type === 'draft') {
        setShowDraftPlanModal(false);
      } else {
        setShowSubmissionPlanModal(false);
      }
    } catch (error) {
      console.error('Error saving business plan:', error);
      toast.error('사업계획서 저장 중 오류가 발생했습니다.');
    }
  };

  // Function to open a saved business plan
  const openSavedPlan = async (plan: any) => {
    try {
      console.log("Opening saved plan:", plan);
      
      if (!plan || !plan.type) {
        console.error("Invalid plan data:", plan);
        toast.error('유효하지 않은 사업계획서 데이터입니다.');
        return;
      }
      
      if (plan.type === '기본 계획서 (A)') {
        // For draft plans (Plan A)
        console.log("Opening draft plan");
        setDraftPlanTitle(plan.title || '');
        setDraftPlanContent(plan.content || '');
        setIsPreviewMode(true);
        setShowDraftPlanModal(true);
        
        // Show success message
        toast.success('기본 계획서를 불러왔습니다.', { duration: 2000 });
      } else {
        // For submission plans (Plan B)
        console.log("Opening submission plan");
        try {
          // Try to parse the content as JSON
          const parsedContent = plan.content ? JSON.parse(plan.content) : [];
          console.log("Parsed content:", parsedContent);
          
          if (!Array.isArray(parsedContent)) {
            console.error("Parsed content is not an array:", parsedContent);
            toast.error('사업계획서 형식이 올바르지 않습니다.');
            return;
          }
          
          setSubmissionPlanSections(parsedContent);
          
          // Find template ID from title
          const template = templates.find(t => t.title === plan.template);
          if (template) {
            setSelectedTemplate(template.template_id);
          } else {
            // Default to startup template if no matching template found
            setSelectedTemplate('basic-startup');
          }
          
          setShowSubmissionPlanModal(true);
          
          // Show success message
          toast.success('제출용 계획서를 불러왔습니다.', { duration: 2000 });
        } catch (parseError) {
          console.error("Error parsing plan content:", parseError, "Content:", plan.content);
          toast.error('사업계획서 형식이 올바르지 않습니다. 새로운 계획서를 작성해 주세요.');
        }
      }
    } catch (error) {
      console.error("Error opening saved plan:", error);
      toast.error('사업계획서를 열 수 없습니다. 새로운 계획서를 작성해 주세요.');
    }
  };

  // Create a helper function for the file download without DOM manipulation
  const triggerDownload = (blob: Blob, filename: string) => {
    try {
      // Create object URL from the blob
      const url = window.URL.createObjectURL(blob);
      
      // Use safer method for download
      const downloadLink = document.createElement('a');
      downloadLink.style.display = 'none'; // Make it invisible
      document.body.appendChild(downloadLink); // Append to body
      
      // Configure the link
      downloadLink.href = url;
      downloadLink.download = filename;
      
      // Safer way to trigger click
      downloadLink.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
      }, 150);
    } catch (error) {
      console.error('Error creating download:', error);
      toast.error('다운로드 생성 중 오류가 발생했습니다.');
    }
  };

  // Download plan function, updated for PDF/DOCX subscription check
  const downloadPlan = async (type: 'draft' | 'submission', format: 'txt' | 'pdf' | 'docx' = 'txt') => {
    // Check if user can use document conversion for PDF/DOCX
    if ((format === 'pdf' || format === 'docx') && !canUseFeature('documentConversion')) {
      toast.error('PDF/DOCX 변환은 스탠다드 이상 플랜에서 제공되는 기능입니다. 플랜을 업그레이드하세요.');
      setShowPlanUpgradeModal(true);
      return;
    }

    try {
      console.log(`Downloading business plan as ${type} in ${format} format`);
      let content = '';
      let filename = '';
      
      // Set format-specific state tracking
      if (format !== 'txt') {
        setIsDownloading(true);
        setDownloadFormat(format);
      }

      // Helper function to format CSV table data in a more readable plain text format
      const formatTableForText = (textContent: string): string => {
        const lines = textContent.split('\n');
        let result = '';
        let currentIdx = 0;
        
        // Helper to detect tables
        const detectTable = (startIdx: number): { isTable: boolean; tableLines: string[]; endIdx: number } => {
          const tableLines: string[] = [];
          let idx = startIdx;
          
          if (idx >= lines.length) {
            return { isTable: false, tableLines: [], endIdx: startIdx };
          }
          
          const firstLine = lines[idx].trim();
          const commaCount = (firstLine.match(/,/g) || []).length;
          
          if (commaCount < 2) {
            return { isTable: false, tableLines: [], endIdx: startIdx };
          }
          
          while (idx < lines.length) {
            const currentLine = lines[idx].trim();
            
            if (currentLine === '') {
              break;
            }
            
            if (currentLine.startsWith('#') || 
                (currentLine.endsWith(':') && currentLine.length < 50 && !currentLine.includes(','))) {
              break;
            }
            
            tableLines.push(currentLine);
            idx++;
          }
          
          const isTable = tableLines.length >= 2;
          
          return { isTable, tableLines, endIdx: idx - 1 };
        };
        
        // Helper function to format a table in plain text
        const formatTable = (tableLines: string[]): string => {
          // Parse the table data
          const rows = tableLines.map(line => line.split(',').map(cell => cell.trim()));
          
          // Determine the width needed for each column
          const columnWidths: number[] = [];
          rows.forEach(row => {
            row.forEach((cell, cellIdx) => {
              columnWidths[cellIdx] = Math.max(
                columnWidths[cellIdx] || 0,
                cell.length
              );
            });
          });
          
          // Format each row with proper spacing and dividers
          const formattedRows = rows.map((row, rowIdx) => {
            const formattedRow = row.map((cell, cellIdx) => {
              // Pad the cell content to match column width
              return cell.padEnd(columnWidths[cellIdx], ' ');
            }).join(' | ');
            
            // If this is the header row, add a separator line after it
            if (rowIdx === 0) {
              const separator = columnWidths.map(width => '-'.repeat(width)).join('-+-');
              return `| ${formattedRow} |\n+-${separator}-+`;
            }
            
            return `| ${formattedRow} |`;
          });
          
          // Add top border for the table
          const topBorder = `+-${columnWidths.map(width => '-'.repeat(width)).join('-+-')}-+`;
          
          // Add bottom border for the table
          const bottomBorder = `+-${columnWidths.map(width => '-'.repeat(width)).join('-+-')}-+`;
          
          // Combine all parts
          return `${topBorder}\n${formattedRows.join('\n')}\n${bottomBorder}\n\n`;
        };
        
        // Process the content line by line, looking for tables
        while (currentIdx < lines.length) {
          const { isTable, tableLines, endIdx } = detectTable(currentIdx);
          
          if (isTable) {
            result += formatTable(tableLines);
            currentIdx = endIdx + 1;
          } else {
            result += lines[currentIdx] + '\n';
            currentIdx++;
          }
        }
        
        return result;
      };
      
      // For TXT format
      if (format === 'txt') {
        if (type === 'draft') {
          content = formatTableForText(draftPlanContent);
          filename = `${draftPlanTitle || '사업계획서'}_초안_${new Date().toISOString().split('T')[0]}.txt`;
        } else {
          // For submission plans, format sections nicely in the text file
          content = submissionPlanSections.map(section => {
            const formattedContent = formatTableForText(section.content);
            return `## ${section.title}\n\n${formattedContent}\n\n`;
          }).join('---\n\n');
          
          filename = `${draftPlanTitle || '사업계획서'}_제출용_${templates.find(t => t.template_id === selectedTemplate)?.title || ''}_${new Date().toISOString().split('T')[0]}.txt`;
        }
        
        // Create a blob from the content
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        
        // Use the extracted function
        triggerDownload(blob, filename);
        
        // Show success message
        toast.success('텍스트 파일이 다운로드되었습니다.', { 
          id: 'download-toast',
          duration: 3000 
        });
      }
      // For PDF/DOCX formats, direct handling is now in separate functions
      else {
        // Close dropdowns
        document.getElementById('draft-download-format-dropdown')?.classList.add('hidden');
        document.getElementById('submission-download-format-dropdown')?.classList.add('hidden');
      }
      
      // Reset downloading state
      setIsDownloading(false);
      setDownloadFormat(null);
      
    } catch (error) {
      console.error('Error downloading business plan:', error);
      // Reset downloading state
      setIsDownloading(false);
      setDownloadFormat(null);
      
      // Show error message
      toast.error('다운로드 중 오류가 발생했습니다.', {
        id: 'download-toast',
        duration: 3000
      });
    }
  };

  // Load saved plans from Supabase on component mount
  useEffect(() => {
    const loadSavedPlans = async () => {
      try {
        console.log("Loading saved plans from Supabase");
        
        // Check if user is authenticated
        if (!user || !user.id) {
          console.log("User not authenticated, can't load plans");
          return;
        }
        
        // Fetch plans from Supabase
        const { data, error } = await supabase
          .from('business_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching saved plans:", error);
          toast.error('사업계획서를 불러오는 데 실패했습니다.');
          return;
        }
        
        console.log("Fetched plans from Supabase:", data);
        
        // Update state with fetched plans
        if (data) {
          setSavedPlans(data);
        }
        
        // Check if there's a plan to open (from URL parameter or session storage)
        const urlParams = new URLSearchParams(window.location.search);
        const planId = urlParams.get('plan_id');
        
        if (planId) {
          console.log("Plan ID from URL:", planId);
          
          // Find the plan in the loaded plans
          const planToOpen = data?.find(p => p.id === planId);
          
          if (planToOpen) {
            console.log("Found plan to open:", planToOpen);
            setTimeout(() => {
              openSavedPlan(planToOpen);
            }, 500);
          } else {
            // If not found in loaded plans, try to fetch it directly
            const { data: planData, error: planError } = await supabase
              .from('business_plans')
              .select('*')
              .eq('id', planId)
              .eq('user_id', user.id)
              .single();
            
            if (planError) {
              console.error("Error fetching specific plan:", planError);
              toast.error('요청한 사업계획서를 찾을 수 없습니다.');
              return;
            }
            
            if (planData) {
              console.log("Fetched specific plan:", planData);
              setTimeout(() => {
                openSavedPlan(planData);
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('Error in loadSavedPlans:', error);
      }
    };
    
    loadSavedPlans();
  }, [user]);

  const renderContent = (content: string, isEditing: boolean, sectionIndex: number) => {
    // Split the content by lines
    const lines = content.split('\n');
    
    // Helper function to detect if a block of lines represents a table
    const detectTable = (startIdx: number): { isTable: boolean; tableLines: string[]; endIdx: number } => {
      const tableLines: string[] = [];
      let idx = startIdx;
      
      // No more lines to check
      if (idx >= lines.length) {
        return { isTable: false, tableLines: [], endIdx: startIdx };
      }
      
      // Skip lines that contain section markers or instructions
      if (lines[idx].includes('## 테이블 시작 ##') || 
          lines[idx].includes('## 여기에 반드시 CSV') || 
          lines[idx].includes('## 테이블 끝 ##')) {
        return { isTable: false, tableLines: [], endIdx: startIdx };
      }

      // Check if this line might be a table header (contains multiple commas)
      const firstLine = lines[idx].trim();
      const commaCount = (firstLine.match(/,/g) || []).length;
      
      // If fewer than 2 commas, it's probably not a table
      if (commaCount < 2) {
        return { isTable: false, tableLines: [], endIdx: startIdx };
      }
      
      // Skip lines that don't look like valid CSV data
      if (firstLine.includes('##') || firstLine.startsWith('○') || firstLine.startsWith('■')) {
        return { isTable: false, tableLines: [], endIdx: startIdx };
      }

      try {
      // Collect potential table lines
      let stillTable = true;
      while (idx < lines.length && stillTable) {
        const currentLine = lines[idx].trim();
          
          // Skip section markers if they appear within the table
          if (currentLine.includes('## 테이블 끝 ##') || currentLine.includes('##') || 
              currentLine.startsWith('○') || currentLine.startsWith('■')) {
            break;
          }
        
        // Empty line marks the end of the table
        if (currentLine === '') {
          break;
        }
        
        // If the line looks like a heading/subheading, it's not part of the table
        if (currentLine.startsWith('#') || 
            (currentLine.endsWith(':') && currentLine.length < 50 && !currentLine.includes(','))) {
          break;
        }
          
          // Check if the line has approximately the same number of commas as the header row
          // This helps ensure data consistency across rows
          const lineCommaCount = (currentLine.match(/,/g) || []).length;
          if (lineCommaCount < commaCount - 1 || lineCommaCount > commaCount + 1) {
            // If this is within the first few rows, it's probably not a valid table
            if (tableLines.length < 2) {
              return { isTable: false, tableLines: [], endIdx: startIdx };
            }
            // Otherwise, we've probably reached the end of the table
            break;
          }
        
        tableLines.push(currentLine);
        idx++;
      }
      
        // Require at least 2 rows to be a table (header + data) and validate structure
      const isTable = tableLines.length >= 2;
        
        // Additional validation: ensure all rows have roughly the same number of commas
        if (isTable) {
          const headerCommas = (tableLines[0].match(/,/g) || []).length;
          const validStructure = tableLines.every(line => {
            const lineCommas = (line.match(/,/g) || []).length;
            return lineCommas >= headerCommas - 1 && lineCommas <= headerCommas + 1;
          });
          
          if (!validStructure) {
            console.warn('Detected malformed table structure', tableLines);
            return { isTable: false, tableLines: [], endIdx: startIdx };
          }
        }
      
      return { isTable, tableLines, endIdx: idx - 1 };
      } catch (error) {
        console.error('Error detecting table:', error);
        return { isTable: false, tableLines: [], endIdx: startIdx };
      }
    };
    
    // Process the content line by line
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this might be the start of a table
      const { isTable, tableLines, endIdx } = detectTable(i);
      
      if (isTable) {
        // Log to diagnose table detection
        console.log('Table detected at line', i, 'with', tableLines.length, 'rows');
        console.log('Table headers:', tableLines[0]);
        console.log('Table first data row:', tableLines[1]);
        
        // Use our TableRenderer component
        result.push(
          <TableRenderer 
            key={`table-${i}`} 
            tableData={tableLines} 
            className="my-4"
          />
        );
        
        // Skip the lines that are part of the table
        i = endIdx;
        continue;
      }
      
      // Handle non-table content
      
      // Check if line is a heading (starts with #### or similar)
      if (line.startsWith('####')) {
        result.push(<h4 key={`heading-${i}`} className="font-bold text-gray-700 mt-4 mb-2">{line.replace(/^####\s*/, '')}</h4>);
        continue;
      }
      
      // Check if line looks like a subheading (could be based on context or formatting)
      if (line.trim().endsWith(':') && line.length < 50) {
        result.push(<h5 key={`subheading-${i}`} className="font-semibold text-gray-600 mt-3 mb-1">{line}</h5>);
        continue;
      }
      
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
        {isEditing ? (
          <textarea
            className="w-full h-40 p-2 border border-gray-300 rounded"
            value={content}
            onChange={(e) => {
              const updatedSections = [...submissionPlanSections];
              updatedSections[sectionIndex].content = e.target.value;
              setSubmissionPlanSections(updatedSections);
            }}
          />
        ) : (
          <div className="prose max-w-none w-full">
            {result}
          </div>
        )}
      </div>
    );
  };

  // Add a function to set the template title based on the ID
  const setTemplateInfo = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Use template from Supabase data
    const template = templates.find(t => t.template_id === templateId);
    
    if (template) {
      // Use template title directly from Supabase data, no free label
      setSelectedTemplateTitle(template.title);
    } else {
      console.error("Template not found for ID:", templateId);
      // Fall back to default if template not found
      setSelectedTemplateTitle('스타트업 템플릿');
    }
  };

  // Set up a click handler to close dropdowns when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdowns = document.querySelectorAll('.format-dropdown');
      
      // Don't close dropdown if click is on a download button
      const isDownloadButton = (event.target as Element).closest('button')?.classList.contains('download-button');
      if (isDownloadButton) return;
      
      dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target as Node)) {
          dropdown.classList.add('hidden');
        }
      });
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Add event listener for escape key to close dropdowns
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        document.querySelectorAll('.format-dropdown').forEach(dropdown => {
          dropdown.classList.add('hidden');
        });
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Add a debug effect to log subscription status
  useEffect(() => {
    console.log('Subscription status check:');
    console.log('Current plan:', currentPlan);
    console.log('Can use templates:', canUseFeature('allTemplates'));
    console.log('Can use advanced features:', canUseFeature('documentConversion'));
    console.log('Remaining AI usages:', remainingUsage.aiBusinessPlans);
    // Only run this when currentPlan changes, not on every render
  }, [currentPlan]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">사업계획서 작성</h1>
        <p className="text-gray-600">AI로 쉽고 빠르게 전문적인 사업계획서를 작성해보세요.</p>
      </div>

      {/* Template pricing note */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setShowPlanUpgradeModal(true)}>
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-700">
              <strong>템플릿 가격 안내:</strong> 모든 템플릿은 각 ₩3,000원에 이용하실 수 있으며, <span className="text-blue-600 hover:underline">유료 요금제</span> 구독 시 모든 템플릿을 무제한으로 이용할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Two main sections: Draft Plans and Submission Plans */}
      <div className="space-y-8 mb-8">
        {/* Draft Plans (Plan A) Section */}
        <div>
          <h3 className="text-xl font-bold mb-4">사업계획서 초안</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <button 
              className="flex flex-col items-center justify-center p-6 md:p-8 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              onClick={() => {
                setShowDraftPlanModal(true);
              }}
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-600">새 사업계획서 초안 작성</span>
            </button>

            {[
              {
                title: '2024년 스타트업 성장지원 사업',
                status: '초안',
                type: '사업계획서 초안',
                lastEdit: '2024.03.15',
                progress: 80
              }
            ].map((plan, i) => (
              <div key={i} className="bg-white p-4 md:p-6 rounded-xl shadow-sm hover-card">
                <div className="flex justify-between items-start space-x-4 mb-4">
                  <div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                      {plan.type}
                    </span>
                    <h3 className="text-lg font-semibold mt-2">{plan.title}</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        savePlan('draft');
                      }}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      <span className="text-sm">저장</span>
                    </button>
                    <button 
                      className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded download-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const dropdown = document.getElementById('draft-plan-dropdown');
                        if (dropdown) {
                          // Close other dropdowns first
                          document.querySelectorAll('.format-dropdown').forEach(el => {
                            if (el.id !== 'draft-plan-dropdown') {
                              el.classList.add('hidden');
                            }
                          });
                          
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
                          
                          // Show guide
                          showDownloadFormatGuide();
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      <span className="text-sm">다운로드</span>
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  마지막 수정: {plan.lastEdit}
                </p>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
                  <span className="text-sm text-gray-500">작성 완료: {plan.progress}%</span>
                  <button 
                    className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => {
                      setDraftPlanTitle(plan.title);
                      setShowDraftPlanModal(true);
                    }}
                  >
                    계속 작성하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Submission Plans (Plan B) Section */}
        <div>
          <h3 className="text-xl font-bold mb-4">제출용 사업계획서</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <button 
              className="flex flex-col items-center justify-center p-6 md:p-8 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              onClick={() => {
                setTemplateSource('submission');
                setShowTemplateModal(true);
              }}
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-600">새 제출용 사업계획서 작성</span>
            </button>

            {[
              {
                title: '청년창업 특별지원 프로그램',
                status: '완료',
                type: '제출용 사업계획서',
                template: '스타트업 템플릿',
                templateColor: 'green',
                lastEdit: '2024.04.10',
                progress: 100
              }
            ].map((plan, i) => (
              <div key={i} className="bg-white p-4 md:p-6 rounded-xl shadow-sm hover-card">
                <div className="flex justify-between items-start space-x-4 mb-4">
                  <div>
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                      {plan.template}
                    </span>
                    <h3 className="text-lg font-semibold mt-2">{plan.title}</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        savePlan('submission');
                      }}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      <span className="text-sm">저장</span>
                    </button>
                    <button 
                      className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded download-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const dropdown = document.getElementById('submission-plan-dropdown');
                        if (dropdown) {
                          // Close other dropdowns first
                          document.querySelectorAll('.format-dropdown').forEach(el => {
                            if (el.id !== 'submission-plan-dropdown') {
                              el.classList.add('hidden');
                            }
                          });
                          
                          dropdown.classList.toggle('hidden');
                          
                          // Position dropdown above the button instead of below
                          const rect = e.currentTarget.getBoundingClientRect();
                          
                          // First make it visible but off-screen to calculate its height
                          dropdown.style.position = 'fixed';
                          dropdown.style.visibility = 'hidden';
                          dropdown.style.display = 'block';
                          
                          // Get the height and then position it
                          const dropdownHeight = dropdown.offsetHeight;
                          dropdown.style.visibility = 'visible';
                          dropdown.style.top = `${rect.top - dropdownHeight - 5}px`;
                          dropdown.style.left = `${rect.left}px`;
                          
                          // Show download format guide
                          showDownloadFormatGuide();
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      <span className="text-sm">다운로드</span>
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  마지막 수정: {plan.lastEdit}
                </p>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
                  <span className="text-sm text-gray-500">작성 완료: {plan.progress}%</span>
                  <button 
                    className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    onClick={() => {
                      setSelectedTemplate('startup');
                      generateSubmissionPlan();
                    }}
                  >
                    열기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Templates Section - Moved lower down on the page */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">템플릿 선택</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getFilteredTemplates(templateSource).map((template) => (
            <div 
              key={template.template_id}
              className={`p-5 border rounded-lg cursor-pointer hover:shadow-md transition duration-200 ${
                template.template_id === selectedTemplate ? 
                'border-2 border-blue-500 bg-blue-50' : 
                'hover:border-blue-300'
              }`}
              onClick={() => {
                // Get fresh value from context each time
                const hasTemplateAccess = canUseFeature('allTemplates');
                if (!hasTemplateAccess) {
                  toast.error('템플릿 이용을 위해 개별 구매 또는 구독이 필요합니다.');
                  setShowPlanUpgradeModal(true);
                } else {
                  setTemplateInfo(template.template_id);
                  setShowTemplateModal(true);
                  setTemplateSource(templateSource); // Keep current source
                }
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTemplateColorClass(template.color)}`}>
                  <div className="flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-xs rounded-full text-amber-700">₩3,000</span>
              </div>
              <h3 className="font-medium mb-3">{template.title}</h3>
              
              <button 
                type="button"
                className={`mt-2 px-4 py-2 w-full rounded-lg text-center ${
                  // Get fresh value from context each time
                  canUseFeature('allTemplates') ? 
                  'bg-blue-600 hover:bg-blue-700 text-white' : 
                  'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  // Get fresh value from context each time
                  const hasTemplateAccess = canUseFeature('allTemplates');
                  if (!hasTemplateAccess) {
                    toast.error('템플릿 이용을 위해 개별 구매 또는 구독이 필요합니다.');
                    setShowPlanUpgradeModal(true);
                  } else {
                    setSelectedTemplate(template.template_id);
                    setShowTemplateModal(true);
                    setTemplateSource(templateSource); // Keep current source
                  }
                }}
              >
                <span>{canUseFeature('allTemplates') ? '템플릿 사용' : '₩3,000 구매'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Draft Plan Modal (Plan A) */}
      {showDraftPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 md:p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">사업계획서 초안</h3>
              <button onClick={() => setShowDraftPlanModal(false)}>
                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            {draftPlanContent ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-semibold">
                    {isPreviewMode ? "미리보기 모드" : "편집 모드"}
                  </h4>
                  <div className="flex space-x-3">
                    <button 
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                    >
                      {isPreviewMode ? "편집하기" : "미리보기"}
                    </button>
                    <button 
                      className="px-4 py-2 text-sm border border-blue-300 rounded-md hover:bg-blue-50 text-blue-600"
                      onClick={() => setDraftPlanContent('')}
                      title="기존 정보 수정을 위해 초기 상태로 돌아갑니다"
                    >
                      <div className="flex items-center">
                        <Edit className="w-4 h-4 mr-1" />
                        <span>정보 수정</span>
                      </div>
                    </button>
                    <button 
                      className="px-4 py-2 text-sm border border-green-300 rounded-md hover:bg-green-50 text-green-600"
                      onClick={() => savePlan('draft')}
                      title="현재 사업계획서 초안을 저장합니다"
                    >
                      <div className="flex items-center">
                        <Save className="w-4 h-4 mr-1" />
                        <span>저장하기</span>
                      </div>
                    </button>
                  </div>
                </div>
                
                {isPreviewMode ? (
                  <div className="border rounded-lg p-6 mb-4 prose prose-blue max-w-none">
                    {(() => {
                      const elements: JSX.Element[] = [];
                      let listItems: JSX.Element[] = [];
                      let inList = false;
                      
                      // Helper function to detect if a block of lines represents a table (same as in renderContent)
                      const detectTable = (lines: string[], startIdx: number): { isTable: boolean; tableLines: string[]; endIdx: number } => {
                        const tableLines: string[] = [];
                        let idx = startIdx;
                        
                        // No more lines to check
                        if (idx >= lines.length) {
                          return { isTable: false, tableLines: [], endIdx: startIdx };
                        }
                        
                        // Skip lines that contain section markers or instructions
                        if (lines[idx].includes('## 테이블 시작 ##') || 
                            lines[idx].includes('## 여기에 반드시 CSV') || 
                            lines[idx].includes('## 테이블 끝 ##')) {
                          return { isTable: false, tableLines: [], endIdx: startIdx };
                        }
                        
                        try {
                          // Method 1: Check for CSV style table (contains multiple commas)
                          const firstLine = lines[idx].trim();
                          
                          // Skip lines that don't look like valid CSV data
                          if (firstLine.includes('##') || firstLine.startsWith('○') || firstLine.startsWith('■')) {
                            return { isTable: false, tableLines: [], endIdx: startIdx };
                          }
                          
                          const commaCount = (firstLine.match(/,/g) || []).length;
                          
                          // If this line has at least 2 commas, it might be a CSV table
                          if (commaCount >= 2) {
                            // Collect potential CSV table lines
                            let stillTable = true;
                            while (idx < lines.length && stillTable) {
                              const currentLine = lines[idx].trim();
                              
                              // Skip section markers if they appear within the table
                              if (currentLine.includes('## 테이블 끝 ##') || currentLine.includes('##') || 
                                  currentLine.startsWith('○') || currentLine.startsWith('■')) {
                                break;
                              }
                              
                              // Empty line marks the end of the table
                              if (currentLine === '') {
                                break;
                              }
                              
                              // If the line looks like a heading/subheading, it's not part of the table
                              if (currentLine.startsWith('#') || 
                                  (currentLine.endsWith(':') && currentLine.length < 50 && !currentLine.includes(','))) {
                                break;
                              }
                              
                              // Check if the line has approximately the same number of commas as the header row
                              const lineCommaCount = (currentLine.match(/,/g) || []).length;
                              if (lineCommaCount < commaCount - 1 || lineCommaCount > commaCount + 1) {
                                // If this is within the first few rows, it's probably not a valid table
                                if (tableLines.length < 2) {
                                  return { isTable: false, tableLines: [], endIdx: startIdx };
                                }
                                // Otherwise, we've probably reached the end of the table
                                break;
                              }
                              
                              tableLines.push(currentLine);
                              idx++;
                            }
                            
                            // Require at least 2 rows to be a table (header + data) and validate structure
                            const isTable = tableLines.length >= 2;
                            
                            // Additional validation: ensure all rows have roughly the same number of commas
                            if (isTable) {
                              const headerCommas = (tableLines[0].match(/,/g) || []).length;
                              const validStructure = tableLines.every(line => {
                                const lineCommas = (line.match(/,/g) || []).length;
                                return lineCommas >= headerCommas - 1 && lineCommas <= headerCommas + 1;
                              });
                              
                              if (!validStructure) {
                                console.warn('Detected malformed table structure', tableLines);
                                return { isTable: false, tableLines: [], endIdx: startIdx };
                              }
                            }
                            
                            return { isTable, tableLines, endIdx: idx - 1 };
                          }
                          
                          // Method 2: Check for markdown style table (starts with |)
                          if (firstLine.match(/^\|.*\|$/)) {
                            // Collect potential markdown table lines
                            const mdTableLines = [];
                            while (idx < lines.length) {
                              const currentLine = lines[idx].trim();
                              
                              // If not a table row anymore, stop
                              if (!currentLine.match(/^\|.*\|$/)) {
                                break;
                              }
                              
                              // Skip section markers if they appear within the table
                              if (currentLine.includes('## 테이블 끝 ##') || currentLine.includes('##') || 
                                  currentLine.startsWith('○') || currentLine.startsWith('■')) {
                                break;
                              }
                              
                              mdTableLines.push(currentLine);
                              idx++;
                            }
                            
                            // Skip the separator row in markdown tables (like |---|---|)
                            const hasSeparator = mdTableLines.length > 1 && 
                                              mdTableLines[1].split('|').every(cell => /^[-:]+$/.test(cell.trim()));
                            
                            if (hasSeparator) {
                              mdTableLines.splice(1, 1);
                            }
                            
                            // Convert markdown table to CSV format
                            for (let i = 0; i < mdTableLines.length; i++) {
                              const csvLine = mdTableLines[i]
                                .replace(/^\||\|$/g, '')  // Remove first and last |
                                .split('|')               // Split by |
                                .map(cell => cell.trim()) // Trim cells
                                .join(',');               // Join with commas
                              
                              tableLines.push(csvLine);
                            }
                            
                            // Require at least 2 rows to be a table (header + data)
                            const isTable = tableLines.length >= 2;
                            
                            // Additional validation: ensure all rows have roughly the same number of cells
                            if (isTable) {
                              const headerCells = tableLines[0].split(',').length;
                              const validStructure = tableLines.every(line => {
                                const cellCount = line.split(',').length;
                                return cellCount >= headerCells - 1 && cellCount <= headerCells + 1;
                              });
                              
                              if (!validStructure) {
                                console.warn('Detected malformed markdown table structure', tableLines);
                                return { isTable: false, tableLines: [], endIdx: startIdx };
                              }
                            }
                            
                            return { isTable, tableLines, endIdx: idx - 1 };
                          }
                        } catch (error) {
                          console.error('Error detecting table in preview mode:', error);
                          return { isTable: false, tableLines: [], endIdx: startIdx };
                        }
                        
                        return { isTable: false, tableLines: [], endIdx: startIdx };
                      };
                      
                      const lines = draftPlanContent.split('\n');
                      
                      for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        
                        // Check if this might be the start of a table
                        const { isTable, tableLines, endIdx } = detectTable(lines, i);
                        
                        if (isTable) {
                          // Log to diagnose table detection
                          console.log('Table detected at line', i, 'with', tableLines.length, 'rows');
                          console.log('Table headers:', tableLines[0]);
                          console.log('Table first data row:', tableLines[1]);
                          
                          // Use our TableRenderer component
                          elements.push(
                            <TableRenderer 
                              key={`table-${i}`} 
                              tableData={tableLines} 
                              className="my-4"
                            />
                          );
                          
                          // Skip the lines that are part of the table
                          i = endIdx;
                          continue;
                        }
                        
                        // Format headings with proper styling
                        if (line.startsWith('# ')) {
                          if (inList) {
                            elements.push(<ul key={`list-${i}`} className="list-disc pl-5 mb-4">{listItems}</ul>);
                            listItems = [];
                            inList = false;
                          }
                          elements.push(<h1 key={i} className="text-2xl font-bold text-gray-800 mt-6 mb-4">{line.replace(/^# /, '')}</h1>);
                        } else if (line.startsWith('## ')) {
                          if (inList) {
                            elements.push(<ul key={`list-${i}`} className="list-disc pl-5 mb-4">{listItems}</ul>);
                            listItems = [];
                            inList = false;
                          }
                          elements.push(<h2 key={i} className="text-xl font-bold text-gray-800 mt-5 mb-3">{line.replace(/^## /, '')}</h2>);
                        } else if (line.startsWith('### ')) {
                          if (inList) {
                            elements.push(<ul key={`list-${i}`} className="list-disc pl-5 mb-4">{listItems}</ul>);
                            listItems = [];
                            inList = false;
                          }
                          elements.push(<h3 key={i} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.replace(/^### /, '')}</h3>);
                        }
                        // Format lists
                        else if (line.match(/^[\s]*[-*] /)) {
                          inList = true;
                          listItems.push(
                            <li key={`li-${i}`} className="text-gray-700 mb-1">
                              {line.replace(/^[\s]*[-*] /, '')}
                            </li>
                          );
                        }
                        // End of list
                        else if (inList && line.trim() === '') {
                          elements.push(<ul key={`list-${i}`} className="list-disc pl-5 mb-4">{listItems}</ul>);
                          listItems = [];
                          inList = false;
                          elements.push(<div key={`space-${i}`} className="h-2"></div>);
                        }
                        // Regular paragraph
                        else {
                          if (inList) {
                            elements.push(<ul key={`list-${i}`} className="list-disc pl-5 mb-4">{listItems}</ul>);
                            listItems = [];
                            inList = false;
                          }
                          
                          // Format bold and italic text
                          let formattedLine = line;
                          // Bold: Replace **text** with <strong>text</strong>
                          formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                          // Italic: Replace *text* with <em>text</em>
                          formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
                          
                          // Empty lines become spacing
                          if (line.trim() === '') {
                            elements.push(<div key={i} className="h-2"></div>);
                          } else {
                            // Regular paragraph
                            elements.push(
                              <p key={i} className="text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: formattedLine }}></p>
                            );
                          }
                        }
                      }
                      
                      // If we end with an unclosed list
                      if (inList) {
                        elements.push(<ul key="list-end" className="list-disc pl-5 mb-4">{listItems}</ul>);
                      }
                      
                      return elements;
                    })()}
                  </div>
                ) : (
                  <textarea
                    className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-96 font-mono text-sm"
                    value={draftPlanContent}
                    onChange={(e) => setDraftPlanContent(e.target.value)}
                  ></textarea>
                )}
              </div>
            ) : (
              <div className="mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업계획서 제목
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 2024년 스타트업 성장지원 사업"
                    value={draftPlanTitle}
                    onChange={(e) => setDraftPlanTitle(e.target.value)}
                  />
                </div>

                {/* Company Basic Info Section */}
                <div className="mb-6">
                  <h4 className="text-base font-semibold mb-3">회사 기본 정보</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        회사명
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="예: 정부펀드 AI"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설립연도
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="예: 2022"
                        value={companyFoundYear}
                        onChange={(e) => setCompanyFoundYear(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        회사 규모
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="예: 5-10명"
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        산업 분야
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="예: AI/소프트웨어"
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Business Item Details Section */}
                <div className="mb-6">
                  <h4 className="text-base font-semibold mb-3">사업 아이템 상세</h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      아이템 이름
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: AI 정부지원사업 검색 서비스"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      아이템 설명
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                      placeholder="창업 아이템에 대한 간략한 설명을 입력하세요"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      차별화 포인트
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                      placeholder="기존 서비스/제품과 비교하여 귀사의 차별화된 강점을 입력하세요"
                      value={itemUniquePoint}
                      onChange={(e) => setItemUniquePoint(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      목표 시장
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                      placeholder="타겟 고객층과 시장 규모에 대해 설명해주세요"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* AI Prompt Section */}
                <div className="mb-6">
                  <h4 className="text-base font-semibold mb-3">AI 프롬프트 설정</h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      추가 지시사항 (선택사항)
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                      placeholder="AI에게 사업계획서 작성 시 특별히 강조하거나 포함해야 할 내용을 알려주세요"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    AI가 사업계획서 초안을 생성합니다. 다음 정보를 포함합니다:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                    <li>문제인식</li>
                    <li>시장분석</li>
                    <li>실현 가능성</li>
                    <li>성장전략</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700">
                        <strong>혜택:</strong> 구독 요금제에 가입하시면 무제한으로 사업계획서를 생성하실 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Display OpenAI Error if any */}
            {openAIError && (
              <div className="p-4 bg-red-50 rounded-lg mb-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700">
                      <strong>오류:</strong> {openAIError}
                    </p>
                    {!openAIConfigured && (
                      <>
                        <p className="text-sm text-red-700 mt-1">
                          OpenAI API 키가 설정되지 않았습니다. 프로젝트 루트의 .env 파일에 다음을 추가해주세요:
                        </p>
                        <div className="mt-2 p-2 bg-gray-800 text-gray-200 rounded text-sm font-mono">
                          VITE_OPENAI_API_KEY=your_openai_api_key_here
                        </div>
                        <p className="text-sm text-red-700 mt-2">
                          API 키는 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI 웹사이트</a>에서 발급받을 수 있습니다.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              {!draftPlanContent ? (
                <button 
                  className={`px-6 py-2 ${
                    isGeneratingDraftPlan || !draftPlanTitle 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-lg flex items-center`}
                  onClick={generateDraftPlan}
                  disabled={isGeneratingDraftPlan || !draftPlanTitle}
                >
                  {isGeneratingDraftPlan ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>생성 중...</span>
                    </div>
                  ) : (
                    <span>AI 생성하기</span>
                  )}
                </button>
              ) : (
                <>
                  <button 
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                    onClick={() => {
                      setIsPreviewMode(false);
                      setDraftPlanContent('');
                    }}
                  >
                    <span>새로 작성</span>
                  </button>
                  <button 
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center"
                    onClick={generateDraftPlan}
                  >
                    <div className="flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <span>재생성</span>
                    </div>
                  </button>
                  <button 
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                    onClick={() => {
                      setTemplateSource('submission');
                      setShowTemplateModal(true);
                    }}
                  >
                    <span>제출용 사업계획서로 확장하기</span>
                  </button>
                  <button 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                    onClick={() => savePlan('draft')}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    저장하기
                  </button>
                  <div className="relative inline-block">
                    <button 
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center download-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const dropdown = document.getElementById('modal-download-dropdown');
                        if (dropdown) {
                          // Close other dropdowns first
                          document.querySelectorAll('.format-dropdown').forEach(el => {
                            if (el.id !== 'modal-download-dropdown') {
                              el.classList.add('hidden');
                            }
                          });
                          
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
                          dropdown.style.zIndex = '60';
                          
                          // Show download format guide
                          showDownloadFormatGuide();
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      다운로드
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional dropdowns for modals */}
      <div id="modal-download-dropdown" className="format-dropdown hidden fixed bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-48 z-60">
        <div className="py-1 text-center border-b border-gray-200 mb-2 relative">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
          <span className="text-sm font-semibold text-gray-700">다운로드 형식</span>
        </div>
        <button 
          className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm flex items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            downloadPlan('draft', 'txt');
            document.getElementById('modal-download-dropdown')?.classList.add('hidden');
          }}
        >
          <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">TXT</span>
          텍스트 파일 (.txt)
        </button>
        <button 
          className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm flex items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const modalElement = document.querySelector('.prose.prose-blue.max-w-none') as HTMLElement; 
            exportToPdf(modalElement || draftPlanContent, `사업계획서_초안`);
            document.getElementById('modal-download-dropdown')?.classList.add('hidden');
          }}
        >
          <span className="bg-red-100 text-red-700 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">PDF</span>
          PDF 문서 (.pdf)
        </button>
        <button 
          className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm flex items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            exportToDocx(draftPlanContent, `사업계획서_초안`);
            document.getElementById('modal-download-dropdown')?.classList.add('hidden');
          }}
        >
          <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">DOC</span>
          워드 문서 (.docx)
        </button>
      </div>

      {/* Format dropdowns */}
      <div id="draft-plan-dropdown" className="format-dropdown hidden fixed bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-48 z-50">
        <div className="py-1 text-center border-b border-gray-200 mb-2 relative">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
          <span className="text-sm font-semibold text-gray-700">다운로드 형식</span>
        </div>
        <button 
          className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm flex items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            downloadPlan('draft', 'txt');
            document.getElementById('draft-plan-dropdown')?.classList.add('hidden');
          }}
        >
          <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">TXT</span>
          텍스트 파일 (.txt)
        </button>
        <button 
          className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm flex items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const draftElement = document.querySelector('.hover-card') as HTMLElement;
            exportToPdf(draftElement, `사업계획서_초안`);
            document.getElementById('draft-plan-dropdown')?.classList.add('hidden');
          }}
        >
          <span className="bg-red-100 text-red-700 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">PDF</span>
          PDF 문서 (.pdf)
        </button>
        <button 
          className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm flex items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            exportToDocx(draftPlanContent, `사업계획서_초안`);
            document.getElementById('draft-plan-dropdown')?.classList.add('hidden');
          }}
        >
          <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">DOC</span>
          워드 문서 (.docx)
        </button>
      </div>
      
      <div id="submission-plan-dropdown" className="format-dropdown hidden fixed bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-48 z-50">
        <div className="py-1 text-center border-b border-gray-200 mb-2 relative">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
          <span className="text-sm font-semibold text-gray-700">다운로드 형식</span>
        </div>
        <button 
          className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm flex items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            downloadPlan('submission', 'txt');
            document.getElementById('submission-plan-dropdown')?.classList.add('hidden');
          }}
        >
          <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">TXT</span>
          텍스트 파일 (.txt)
        </button>
        <button 
          className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm flex items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const submissionElement = document.querySelector('.border.rounded-lg.overflow-hidden') as HTMLElement;
            exportToPdf(submissionElement, `사업계획서_제출용`);
            document.getElementById('submission-plan-dropdown')?.classList.add('hidden');
          }}
        >
          <span className="bg-red-100 text-red-700 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">PDF</span>
          PDF 문서 (.pdf)
        </button>
        <button 
          className="block w-full px-3 py-2 text-left hover:bg-gray-100 rounded text-sm flex items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            exportToDocx(submissionPlanSections, `사업계획서_제출용`);
            document.getElementById('submission-plan-dropdown')?.classList.add('hidden');
          }}
        >
          <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-xs">DOC</span>
          워드 문서 (.docx)
        </button>
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">템플릿 선택</h3>
              <button onClick={() => setShowTemplateModal(false)}>
                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            {templateSource === 'draft' ? (
              // For draft plans, show information about using the draft prompt
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">사업계획서 초안</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      사업계획서 초안은 템플릿 선택 없이 다음 구조로 생성됩니다:
                    </p>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc pl-5">
                      <li>개요</li>
                      <li>문제 인식</li>
                      <li>솔루션</li>
                      <li>실현 방법</li>
                      <li>스케일업 전략</li>
                      <li>사업 로드맵</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              // For submission plans, show template selection
              <>
                {/* Template pricing note in modal */}
                <div 
                  className="bg-blue-50 p-3 rounded-lg mb-4 cursor-pointer hover:bg-blue-100 transition-colors" 
                  onClick={() => {
                    setShowTemplateModal(false);
                    setShowPlanUpgradeModal(true);
                  }}
                >
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700">
                      <strong>가격 안내:</strong> 기본 스타트업 템플릿은 무료, 특화 템플릿은 각 ₩3,000원입니다. <span className="text-blue-600 hover:underline">유료 구독</span> 시 모든 템플릿을 무제한으로 이용 가능합니다.
                    </p>
                  </div>
                </div>
                
                {isLoadingTemplates ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="ml-3 text-gray-600">템플릿을 불러오는 중...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {getFilteredTemplates('submission').map((template) => (
                        <div 
                          key={template.template_id} 
                          className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition ${
                            selectedTemplate === template.template_id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                          }`}
                          onClick={() => setSelectedTemplate(template.template_id)}
                        >
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
                            getTemplateColorClass(template.color)
                          }`}>
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{template.title}</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              template.is_free ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {template.is_free ? '무료' : '₩3,000'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                onClick={() => setShowTemplateModal(false)}
              >
                취소
              </button>
              {templateSource === 'draft' ? (
                <button
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                  onClick={generateDraftPlan}
                  disabled={isGeneratingDraftPlan}
                >
                  {isGeneratingDraftPlan ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>생성 중...</span>
                    </div>
                  ) : (
                    <span>초안 생성하기</span>
                  )}
                </button>
              ) : (
                <button 
                  className={`px-6 py-2 ${
                    !selectedTemplate 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-lg flex items-center`}
                  disabled={!selectedTemplate || isGeneratingDraftPlan}
                  onClick={() => {
                    // For submission plans, use the selected template
                    generateSubmissionPlan();
                  }}
                >
                  {isGeneratingDraftPlan ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>생성 중...</span>
                    </div>
                  ) : (
                    <span>템플릿 적용하기</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Plan Modal */}
      <SubmissionPlanModal
        isOpen={showSubmissionPlanModal}
        onClose={() => setShowSubmissionPlanModal(false)}
        sections={submissionPlanSections}
        onUpdateSection={updateSectionContent}
        selectedTemplateTitle={selectedTemplateTitle}
        templateColor={templates.find(t => t.template_id === selectedTemplate)?.color || 'green'}
        draftPlanTitle={draftPlanTitle}
        onSavePlan={() => savePlan('submission')}
        onRegeneratePlan={generateSubmissionPlan}
        onChangeTemplate={() => {
          setShowSubmissionPlanModal(false);
          setTemplateSource('submission');
          setShowTemplateModal(true);
        }}
      />

      {/* Subscription upgrade modal */}
      {showPlanUpgradeModal && (
        <PlanUpgradeModal
          isOpen={showPlanUpgradeModal}
          onClose={() => setShowPlanUpgradeModal(false)}
          currentPlan={currentPlan}
        />
      )}
    </div>
  );
}
import React from 'react';

interface TemplateTitleProps {
  content: string;
}

/**
 * Safely extracts a title from HTML or formatted content
 * Removes any HTML tags and returns clean text
 */
const TemplateTitle: React.FC<TemplateTitleProps> = ({ content }) => {
  const extractTitle = (htmlContent: string): string => {
    // Handle both HTML entity-encoded and regular HTML
    const decodedContent = htmlContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Create a temporary DOM element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = decodedContent;
    
    // First try to get the first paragraph or heading
    const firstElement = tempDiv.querySelector('p, h1, h2, h3, h4, h5, h6');
    
    if (firstElement) {
      const elementText = firstElement.textContent || '';
      return elementText.length > 50 ? elementText.substring(0, 50) + '...' : elementText;
    }
    
    // Fallback to getting all text content
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Get the first line or first 50 characters, whichever is shorter
    const firstLine = textContent.split('\n')[0] || '';
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  };

  return (
    <span>{extractTitle(content)}</span>
  );
};

export default TemplateTitle; 
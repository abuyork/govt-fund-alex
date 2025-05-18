import React, { useEffect, useState } from 'react';

interface TemplateViewerProps {
  content: string;
}

const TemplateViewer: React.FC<TemplateViewerProps> = ({ content }) => {
  const [processedContent, setProcessedContent] = useState<string>('');
  
  useEffect(() => {
    // Parse HTML content and process tables
    const parsedContent = parseHtmlContent(content);
    setProcessedContent(parsedContent);
  }, [content]);
  
  // Parse HTML content to ensure it's properly decoded and process tables
  const parseHtmlContent = (htmlContent: string): string => {
    // Replace encoded HTML entities
    let decodedContent = htmlContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
      
    // Process tables in the content
    decodedContent = processTablesInContent(decodedContent);
    
    // Handle if the content contains raw HTML tags as text
    const hasRawHtmlAsText = 
      /&lt;[a-z]/.test(decodedContent) || 
      /&lt;\/[a-z]/.test(decodedContent) ||
      /<[a-z][^>]*>[^<]*<\/[a-z][^>]*>/i.test(decodedContent);
    
    // Create a DOM parser to properly handle the HTML
    if (hasRawHtmlAsText) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(decodedContent, 'text/html');
      
      // If the parsed content contains <parsererror>, there was an error
      // In that case, return a cleaned-up version without HTML tags
      if (doc.querySelector('parsererror')) {
        const temp = document.createElement('div');
        temp.innerHTML = decodedContent;
        return temp.textContent || temp.innerText || '';
      }
    }
    
    return decodedContent;
  };
  
  // Process tables in the content
  const processTablesInContent = (htmlContent: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Find all potential table markers
    const textNodes = getAllTextNodes(tempDiv);
    
    let tableStartIndex = -1;
    let tableEndIndex = -1;
    let tableContent: string[] = [];
    
    // First pass: collect table data
    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i];
      const text = node.textContent || '';
      
      if (text.trim() === '## 테이블 시작 ##') {
        tableStartIndex = i;
        tableContent = [];
      } else if (text.trim() === '## 테이블 끝 ##') {
        tableEndIndex = i;
        
        if (tableStartIndex !== -1 && tableContent.length > 0) {
          // Create table HTML
          const tableHtml = createTableHtml(tableContent);
          
          // Replace nodes with table
          const tableStartNode = textNodes[tableStartIndex];
          const tableStartParent = tableStartNode.parentNode;
          
          if (tableStartParent) {
            // Create a container for the table
            const tableContainer = document.createElement('div');
            tableContainer.className = 'template-table-container';
            tableContainer.innerHTML = tableHtml;
            
            // Replace the start marker with the table
            tableStartParent.replaceChild(tableContainer, tableStartNode);
            
            // Remove all nodes between start and end (inclusive)
            for (let j = tableStartIndex + 1; j <= tableEndIndex; j++) {
              const nodeToRemove = textNodes[j];
              if (nodeToRemove && nodeToRemove.parentNode) {
                nodeToRemove.parentNode.removeChild(nodeToRemove);
              }
            }
          }
        }
        
        tableStartIndex = -1;
        tableContent = [];
      } else if (tableStartIndex !== -1 && tableEndIndex === -1) {
        // We're inside a table definition
        tableContent.push(text.trim());
      }
    }
    
    return tempDiv.innerHTML;
  };
  
  // Get all text nodes in the document
  const getAllTextNodes = (node: Node): Text[] => {
    const textNodes: Text[] = [];
    
    // Function to recursively collect text nodes
    const collectTextNodes = (n: Node) => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent && n.textContent.trim()) {
        textNodes.push(n as Text);
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        for (let i = 0; i < n.childNodes.length; i++) {
          collectTextNodes(n.childNodes[i]);
        }
      }
    };
    
    collectTextNodes(node);
    return textNodes;
  };
  
  // Create HTML for a table from CSV content
  const createTableHtml = (csvLines: string[]): string => {
    if (csvLines.length === 0) return '';
    
    // Parse CSV rows
    const rows = csvLines.map(line => {
      const cells = line.split(',').map(cell => cell.trim());
      return cells;
    });
    
    // Create HTML table
    let tableHtml = '<table class="template-table">';
    
    // Create header row
    const headerRow = rows[0];
    if (headerRow) {
      tableHtml += '<thead><tr>';
      headerRow.forEach(cell => {
        tableHtml += `<th>${cell}</th>`;
      });
      tableHtml += '</tr></thead>';
    }
    
    // Create data rows
    if (rows.length > 1) {
      tableHtml += '<tbody>';
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        tableHtml += '<tr>';
        row.forEach(cell => {
          tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody>';
    }
    
    tableHtml += '</table>';
    return tableHtml;
  };

  return (
    <div 
      className="template-viewer"
      dangerouslySetInnerHTML={{ __html: processedContent }} 
    />
  );
};

export default TemplateViewer; 
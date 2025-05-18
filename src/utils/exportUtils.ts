import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// Function to export business plan to PDF
export const exportToPdf = async (content: string | HTMLElement, filename: string): Promise<boolean> => {
  try {
    // If content is a string, create a temporary div to render it
    let element: HTMLElement;
    let tempElement: HTMLElement | null = null;
    
    if (typeof content === 'string') {
      tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      tempElement.style.width = '800px';
      tempElement.style.padding = '20px';
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px';
      document.body.appendChild(tempElement);
      element = tempElement;
    } else {
      element = content;
    }

    // Use html2canvas to capture the content as an image
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      allowTaint: true
    });
    
    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Create PDF instance with A4 dimensions
    const pdf = new jsPDF('p', 'mm', 'a4');
    let firstPage = true;
    
    // Add image to PDF, creating new pages as needed
    while (heightLeft > 0) {
      if (!firstPage) {
        pdf.addPage();
      } else {
        firstPage = false;
      }
      
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.9), 
        'JPEG', 
        0, // x position
        position, // y position (negative to place content properly on subsequent pages)
        imgWidth, 
        imgHeight
      );
      
      heightLeft -= pageHeight;
      position -= pageHeight; // Move position for next page
    }
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
    
    // Clean up temporary element if created
    if (tempElement) {
      document.body.removeChild(tempElement);
    }
    
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
  }
};

// Function to export business plan to DOCX
export const exportToDocx = async (content: string | { title: string, content: string }[], filename: string): Promise<boolean> => {
  try {
    // Process content into document sections and children
    const children: any[] = [];
    
    // Process plain text or sections array
    if (typeof content === 'string') {
      // Split text by lines and process
      const lines = content.split('\n');
      let inTable = false;
      let tableRows: string[][] = [];
      
      for (let line of lines) {
        // Skip empty lines
        if (!line.trim()) {
          children.push(new Paragraph({ text: '' }));
          continue;
        }
        
        // Detect headings
        if (line.startsWith('# ')) {
          children.push(
            new Paragraph({
              text: line.replace(/^# /, ''),
              heading: HeadingLevel.HEADING_1
            })
          );
        } else if (line.startsWith('## ')) {
          children.push(
            new Paragraph({
              text: line.replace(/^## /, ''),
              heading: HeadingLevel.HEADING_2
            })
          );
        } else if (line.startsWith('### ')) {
          children.push(
            new Paragraph({
              text: line.replace(/^### /, ''),
              heading: HeadingLevel.HEADING_3
            })
          );
        } 
        // Detect table rows (CSV format)
        else if (line.includes(',') && (line.split(',').length >= 3 || inTable)) {
          inTable = true;
          tableRows.push(line.split(',').map(cell => cell.trim()));
        }
        // Non-table content and end of table
        else {
          // If we were in a table, add it now
          if (inTable && tableRows.length > 0) {
            const table = createTable(tableRows);
            children.push(table);
            tableRows = [];
            inTable = false;
          }
          
          // Add regular paragraph
          children.push(new Paragraph({ text: line }));
        }
      }
      
      // Add any remaining table at the end
      if (inTable && tableRows.length > 0) {
        const table = createTable(tableRows);
        children.push(table);
      }
    } else {
      // Process sections array
      for (const section of content) {
        // Add section title as heading
        children.push(
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_1
          })
        );
        
        // Add a blank line after heading
        children.push(new Paragraph({ text: '' }));
        
        // Process section content (recursively call this function for content)
        const sectionContent = section.content;
        const lines = sectionContent.split('\n');
        let inTable = false;
        let tableRows: string[][] = [];
        
        for (let line of lines) {
          // Skip empty lines
          if (!line.trim()) {
            children.push(new Paragraph({ text: '' }));
            continue;
          }
          
          // Detect headings (usually lower level in sections)
          if (line.startsWith('# ')) {
            children.push(
              new Paragraph({
                text: line.replace(/^# /, ''),
                heading: HeadingLevel.HEADING_2 // Lower level since we're in a section
              })
            );
          } else if (line.startsWith('## ')) {
            children.push(
              new Paragraph({
                text: line.replace(/^## /, ''),
                heading: HeadingLevel.HEADING_3
              })
            );
          } else if (line.startsWith('### ')) {
            children.push(
              new Paragraph({
                text: line.replace(/^### /, ''),
                heading: HeadingLevel.HEADING_4
              })
            );
          } 
          // Detect table rows (CSV format)
          else if (line.includes(',') && (line.split(',').length >= 3 || inTable)) {
            inTable = true;
            tableRows.push(line.split(',').map(cell => cell.trim()));
          }
          // Non-table content and end of table
          else {
            // If we were in a table, add it now
            if (inTable && tableRows.length > 0) {
              const table = createTable(tableRows);
              children.push(table);
              tableRows = [];
              inTable = false;
            }
            
            // Add regular paragraph
            children.push(new Paragraph({ text: line }));
          }
        }
        
        // Add any remaining table at the end
        if (inTable && tableRows.length > 0) {
          const table = createTable(tableRows);
          children.push(table);
        }
        
        // Add a blank line after each section
        children.push(new Paragraph({ text: '' }));
      }
    }
    
    // Create document with all content
    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });
    
    // Generate document using blob for browser compatibility
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    return false;
  }
};

// Helper function to create a table
function createTable(rows: string[][]): Table {
  const table = new Table({
    rows: rows.map((rowData, rowIndex) => {
      return new TableRow({
        children: rowData.map((cellData) => {
          return new TableCell({
            children: [new Paragraph({ text: cellData })],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            }
          });
        }),
      });
    }),
    width: {
      size: 100,
      type: "pct",
    },
  });
  
  return table;
} 
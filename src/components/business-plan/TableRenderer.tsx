import React, { useMemo } from 'react';

interface TableRendererProps {
  tableData: string[];
  className?: string;
}

/**
 * TableRenderer component for rendering CSV-formatted data as a proper HTML table
 * Used within business plan sections to display tabular data
 */
const TableRenderer: React.FC<TableRendererProps> = ({ tableData, className = '' }) => {
  // Ensure we have at least a header row and one data row
  if (!tableData || !Array.isArray(tableData) || tableData.length < 2) {
    console.warn('TableRenderer: Invalid table data provided', tableData);
    return null;
  }

  // Use useMemo to prevent unnecessary re-renders and DOM manipulations
  const renderedTable = useMemo(() => {
    try {
      // Filter out any empty or malformed lines
      const validTableData = tableData.filter(line => 
        line && typeof line === 'string' && line.trim().length > 0 && line.includes(',')
      );
      
      // If we don't have enough valid lines after filtering, return null
      if (validTableData.length < 2) {
        console.warn('TableRenderer: Not enough valid data rows', validTableData);
        return null;
      }
      
      // Parse the header row
      const headers = validTableData[0].split(',').map(header => header.trim());
      
      // Check if we have column headers
      if (headers.length < 2) {
        console.warn('TableRenderer: Not enough columns', headers);
        return null;
      }
      
      // Normalize data rows to ensure they all have the same number of columns
      const normalizedData = validTableData.slice(1).map(row => {
        const cells = row.split(',').map(cell => cell.trim());
        // Ensure each row has the same number of cells as the header
        while (cells.length < headers.length) {
          cells.push(''); // Add empty cells if needed
        }
        return cells.slice(0, headers.length); // Truncate if too many
      });
      
      return (
        <table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={`header-${index}`} 
                  className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalizedData.map((row, rowIndex) => (
              <tr 
                key={`row-${rowIndex}`} 
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {row.map((cellContent, cellIndex) => (
                  <td 
                    key={`cell-${rowIndex}-${cellIndex}`} 
                    className="px-4 py-2 text-sm text-gray-700 border-b"
                  >
                    {cellContent || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } catch (error) {
      console.error('Error rendering table:', error);
      return null;
    }
  }, [tableData]); // Only re-compute when tableData changes

  // Wrap the table in a stable div container
  return renderedTable ? (
    <div className={`my-4 overflow-x-auto ${className}`}>
      {renderedTable}
    </div>
  ) : null;
};

export default React.memo(TableRenderer); // Memoize the component to prevent unnecessary re-renders 
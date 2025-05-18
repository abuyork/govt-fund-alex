/**
 * Format date string to a human-readable format
 * @param dateString ISO date string or any valid date input
 * @returns Formatted date string like "YYYY.MM.DD HH:MM"
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original on error
  }
} 
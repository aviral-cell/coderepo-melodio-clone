/**
 * Formats a JavaScript date string to "Jan 15, 2025" format
 * @param dateString - JavaScript date string (e.g., "2025-01-15T00:00:00.000Z")
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

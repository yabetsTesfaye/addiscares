/**
 * Utility functions for formatting dates consistently across the application
 */

/**
 * Format a date string or timestamp to a readable date format
 * @param {string|number|Date} dateInput - Date to format
 * @param {boolean} includeTime - Whether to include time in the formatted string
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, includeTime = false) => {
  if (!dateInput) return 'N/A';
  
  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Calculate time elapsed since a given date
 * @param {string|number|Date} dateInput - Date to calculate time elapsed from
 * @returns {string} Formatted time elapsed (e.g., "2 days ago", "5 minutes ago")
 */
export const getTimeElapsed = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return 'Just now';
  }
  
  // Less than an hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Less than a month
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Less than a year
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  
  // More than a year
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

/**
 * Format a date as YYYY-MM-DD for form inputs
 * @param {string|number|Date} dateInput - Date to format
 * @returns {string} Date formatted as YYYY-MM-DD
 */
export const formatDateForInput = (dateInput) => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Application constants

// User roles
export const USER_ROLES = {
  REPORTER: 'reporter',
  GOVERNMENT: 'government',
  ADMIN: 'admin'
};

// Report status options
export const REPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated'
};

// Report categories
export const REPORT_CATEGORIES = {
  ROAD: 'road',
  BUILDING: 'building',
  ENVIRONMENT: 'environment',
  PUBLIC_SERVICE: 'public_service',
  OTHER: 'other'
};

// Status color mapping
export const STATUS_COLORS = {
  pending: 'warning',
  in_progress: 'info',
  resolved: 'success',
  escalated: 'danger'
};

// Role color mapping
export const ROLE_COLORS = {
  reporter: 'primary',
  government: 'info',
  admin: 'secondary'
};

// Formatted names for display
export const formatEnumValue = (value) => {
  if (!value) return '';
  return value
    .replace('_', ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

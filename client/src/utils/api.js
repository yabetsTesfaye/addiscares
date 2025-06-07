import axios from 'axios';

// Mock data for development when backend is not available
const mockData = {
  // Mock user data based on role
  users: {
    reporter: {
      _id: 'mock123',
      name: 'Demo Reporter',
      email: 'reporter@example.com',
      role: 'reporter',
      createdAt: new Date().toISOString()
    },
    government: {
      _id: 'mock456',
      name: 'Demo Official',
      email: 'government@example.com',
      role: 'government',
      createdAt: new Date().toISOString()
    },
    admin: {
      _id: 'mock789',
      name: 'Demo Admin',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  },
  // Current user (dynamically set based on login)
  user: null,
  reports: [
    {
      _id: 'report1',
      title: 'Road Hazard on Main Street',
      description: 'Large pothole causing traffic issues',
      location: 'Main Street, Downtown',
      category: 'road',
      status: 'pending',
      createdAt: new Date().toISOString(),
      reporter: {
        _id: 'mock123',
        name: 'Demo User'
      }
    },
    {
      _id: 'report2',
      title: 'Broken Streetlight',
      description: 'Streetlight not working at night causing safety concerns',
      location: 'Park Avenue',
      category: 'public_service',
      status: 'in_progress',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      reporter: {
        _id: 'mock123',
        name: 'Demo User'
      }
    },
    {
      _id: 'report3',
      title: 'Building Crack',
      description: 'Visible crack in apartment building wall',
      location: 'Riverside Apartments',
      category: 'building',
      status: 'resolved',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      reporter: {
        _id: 'mock123',
        name: 'Demo User'
      }
    }
  ],
  // Mock list of all users
  allUsers: [
    {
      _id: 'user1',
      name: 'Demo Reporter',
      email: 'reporter@example.com',
      role: 'reporter',
      status: 'active',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'user2',
      name: 'Demo Official 1',
      email: 'gov1@example.com',
      role: 'government',
      status: 'active',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'user3',
      name: 'Demo Official 2',
      email: 'gov2@example.com',
      role: 'government',
      status: 'active',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'user4',
      name: 'System Admin',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'user5',
      name: 'Inactive User',
      email: 'inactive@example.com',
      role: 'reporter',
      status: 'inactive',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  
  notifications: [
    {
      _id: 'notif1',
      title: 'Report Status Updated',
      message: 'Your report "Broken Streetlight" has been marked as in progress',
      read: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      recipient: {
        _id: 'mock123',
        name: 'Demo User'
      }
    },
    {
      _id: 'notif2',
      title: 'Report Resolved',
      message: 'Your report "Building Crack" has been resolved',
      read: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      recipient: {
        _id: 'mock123',
        name: 'Demo User'
      }
    }
  ]
};

// Use development mode detection
const isDevelopment = process.env.NODE_ENV === 'development';

// Simple helper to get mock data for an endpoint
const getMockDataForEndpoint = (url, method = 'get', data = null) => {
  console.log(`Using mock data for: ${url} [${method}]`);
  
  // Auth endpoints
  if (url.includes('/auth/user')) {
    return mockData.user || mockData.users.reporter;
  }
  // Login & Register endpoints
  else if (url.includes('/auth/login') || url.includes('/auth/register')) {
    // Set mock user based on email in request body
    const email = data?.email?.toLowerCase() || '';
    
    console.log('Processing auth request for email:', email);
    
    // Check if we have a forced role from localStorage
    const forcedRole = localStorage.getItem('FORCE_ROLE');
    if (forcedRole) {
      console.log('Using forced role from localStorage:', forcedRole);
      // Clear the forced role after using it once
      localStorage.removeItem('FORCE_ROLE');
      
      if (forcedRole === 'government') {
        mockData.user = mockData.users.government;
        localStorage.setItem('token', 'mock-token-government');
        return { token: 'mock-token-government', user: mockData.users.government };
      } else if (forcedRole === 'admin') {
        mockData.user = mockData.users.admin;
        localStorage.setItem('token', 'mock-token-admin');
        return { token: 'mock-token-admin', user: mockData.users.admin };
      } else {
        mockData.user = mockData.users.reporter;
        localStorage.setItem('token', 'mock-token-reporter');
        return { token: 'mock-token-reporter', user: mockData.users.reporter };
      }
    }
    
    // Normal email-based role detection
    let role = 'reporter';
    if (email.includes('government') || (email.includes('@addiscare.com') && !email.includes('admin'))) {
      role = 'government';
      mockData.user = mockData.users.government;
    } else if (email.includes('admin')) {
      role = 'admin';
      mockData.user = mockData.users.admin;
    } else {
      mockData.user = mockData.users.reporter;
    }
    
    // Force localStorage update directly to ensure token is saved
    localStorage.setItem('token', 'mock-token-' + role);
    
    return { token: 'mock-token-' + role, user: mockData.user };
  }
  // Reports endpoints - user specific
  else if (url.includes('/reports/user')) {
    return mockData.reports.filter(r => 
      r.reporter?._id === mockData.user?._id || 
      r.reporter === mockData.user?._id
    );
  }
  // All reports endpoint
  else if (url === '/reports' || url === '/reports/') {
    return mockData.reports;
  }
  // Notifications endpoints
  else if (url.includes('/notifications')) {
    return mockData.notifications;
  }
  // Users endpoint
  else if (url.includes('/users')) {
    return mockData.allUsers;
  }
  // Individual report endpoint
  else if (url.match(/\/reports\/[\w\d]+$/)) {
    const reportId = url.split('/').pop();
    const report = mockData.reports.find(r => r._id === reportId) || mockData.reports[0];
    return report;
  }
  // Report status update endpoint
  else if (url.match(/\/reports\/[\w\d]+\/status/)) {
    const reportId = url.split('/')[2]; // Get report ID from URL
    const statusData = data || {};
    
    // Find the report and update its status
    const reportIndex = mockData.reports.findIndex(r => r._id === reportId);
    if (reportIndex !== -1) {
      mockData.reports[reportIndex] = {
        ...mockData.reports[reportIndex],
        status: statusData.status || mockData.reports[reportIndex].status,
        assignedTo: statusData.assignedTo ? { _id: statusData.assignedTo, name: 'Assigned User' } : null
      };
      return mockData.reports[reportIndex];
    }
    return mockData.reports[0];
  }
  // Report comment endpoint
  else if (url.match(/\/reports\/[\w\d]+\/comment/)) {
    const reportId = url.split('/')[2]; // Get report ID from URL
    const commentData = data || {};
    
    // Find the report and add a comment
    const reportIndex = mockData.reports.findIndex(r => r._id === reportId);
    if (reportIndex !== -1) {
      if (!mockData.reports[reportIndex].comments) {
        mockData.reports[reportIndex].comments = [];
      }
      mockData.reports[reportIndex].comments.push({
        _id: `comment-${Date.now()}`,
        text: commentData.text || 'New comment',
        user: { _id: mockData.user?._id || 'user1', name: mockData.user?.name || 'Demo User' },
        createdAt: new Date().toISOString()
      });
      return mockData.reports[reportIndex];
    }
    return mockData.reports[0];
  }
  // User profile endpoint
  else if (url.includes('/users/profile')) {
    // For PUT requests, return updated user data
    if (method === 'put') {
      const updatedUser = {
        ...mockData.user,
        ...data // Merge the update data with mock user
      };
      return updatedUser;
    }
  }
  
  // Default fallback
  return { message: 'Mock data not available for this endpoint' };
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3001/api',  // Point to the backend server
  withCredentials: true,  // Include cookies in requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token in the headers
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['x-auth-token'] = token;
      }
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
        headers: config.headers
      });
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log the error
    console.error('[API] Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // If token expired, try to refresh it
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log('[API] Attempting to refresh token...');
        const refreshResponse = await axios.get('http://localhost:3001/api/auth/refresh-token', {
          withCredentials: true
        });
        
        if (refreshResponse.data.token) {
          const { token } = refreshResponse.data;
          localStorage.setItem('token', token);
          originalRequest.headers['x-auth-token'] = token;
          console.log('[API] Token refreshed, retrying original request');
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API] Error refreshing token:', refreshError);
        // If refresh fails, redirect to login
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Add request interceptor to strip leading /api from request paths to prevent double prefixes
api.interceptors.request.use(
  config => {
    // Strip leading /api from URL if present to prevent double /api/api/ prefixes
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.substring(4); // Remove the /api prefix
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add request interceptor to add auth token and handle mock data
api.interceptors.request.use(
  config => {
    // Add auth token to all requests
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    // We won't intercept requests by default - let them go to the real backend
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // For 403 errors, we'll let the component handle it
    if (error.response && error.response.status === 403) {
      return Promise.reject(error);
    }
    
    // Simplified error handling - just log the error and reject the promise
    console.error('API error:', error.message);
    
    // In development mode, show more details
    if (isDevelopment) {
      console.log('Error details:', error);
    }
    
    // If we can't handle with mock data, reject with the original error
    return Promise.reject(error);
  }
);

// Add helper methods to simplify API usage
export const authAPI = {
  login: (credentials) => {
    console.log('Login called with:', credentials);
    return api.post('/auth/login', credentials);
  },
  register: (userData) => {
    console.log('Register called with:', userData);
    return api.post('/auth/register', userData);
  },
  getCurrentUser: () => api.get('/auth/user')
};

export const reportAPI = {
  getAll: () => api.get('/reports'),
  getUserReports: () => api.get('/reports/user'),
  getById: (id) => api.get(`/reports/${id}`),
  create: (reportData) => api.post('/reports', reportData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStatus: (id, statusData) => api.put(`/reports/${id}/status`, statusData),
  addComment: (id, comment) => api.post(`/reports/${id}/comment`, comment),
  deleteComment: (reportId, commentId) => api.delete(`/reports/${reportId}/comments/${commentId}`),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  send: (notificationData) => api.post('/notifications', notificationData),
  sendBulk: (bulkData) => api.post('/notifications/bulk', bulkData)
};

export default api;

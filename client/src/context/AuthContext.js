import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // We don't need to configure axios directly anymore as our API utility handles this
  // This effect can be removed, but keeping commented for reference
  /*
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  }, [token]);
  */

  // Function to fetch notifications from the server
  const fetchNotifications = async () => {
    if (!token || !isAuthenticated) {
      console.log('Skipping notifications fetch - no token or not authenticated');
      return [];
    }
    
    try {
      console.log('Fetching notifications with token:', token.substring(0, 10) + '...');
      
      // Fetch both notifications and unread count in parallel
      const [notificationsRes, unreadRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      
      const notificationsData = notificationsRes.data || [];
      const unreadCount = unreadRes.data?.count || 0;
      
      console.log('Notifications response:', {
        total: notificationsData.length,
        unreadCount,
        firstFewTitles: notificationsData.slice(0, 3).map(n => n.title)
      });
      
      // Update notifications state
      setNotifications(notificationsData);
      
      // Update unread count from the server
      setUnreadCount(unreadCount);
      
      return notificationsData;
    } catch (err) {
      console.error('Error fetching notifications:', err.response?.data || err.message);
      
      // Only clear state if it's an authentication error
      if (err.response?.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
      }
      
      return [];
    }
  };
  
  // Function to fetch unread notification count
  const fetchUnreadCount = async () => {
    if (!token || !isAuthenticated) {
      console.log('Skipping unread count fetch - no token or not authenticated');
      return 0;
    }
    
    try {
      // First try to get the count from the server
      const res = await api.get('/notifications/unread-count');
      const count = res.data.count || 0;
      
      // Also update the local state to be consistent
      if (notifications.length > 0) {
        const localUnreadCount = notifications.filter(notif => !notif.readByUser).length;
        if (localUnreadCount !== count) {
          console.log(`Count mismatch: server=${count}, local=${localUnreadCount}. Using server count.`);
        }
      }
      
      setUnreadCount(count);
      return count;
    } catch (err) {
      console.error('Error fetching unread count, falling back to local count:', err.response?.data || err.message);
      
      // Fall back to local count if server request fails
      const localUnreadCount = notifications.filter(notif => !notif.readByUser).length;
      setUnreadCount(localUnreadCount);
      return localUnreadCount;
    }
  };

  // Function to mark a notification as read
  const markNotificationAsRead = async (notificationId) => {
    if (!token || !isAuthenticated || !notificationId) return false;
    
    try {
      // Update local state optimistically first for better UX
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, readByUser: true } 
            : notif
        )
      );
      
      // Make the API call to mark as read
      await api.put(`/notifications/${notificationId}/read`);
      
      // Always refresh both notifications and unread count to ensure consistency
      await Promise.all([
        fetchNotifications(),
        fetchUnreadCount()
      ]);
      
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      
      // Revert optimistic update on error
      if (err.response?.status !== 401) { // Don't try to refresh if unauthorized
        await fetchNotifications();
        await fetchUnreadCount();
      }
      
      return false;
    }
  };
  
  // Function to mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!token || !isAuthenticated) return { success: false, count: 0 };
    
    try {
      // Update local state optimistically first for better UX
      setNotifications(prev => 
        prev.map(notif => ({
          ...notif,
          readByUser: true
        }))
      );
      
      // Make the API call to mark all as read
      const response = await api.patch('/notifications/mark-all-read');
      
      if (response.data && response.data.success) {
        // Refresh both notifications and unread count to ensure consistency
        await Promise.all([
          fetchNotifications(),
          fetchUnreadCount()
        ]);
      } else {
        // If API call failed, revert to previous state
        await fetchNotifications();
        await fetchUnreadCount();
      }
      
      return response.data || { success: false, count: 0 };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      
      // Revert optimistic update on error
      if (err.response?.status !== 401) { // Don't try to refresh if unauthorized
        await fetchNotifications();
        await fetchUnreadCount();
      }
      
      return { 
        success: false, 
        error: err.response?.data?.message || err.message 
      };
    }
  };

  // Function to update user data
  const updateUser = useCallback((userData) => {
    if (!userData) return; // Guard against undefined or null userData
    
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
    
    // Update language in localStorage if it's being updated
    if (userData && userData.language) {
      localStorage.setItem('preferredLanguage', userData.language);
    }
  }, []);

  // Function to refresh user data
  const refreshUser = useCallback(async () => {
    if (!token) return null;
    
    try {
      const res = await api.get('/auth/user');
      
      // If we get here, the user is authenticated
      updateUser(res.data);
      setIsAuthenticated(true);
      
      // Only fetch notifications and unread count for active users
      if (res.data.status === 'active') {
        // Fetch notifications and unread count in parallel
        await Promise.all([
          fetchNotifications({ silent: true }),
          fetchUnreadCount({ silent: true })
        ]);
      }
      
      return res.data;
    } catch (err) {
      console.error('Error refreshing user data:', err);
      
      // If the error is due to inactive account, return the error
      if (err.response?.status === 403 || 
          err.response?.data?.code === 'ACCOUNT_INACTIVE' || 
          err.response?.data?.code === 'ACCOUNT_DEACTIVATED') {
            
        const userData = {
          ...err.response?.data,
          id: err.response?.data?.userId,
          status: 'inactive'
        };
        
        setUser(userData);
        setIsAuthenticated(false);
        return userData;
      }
      
      // For 401 errors, clear auth state
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setNotifications([]);
        setUnreadCount(0);
      }
      
      return null;
    }
  }, [token, isAuthenticated]);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      await refreshUser();
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (formData) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
      return false;
    }
  };

  // Login user
  const login = async (formData) => {
    setError(null);
    try {
      console.log('AuthContext: Attempting login with', formData.email);
      const res = await api.post('/auth/login', formData);
      
      console.log('AuthContext: Login response received', res.data);
      
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        return true;
      } else {
        console.error('AuthContext: Missing token in response');
        setError('Invalid response from server');
        return false;
      }
    } catch (err) {
      console.error('AuthContext: Login error', err);
      
      // If it's a 403 error, treat it as an inactive account
      if (err.response?.status === 403) {
        console.log('AuthContext: 403 error received, treating as inactive account');
        
        // Create a simplified error object with just the necessary data
        const errorData = {
          message: err.response?.data?.msg || 'Your account is not active. Please contact support.',
          response: {
            status: 403,
            data: {
              ...err.response?.data,
              code: err.response?.data?.code || 'ACCOUNT_INACTIVE',
              status: 'inactive',
              deactivationReason: err.response?.data?.msg || 
                               'Your account is not active. Please contact support.',
              appealStatus: 'none',
              userId: null
            }
          }
        };
        
        console.log('AuthContext: Throwing inactive account error:', errorData);
        throw errorData;
      }
      
      // For other errors, set the error message and return false
      setError(err.response?.data?.msg || 'Invalid credentials');
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };
  
  // Clear error message
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        token,
        login,
        register,
        logout,
        refreshUser,
        notifications,
        unreadCount,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateUser,
        clearError,
        fetchUnreadCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

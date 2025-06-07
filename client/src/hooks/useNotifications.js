import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

export const useNotifications = (isAuthenticated, user) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notificationsStateRef = useRef([]);
  const fetchNotificationsRef = useRef(null);

  // Fetch notifications with error handling and loading state
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('Not fetching notifications: user not authenticated');
      return [];
    }
    
    try {
      setLoading(true);
      
      // First get the unread count
      const unreadRes = await api.get('/notifications/unread-count');
      const count = unreadRes.data?.count || 0;
      
      // Then get the notifications
      const notificationsRes = await api.get('/notifications', {
        params: {
          limit: 5, // Only fetch the 5 most recent notifications
          sort: '-createdAt',
          populate: 'sender',
          unreadOnly: false
        }
      });
      
      // Process notifications to ensure they have the required fields
      const processedNotifications = (notificationsRes.data || []).map(notification => ({
        ...notification,
        _id: notification._id || Math.random().toString(36).substr(2, 9),
        title: notification.title || 'New Notification',
        message: notification.message || 'You have a new notification',
        link: notification.link || '#',
        read: notification.read || false,
        createdAt: notification.createdAt || new Date().toISOString(),
        sender: notification.sender || {
          name: 'System',
          _id: 'system'
        }
      }));
      
      setNotifications(processedNotifications);
      setUnreadCount(count);
      
      // Update the unread count in AuthContext if available
      if (user.updateUnreadCount) {
        user.updateUnreadCount(count);
      }
      
      return processedNotifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock notifications data');
        const mockNotifications = [{
          _id: '1',
          title: 'Welcome to AddisCare',
          message: 'Thank you for signing up!',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/welcome'
        }];
        setNotifications(mockNotifications);
        setUnreadCount(1);
        return mockNotifications;
      }
      
      toast.error('Failed to load notifications');
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Update the unread count in AuthContext if available
      if (user?.updateUnreadCount) {
        user.updateUnreadCount(0);
      }
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to update notifications');
    }
  }, [isAuthenticated, user]);

  // Mark a single notification as read
  const handleMarkAsRead = useCallback(async (notificationId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      // Optimistically update the UI
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      
      // Update unread count if the notification was unread
      const notification = notifications.find(n => n._id === notificationId);
      if (notification && !notification.read) {
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        
        // Update the unread count in AuthContext if available
        if (user?.updateUnreadCount) {
          user.updateUnreadCount(newCount);
        }
      }
      
      // Call the API
      await api.patch(`/notifications/${notificationId}/read`);
      
      // Refresh notifications to ensure consistency
      if (fetchNotificationsRef.current) {
        await fetchNotificationsRef.current();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification status');
      
      // Revert optimistic update on error
      try {
        if (fetchNotificationsRef.current) {
          await fetchNotificationsRef.current();
        }
      } catch (err) {
        console.error('Error refreshing notifications:', err);
      }
    }
  }, [notifications, unreadCount, user]);

  // Update the ref when fetchNotifications changes
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  // Keep the notifications state ref updated
  useEffect(() => {
    notificationsStateRef.current = notifications;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllAsRead,
    handleMarkAsRead
  };
};

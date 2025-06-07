import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import NotificationsList from '../../components/notifications/NotificationsList';



const ReporterNotifications = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  
  const { 
    notifications = [], 
    unreadCount: contextUnreadCount = 0,
    loading: contextLoading, 
    error: contextError,
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    fetchNotifications,
    fetchUnreadCount 
  } = useContext(AuthContext);
  
  // Sync local unread count with context
  useEffect(() => {
    setLocalUnreadCount(contextUnreadCount);
  }, [contextUnreadCount]);

  // Load notifications and update unread count
  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch both notifications and unread count in parallel
      await Promise.all([
        fetchNotifications(),
        (async () => {
          try {
            const count = await fetchUnreadCount();
            if (count !== undefined) {
              setLocalUnreadCount(count);
            }
          } catch (err) {
            console.error('Error fetching unread count:', err);
          }
        })()
      ]);
      
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotifications, fetchUnreadCount]);

  // Initial load
  useEffect(() => {
    loadNotifications();
    
    // Set up polling
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    
    // Cleanup
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Handle mark as read
  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // No need to update local state as it's handled in the context
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err; // Let the NotificationsList handle the error
    }
  }, [markNotificationAsRead]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err; // Let the NotificationsList handle the error
    }
  }, [markAllNotificationsAsRead]);

  // Handle hide notification
  const handleHideNotification = useCallback(async (notificationId) => {
    try {
      const res = await api.put(`/notifications/${notificationId}/hide`);
      if (res.data.success) {
        await fetchNotifications();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error hiding notification:', err);
      throw err; // Let the NotificationsList handle the error
    }
  }, [fetchNotifications]);

  // Handle delete notification
  const handleDeleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      await fetchNotifications();
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err; // Let the NotificationsList handle the error
    }
  }, [fetchNotifications]);

  // Handle error state
  if (error) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Alert variant="danger">
            <Alert.Heading>Error loading notifications</Alert.Heading>
            <p>{error}</p>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={loadNotifications}
              className="mt-2"
            >
              Retry
            </Button>
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <NotificationsList
        notifications={notifications}
        unreadCount={localUnreadCount}
        isLoading={isLoading || contextLoading}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onHideNotification={handleHideNotification}
        onDeleteNotification={handleDeleteNotification}
      />
    </Container>
  );
};

export default ReporterNotifications;

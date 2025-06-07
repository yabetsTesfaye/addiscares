import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, ListGroup, Spinner, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import { FaBell, FaCheck, FaSync, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  
  // Handle real-time notification updates
  const handleNotificationUpdate = useCallback((event, data) => {
    switch (event) {
      case 'new':
        setNotifications(prev => [data, ...prev].slice(0, 50)); // Keep max 50 notifications
        setUnreadCount(prev => prev + 1);
        break;
      case 'update':
        setNotifications(prev => 
          prev.map(n => n._id === data._id ? { ...n, ...data } : n)
        );
        if (data.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        break;
      case 'delete':
        setNotifications(prev => {
          const deleted = prev.find(n => n._id === data);
          if (deleted && !deleted.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
          return prev.filter(n => n._id !== data);
        });
        break;
      default:
        break;
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    setError(null);
    try {
      // Connect to the notification service
      await notificationService.connect();
      
      // Fetch initial notifications
      const response = await notificationService.getNotifications({
        limit: 10,
        unreadOnly: false
      });
      
      setNotifications(response);
      
      // Get unread count
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark all as read');
    }
  }, [isAuthenticated, user]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId) => {
    if (!isAuthenticated || !user) return;
    
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark as read');
    }
  }, [isAuthenticated, user]);

  // Delete notification
  const handleDelete = useCallback(async (notificationId, e) => {
    e?.stopPropagation();
    
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => {
        const deleted = prev.find(n => n._id === notificationId);
        if (deleted && !deleted.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return prev.filter(n => n._id !== notificationId);
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  }, []);

  // Set up notification service on mount
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Initial fetch
    fetchNotifications();
    
    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribe(handleNotificationUpdate);
    
    // Clean up
    return () => {
      unsubscribe();
      notificationService.disconnect();
    };
  }, [isAuthenticated, user, fetchNotifications, handleNotificationUpdate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (show && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setShow(prev => !prev);
    
    // Mark all as read when opening the dropdown
    if (!show && unreadCount > 0) {
      handleMarkAllAsRead();
    }
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <OverlayTrigger
        placement="bottom"
        overlay={<Tooltip>Notifications</Tooltip>}
      >
        <Button 
          variant="link" 
          className={`position-relative p-0 ${show ? 'active' : ''}`}
          onClick={toggleDropdown}
          aria-label={`${unreadCount} unread notifications`}
          aria-expanded={show}
        >
          <FaBell size={20} className="text-dark" />
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unreadCount > 9 ? '9+' : unreadCount}
              <span className="visually-hidden">unread notifications</span>
            </span>
          )}
        </Button>
      </OverlayTrigger>

      {show && (
        <div className="dropdown-menu dropdown-menu-end p-0 shadow" style={{ width: '350px', display: 'block' }}>
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0 fw-bold">Notifications</h6>
            <div className="d-flex">
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 me-2 text-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchNotifications();
                }}
                disabled={loading}
                aria-label="Refresh notifications"
              >
                <FaSync className={loading ? 'fa-spin' : ''} />
              </Button>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 text-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAllAsRead();
                }}
                disabled={loading || unreadCount === 0}
                aria-label="Mark all as read"
              >
                <FaCheck />
              </Button>
            </div>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {error ? (
              <div className="text-center p-4 text-danger">
                <FaExclamationCircle className="mb-2" />
                <p className="mb-0">{error}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={fetchNotifications}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : loading ? (
              <div className="text-center p-4">
                <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted mb-0">No notifications yet</p>
                <small className="text-muted">We'll notify you when something new arrives</small>
              </div>
            ) : (
              <ListGroup variant="flush">
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </ListGroup>
            )}
          </div>
          
          <div className="p-2 border-top text-center">
            <a 
              href="/notifications" 
              className="text-decoration-none"
              onClick={() => setShow(false)}
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

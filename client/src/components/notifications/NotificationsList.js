import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Alert, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaTrash, FaCheck, FaBell, FaBellSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const notificationStyles = {
  unread: {
    borderLeft: '4px solid #0d6efd',
    backgroundColor: '#f8f9fa',
    transition: 'all 0.2s ease-in-out',
  },
  read: {
    borderLeft: '4px solid #e9ecef',
    backgroundColor: '#fff',
    transition: 'all 0.2s ease-in-out',
  },
  hover: {
    backgroundColor: '#f1f3f5',
    cursor: 'pointer',
    boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-1px)',
  },
  actions: {
    opacity: 0,
    transition: 'opacity 0.2s ease-in-out',
    display: 'flex',
    gap: '0.5rem',
  },
  actionsVisible: {
    opacity: 1,
  },
};

const NotificationsList = ({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onHideNotification,
  onDeleteNotification,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.readByUser) {
      await markAsRead(notification._id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      setIsMarkingRead(true);
      await onMarkAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    } finally {
      setIsMarkingRead(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setIsMarkingRead(true);
      await onMarkAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    } finally {
      setIsMarkingRead(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          Notifications
          {unreadCount > 0 && (
            <Badge bg="primary" className="ms-2">
              {unreadCount} unread
            </Badge>
          )}
        </h2>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0 || isMarkingRead}
        >
          <FaCheck className="me-1" /> Mark all as read
        </Button>
      </div>
      
      {notifications.length === 0 ? (
        <Alert variant="info" className="text-center">
          <FaBellSlash className="me-2" />
          You don't have any notifications yet.
        </Alert>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <Card 
              key={notification._id}
              className={`mb-3 ${!notification.readByUser ? 'border-primary' : ''}`}
              style={{
                ...(notification.readByUser ? notificationStyles.read : notificationStyles.unread),
                ...(hoveredId === notification._id ? notificationStyles.hover : {})
              }}
              onMouseEnter={() => setHoveredId(notification._id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleNotificationClick(notification)}
            >
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <div style={{ flex: 1 }}>
                    <h5 className="mb-1">
                      {notification.title}
                      {!notification.readByUser && (
                        <span className="ms-2">
                          <FaBell className="text-primary" size={14} />
                        </span>
                      )}
                    </h5>
                    <p className="mb-1 text-muted">{notification.message}</p>
                    <small className="text-muted">
                      {new Date(notification.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <div 
                    className="d-flex align-items-start"
                    style={{
                      ...notificationStyles.actions,
                      ...(hoveredId === notification._id ? notificationStyles.actionsVisible : {})
                    }}
                  >
                    {!notification.readByUser && (
                      <Button 
                        variant="outline-success" 
                        size="sm" 
                        className="me-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                        title="Mark as read"
                      >
                        <FaEye />
                      </Button>
                    )}
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onHideNotification(notification._id);
                      }}
                      title="Hide notification"
                    >
                      <FaEyeSlash />
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this notification?')) {
                          onDeleteNotification(notification._id);
                        }
                      }}
                      title="Delete notification"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    {notification.sender?.name ? `From: ${notification.sender.name}` : 'System Notification'}
                  </small>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsList;

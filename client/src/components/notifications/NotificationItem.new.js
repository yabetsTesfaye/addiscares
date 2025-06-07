import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { 
  Card, 
  Badge, 
  Button, 
  OverlayTrigger, 
  Tooltip,
  Dropdown
} from 'react-bootstrap';
import { 
  FaCheck, 
  FaTrashAlt, 
  FaEllipsisV, 
  FaExclamationCircle,
  FaInfoCircle,
  FaBell,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import './NotificationItem.css';

const NotificationItem = React.memo(({ notification, onMarkAsRead, onDelete }) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const menuRef = useRef(null);
  const itemRef = useRef(null);
  
  // Determine notification icon based on type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'alert':
        return <FaExclamationCircle className="text-warning" />;
      case 'info':
      default:
        return <FaInfoCircle className="text-primary" />;
    }
  };

  // Format relative time (e.g., "2 hours ago")
  const formatTime = useCallback((dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }, []);

  // Handle mark as read
  const handleMarkAsRead = useCallback(async (e) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (notification.read) return;
    
    try {
      setIsMarkingAsRead(true);
      setError(null);
      
      await onMarkAsRead(notification._id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark as read');
    } finally {
      setIsMarkingAsRead(false);
    }
  }, [notification._id, notification.read, onMarkAsRead]);

  // Handle delete
  const handleDelete = useCallback(async (e) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      setIsDeleting(true);
      setError(null);
      
      await onDelete(notification._id);
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
      setIsDeleting(false);
    }
  }, [notification._id, onDelete]);

  // Mark as read when hovered for 2 seconds
  useEffect(() => {
    if (!notification.read && isHovered && !isMenuOpen) {
      const timer = setTimeout(() => {
        handleMarkAsRead();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isHovered, isMenuOpen, notification.read, handleMarkAsRead]);

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          itemRef.current && !itemRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleClick = useCallback(() => {
    // Mark as read if not already read
    if (!notification.read) {
      handleMarkAsRead();
    }
    
    // If there's a link, it will be handled by the Link component
    // Otherwise, no action is needed here as the notification is already read
  }, [notification.read, handleMarkAsRead]);

  // Render notification content
  const renderContent = () => (
    <div className="d-flex align-items-start">
      <div className="flex-shrink-0 me-2 mt-1">
        {notification.sender?.avatar ? (
          <img 
            src={notification.sender.avatar} 
            alt={notification.sender.name || 'User'}
            className="rounded-circle"
            width="36"
            height="36"
          />
        ) : (
          <div className="d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle" 
               style={{ width: '36px', height: '36px' }}>
            {notification.sender?.name ? notification.sender.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
      </div>
      
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-start">
          <h6 className="mb-1 fw-semibold">
            {notification.title}
            {!notification.read && (
              <span className="ms-2">
                <Badge bg="primary" pill className="ms-1">New</Badge>
              </span>
            )}
          </h6>
          <small className="text-muted">
            {formatTime(notification.createdAt)}
          </small>
        </div>
        
        <p className="mb-1 text-muted">
          {notification.message}
        </p>
        
        {notification.link && (
          <div className="mt-1">
            <Link 
              to={notification.link} 
              className="text-primary text-decoration-none d-inline-flex align-items-center"
              onClick={(e) => e.stopPropagation()}
            >
              View details <FaExternalLinkAlt className="ms-1" size={10} />
            </Link>
          </div>
        )}
        
        {error && (
          <div className="text-danger small mt-1">
            <FaExclamationCircle className="me-1" />
            {error}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card 
      ref={itemRef}
      className={`notification-item mb-2 border-0 rounded-3 ${!notification.read ? 'bg-light' : 'bg-white'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="button"
      aria-label={`Notification: ${notification.title}`}
      tabIndex={0}
    >
      <Card.Body className="p-3 position-relative">
        {renderContent()}
        
        <div className="position-absolute" style={{ top: '0.5rem', right: '0.5rem' }}>
          <Dropdown show={isMenuOpen} align="end">
            <Dropdown.Toggle 
              variant="link" 
              className="p-0 text-muted"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              aria-label="Notification actions"
            >
              <FaEllipsisV />
            </Dropdown.Toggle>
            
            <Dropdown.Menu ref={menuRef} onClick={(e) => e.stopPropagation()}>
              {!notification.read && (
                <Dropdown.Item 
                  onClick={handleMarkAsRead}
                  disabled={isMarkingAsRead}
                >
                  <FaCheck className="me-2" />
                  {isMarkingAsRead ? 'Marking...' : 'Mark as read'}
                </Dropdown.Item>
              )}
              <Dropdown.Item 
                onClick={handleDelete}
                className="text-danger"
                disabled={isDeleting}
              >
                <FaTrashAlt className="me-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Card.Body>
    </Card>
  );
});

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['info', 'alert', 'success', 'warning']),
    read: PropTypes.bool.isRequired,
    createdAt: PropTypes.string.isRequired,
    link: PropTypes.string,
    sender: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      avatar: PropTypes.string
    })
  }).isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default NotificationItem;

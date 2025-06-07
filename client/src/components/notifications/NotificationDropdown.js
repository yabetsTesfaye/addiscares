import React, { useState, useEffect, useRef } from 'react';
import { 
  Dropdown, 
  Badge, 
  Button, 
  ListGroup, 
  Spinner,
  Overlay
} from 'react-bootstrap';
import { 
  FiBell, 
  FiCheck, 
  FiTrash2, 
  FiSettings,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    fetchNotifications,
    preferences
  } = useNotifications();

  const [show, setShow] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const target = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          target.current && !target.current.contains(event.target)) {
        setShow(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show empty state after loading if no notifications
  useEffect(() => {
    if (!isLoading && notifications.length === 0) {
      const timer = setTimeout(() => setShowEmptyState(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowEmptyState(false);
    }
  }, [isLoading, notifications]);

  const handleToggle = (isOpen) => {
    setShow(isOpen);
    if (isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
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
          <FaBell size={20} />
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

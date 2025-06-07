import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Button, ButtonGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../utils/api';
import Spinner from '../../components/layout/Spinner';
import { AuthContext } from '../../context/AuthContext';
import { FaEyeSlash, FaTrash, FaCheck } from 'react-icons/fa'; // Import icons

const GovNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: authUser, markNotificationAsRead, fetchUnreadCount, setUnreadCount } = useContext(AuthContext);
  const user = authUser || {}; // Ensure user is always an object

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // Get user-specific notifications
        const res = await api.get('/notifications');
        setNotifications(res.data);
        await fetchUnreadCount(); // Update unread count when notifications are fetched
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. ' + (err.response?.data?.msg || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [fetchUnreadCount]);

  const markAsRead = async (id) => {
    if (!id) {
      console.error('Cannot mark notification as read: No ID provided');
      return false;
    }
    
    try {
      const success = await markNotificationAsRead(id);
      
      if (success) {
        // Update notifications list with the updated notification
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif._id === id ? { ...notif, read: true, readByUser: true } : notif
          )
        );
        
        toast.success('Notification marked as read');
      } else {
        toast.error('Failed to mark notification as read');
      }
      
      return success;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
      return false;
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Only mark as read if the notification is clicked
      if (!notification.readByUser) {
        await markAsRead(notification._id);
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
      toast.error('Failed to update notification status');
    }
  };

  const handleMarkAsRead = async (e, notification) => {
    e.stopPropagation();
    await markAsRead(notification._id);
  };

  const handleHideNotification = async (e, notification) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${notification._id}/hide`);
      setNotifications(notifications.filter(n => n._id !== notification._id));
      toast.success('Notification hidden');
    } catch (err) {
      console.error('Error hiding notification:', err);
      toast.error(err.response?.data?.message || 'Failed to hide notification');
    }
  };
  
  const handleDeleteNotification = async (e, notification) => {
    e.stopPropagation();
    
    if (!notification._id) {
      console.error('Cannot delete notification: No ID provided');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await api.delete(`/notifications/${notification._id}`);
        
        // Remove the notification from the list
        setNotifications(notifications.filter(n => n._id !== notification._id));
        
        // Update unread count if the notification was unread
        if (!notification.readByUser) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        
        toast.success('Notification deleted');
      } catch (err) {
        console.error('Error deleting notification:', err);
        toast.error(err.response?.data?.message || 'Failed to delete notification');
      }
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <Container>
      <h1 className="mb-4">Notifications</h1>
      
      {error ? (
        <Alert variant="danger">{error}</Alert>
      ) : notifications.length === 0 ? (
        <Card>
          <Card.Body className="text-center">
            <p className="mb-0">You have no notifications.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          <Col>
            <Card key="notifications-card">
              <Card.Body>
                {notifications.map((notification) => (
                  <div 
                    key={notification._id}
                    className={`notification-item p-3 mb-3 rounded ${!notification.read ? 'bg-light' : 'border'}`}
                    onClick={() => handleNotificationClick(notification)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h5 className="mb-1">
                          {!notification.readByUser && (
                            <Badge bg="primary" className="me-2">New</Badge>
                          )}
                          {notification.title}
                        </h5>
                        <p className="mb-1">{notification.message}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {new Date(notification.createdAt).toLocaleString()}
                          </small>
                          {notification.sender && (
                            <small className="text-muted">
                              From: {notification.sender.name || 'System'}
                            </small>
                          )}
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ButtonGroup size="sm" className="ms-2">
                          {!notification.readByUser && (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              title="Mark as read"
                              onClick={(e) => handleMarkAsRead(e, notification)}
                              className="me-1"
                            >
                              <FaCheck />
                            </Button>
                          )}
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            title="Hide notification"
                            onClick={(e) => handleHideNotification(e, notification)}
                            className="me-1"
                          >
                            <FaEyeSlash />
                          </Button>
                          {(user && notification.sender && notification.sender._id === user._id) || (user && user.role === 'admin') ? (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              title="Delete notification"
                              onClick={(e) => handleDeleteNotification(e, notification)}
                            >
                              <FaTrash />
                            </Button>
                          ) : null}
                        </ButtonGroup>
                      </div>
                    </div>
                    {notification.reportId && (
                      <div className="mt-2">
                        <Link 
                          to={`/government/report/${notification.reportId._id || notification.reportId}`}
                          className="btn btn-sm btn-outline-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Related Report
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default GovNotifications;

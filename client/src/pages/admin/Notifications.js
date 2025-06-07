import React, { useState, useContext, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Badge, 
  ButtonGroup, 
  Alert, 
  Spinner as BootstrapSpinner, 
  Modal, 
  Form,
  Nav,
  ListGroup
} from 'react-bootstrap';
import { FaTrash, FaBell, FaBellSlash, FaPaperPlane, FaUsers, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';

const AdminNotifications = () => {
  const { fetchUnreadCount, user, markNotificationAsRead, setUnreadCount } = useContext(AuthContext);
  
  // State for notifications and UI
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [receivedNotifications, setReceivedNotifications] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  
  // State for modals
  const [showSendModal, setShowSendModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientId: '',
    reportId: ''
  });
  
  const [bulkFormData, setBulkFormData] = useState({
    title: '',
    message: '',
    role: 'reporter',
    reportId: ''
  });
  
  // Aliases for form data and handlers
  const individualNotificationData = formData;
  const bulkNotificationData = bulkFormData;
  const setShowIndividualModal = setShowSendModal;

  // Fetch notifications and data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data...');
        
        // Fetch received notifications
        const [receivedRes, sentRes, usersRes, reportsRes] = await Promise.all([
          api.get('/notifications'),
          api.get('/notifications/sent'),
          api.get('/users'),
          api.get('/reports')
        ]);
        
        console.log('API Responses:', {
          received: receivedRes.data,
          sent: sentRes.data,
          users: usersRes.data,
          reports: reportsRes.data
        });
        
        // Process received notifications to set readByUser flag
        const processedReceived = (receivedRes.data || []).map(notification => {
          // Check if current user has read this notification
          const readByUser = notification.readBy && notification.readBy.some(entry => {
            if (!entry.user) return false;
            const entryId = entry.user._id ? entry.user._id.toString() : entry.user.toString();
            const userIdStr = user._id.toString();
            return entryId === userIdStr;
          });
          
          // Also check the global read flag for direct notifications
          const isRead = notification.read || readByUser;
          
          return {
            ...notification,
            readByUser: readByUser || false,
            read: isRead
          };
        });
        
        setReceivedNotifications(processedReceived);
        setSentNotifications(sentRes.data || []);
        setUsers(usersRes.data || []);
        setReports(reportsRes.data || []);
        
        // Update unread count
        const countRes = await api.get('/notifications/unread-count');
        console.log('Unread count:', countRes.data.count);
        setUnreadCount(countRes.data.count);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
          console.error('Response headers:', err.response.headers);
        }
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [setUnreadCount]);

  const handleMarkAsRead = async (id) => {
    try {
      const success = await markNotificationAsRead(id);
      
      if (success) {
        // Update the notification in the list
        setReceivedNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification._id === id
              ? { ...notification, read: true, readByUser: true }
              : notification
          )
        );
        
        toast.success('Notification marked as read');
      } else {
        toast.error('Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.readByUser) {
        await handleMarkAsRead(notification._id);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
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
        
        // Remove from both received and sent lists
        setReceivedNotifications(prev => prev.filter(n => n._id !== notification._id));
        setSentNotifications(prev => prev.filter(n => n._id !== notification._id));
        
        // Only update unread count if this was an unread received notification
        if (!notification.readByUser && activeTab === 'received') {
          const res = await api.get('/notifications/unread-count');
          setUnreadCount(res.data.count);
        }
        
        toast.success('Notification deleted successfully');
      } catch (err) {
        console.error('Error deleting notification:', err);
        toast.error(err.response?.data?.message || 'Failed to delete notification');
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersRes = await api.get('/users');
        // Filter to only active users
        const activeUsers = usersRes.data.filter(user => user.status === 'active');
        setUsers(activeUsers);
        
        // Fetch reports
        const reportsRes = await api.get('/reports');
        setReports(reportsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const handleFormDataChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleBulkFormDataChange = (e) => {
    setBulkFormData({ 
      ...bulkFormData, 
      [e.target.name]: e.target.value 
    });
  };

  // Alias handlers for form changes
  const handleIndividualNotificationChange = handleFormDataChange;
  const handleBulkNotificationChange = handleBulkFormDataChange;

  const sendIndividualNotification = async () => {
    try {
      await api.post('/notifications', formData);
      
      // Reset form and close modal
      setFormData({
        title: '',
        message: '',
        recipientId: '',
        reportId: ''
      });
      setShowSendModal(false);
      
      // Refresh notifications list
      const res = await api.get('/notifications');
      setReceivedNotifications(res.data);
      
      toast.success('Notification sent successfully!');
    } catch (err) {
      console.error('Error sending notification:', err);
      toast.error(err.response?.data?.message || 'Failed to send notification');
    }
  };

  const sendBulkNotification = async () => {
    try {
      // Ensure role is one of the allowed values
      const allowedRoles = ['reporter', 'government', 'admin'];
      const role = allowedRoles.includes(bulkFormData.role) 
        ? bulkFormData.role 
        : 'reporter'; // Default to 'reporter' if invalid
      
      // Create a properly formatted request payload
      const payload = {
        title: bulkFormData.title.trim(),
        message: bulkFormData.message.trim(),
        role: role // Use the validated role
      };
      
      // Only include reportId if it's a valid non-empty string
      if (bulkFormData.reportId && typeof bulkFormData.reportId === 'string' && bulkFormData.reportId.trim() !== '') {
        payload.reportId = bulkFormData.reportId.trim();
      }
      
      console.log('Sending bulk notification with payload:', JSON.stringify(payload, null, 2));
      
      const response = await api.post('/notifications/bulk', payload, {
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Bulk notification response status:', response.status);
      
      // If there's a validation error, log the details
      if (response.status === 400 && response.data && response.data.errors) {
        console.error('Validation errors:', response.data.errors);
      }
      
      console.log('Bulk notification response:', response);
      
      // Reset form and close modal
      setBulkFormData({
        title: '',
        message: '',
        role: 'reporter',
        reportId: ''
      });
      setShowBulkModal(false);
      
      // Refresh notifications list
      const res = await api.get('/notifications');
      setReceivedNotifications(res.data);
      
      // Refresh unread count
      if (fetchUnreadCount) {
        await fetchUnreadCount();
      }
      
      toast.success('Bulk notifications sent successfully!');
    } catch (err) {
      console.error('Error sending bulk notifications:', {
        message: err.message,
        response: {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          headers: err.response?.headers
        },
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data
        }
      });
      
      let errorMessage = 'Failed to send bulk notifications';
      
      if (err.response?.data?.errors?.length > 0) {
        errorMessage = err.response.data.errors.map(e => e.msg).join(', ');
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    }
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="text-center my-4">
      <BootstrapSpinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </BootstrapSpinner>
      <p>Loading notifications...</p>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container>
      <h1 className="mb-4">Notifications Management</h1>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Send Notifications</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Container className="mt-4">
                  <Row className="mb-4">
                    <Col>
                      <h2>Notifications</h2>
                    </Col>
                    <Col className="text-end">
                      <Button variant="primary" onClick={() => setShowSendModal(true)} className="me-2">
                        Send Notification
                      </Button>
                      <Button variant="outline-primary" onClick={() => setShowBulkModal(true)}>
                        Bulk Notify
                      </Button>
                    </Col>
                  </Row>

                  <Nav variant="tabs" defaultActiveKey="received" className="mb-4" onSelect={setActiveTab}>
                    <Nav.Item>
                      <Nav.Link eventKey="received">
                        Received Notifications
                        {receivedNotifications.filter(n => !n.readByUser).length > 0 && (
                          <Badge bg="danger" className="ms-2">
                            {receivedNotifications.filter(n => !n.readByUser).length}
                          </Badge>
                        )}
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="sent">Sent Notifications ({sentNotifications.length})</Nav.Link>
                    </Nav.Item>
                  </Nav>

                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <Row>
                      <Col>
                        <Card>
                          <Card.Body>
                            {activeTab === 'received' ? (
                              <>
                                {receivedNotifications.length === 0 ? (
                                  <Alert variant="info">No received notifications found</Alert>
                                ) : (
                                  <Table hover responsive>
                                    <thead>
                                      <tr>
                                        <th>Title</th>
                                        <th>From</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {receivedNotifications.map(notification => (
                                        <tr 
                                          key={notification._id}
                                          className={!notification.readByUser ? 'table-active' : ''}
                                          style={{ cursor: 'pointer' }}
                                          onClick={() => handleNotificationClick(notification)}
                                        >
                                          <td>
                                            <div className="d-flex align-items-center">
                                              {!notification.readByUser && (
                                                <span className="badge bg-primary me-2">New</span>
                                              )}
                                              {notification.title}
                                            </div>
                                          </td>
                                          <td>{notification.sender?.name || 'System'}</td>
                                          <td>
                                            <Badge bg={notification.readByUser ? 'secondary' : 'primary'}>
                                              {notification.readByUser ? 'Read' : 'Unread'}
                                            </Badge>
                                          </td>
                                          <td>{new Date(notification.createdAt).toLocaleString()}</td>
                                          <td>
                                            <Button 
                                              variant="outline-danger" 
                                              size="sm"
                                              title="Delete notification"
                                              onClick={(e) => handleDeleteNotification(e, notification)}
                                            >
                                              <FaTrash />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                )}
                              </>
                            ) : (
                              // Sent Notifications Tab
                              <>
                                {sentNotifications.length === 0 ? (
                                  <Alert variant="info">No sent notifications found</Alert>
                                ) : (
                                  <Table hover responsive>
                                    <thead>
                                      <tr>
                                        <th>Title</th>
                                        <th>Recipients</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sentNotifications.map(notification => (
                                        <tr key={notification._id}>
                                          <td>{notification.title}</td>
                                          <td>
                                            {notification.recipient?.name || 'All Users'} 
                                            <span className="text-muted ms-1">
                                              ({notification.recipient?.role || 
                                               (notification.recipients?.map(r => r.role).filter(Boolean).join(', ')) || 
                                               'broadcast'})
                                            </span>
                                          </td>
                                          <td>{new Date(notification.createdAt).toLocaleString()}</td>
                                          <td>
                                            <Button 
                                              variant="outline-danger" 
                                              size="sm"
                                              title="Delete notification"
                                              onClick={(e) => handleDeleteNotification(e, notification)}
                                            >
                                              <FaTrash />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                )}
                              </>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}
                </Container>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Individual Notification Modal */}
      <Modal show={showSendModal} onHide={() => setShowSendModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Send Individual Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="individualTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={individualNotificationData.title}
                onChange={handleIndividualNotificationChange}
                placeholder="Enter notification title"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="individualMessage">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="message"
                value={individualNotificationData.message}
                onChange={handleIndividualNotificationChange}
                placeholder="Enter notification message"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="individualRecipient">
              <Form.Label>Recipient</Form.Label>
              <Form.Select
                name="recipientId"
                value={individualNotificationData.recipientId}
                onChange={handleIndividualNotificationChange}
                required
              >
                <option value="">-- Select Recipient --</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email}) - {user.role}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="individualReport">
              <Form.Label>Related Report (Optional)</Form.Label>
              <Form.Select
                name="reportId"
                value={individualNotificationData.reportId}
                onChange={handleIndividualNotificationChange}
              >
                <option value="">-- No Related Report --</option>
                {reports.map(report => (
                  <option key={report._id} value={report._id}>
                    {report.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowIndividualModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={sendIndividualNotification}
            disabled={
              !individualNotificationData.title || 
              !individualNotificationData.message || 
              !individualNotificationData.recipientId
            }
          >
            Send Notification
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Bulk Notification Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Send Bulk Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="bulkTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={bulkNotificationData.title}
                onChange={handleBulkNotificationChange}
                placeholder="Enter notification title"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="bulkMessage">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="message"
                value={bulkNotificationData.message}
                onChange={handleBulkNotificationChange}
                placeholder="Enter notification message"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="bulkRole">
              <Form.Label>Recipient Role</Form.Label>
              <Form.Select
                name="role"
                value={bulkNotificationData.role}
                onChange={handleBulkNotificationChange}
                required
              >
                <option value="all">All Users</option>
                <option value="reporter">All Reporters</option>
                <option value="government">All Government Officials</option>
                <option value="admin">All Admins</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Notification will be sent to all active users with the selected role.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="bulkReport">
              <Form.Label>Related Report (Optional)</Form.Label>
              <Form.Select
                name="reportId"
                value={bulkNotificationData.reportId}
                onChange={handleBulkNotificationChange}
              >
                <option value="">-- No Related Report --</option>
                {reports.map(report => (
                  <option key={report._id} value={report._id}>
                    {report.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={sendBulkNotification}
            disabled={
              !bulkNotificationData.title || 
              !bulkNotificationData.message || 
              !bulkNotificationData.role
            }
          >
            Send Bulk Notifications
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminNotifications;

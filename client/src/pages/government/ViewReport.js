import { useState, useEffect, useContext } from 'react';
import { 
  Container, 
  Card, 
  Badge, 
  Button, 
  Form, 
  Alert, 
  Row, 
  Col, 
  Modal 
} from 'react-bootstrap';
import { FaExpand } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';

const GovViewReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [statusData, setStatusData] = useState({
    status: 'pending'
  });
  const { id } = useParams();
  const navigate = useNavigate();
  // Get the current user from auth context
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Validate that ID is a string and a valid MongoDB ObjectId
        if (!id || typeof id !== 'string') {
          console.error('Invalid report ID:', id);
          setError('Invalid report ID. Please check the URL and try again.');
          setLoading(false);
          return;
        }

        // Validate MongoDB ObjectId format (24 character hex string)
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
          console.error('ID is not a valid MongoDB ObjectId format:', id);
          setError('Invalid report ID format. Please check the URL and try again.');
          setLoading(false);
          return;
        }


        // Fetch report data
        const reportRes = await api.get(`/reports/${id}`);
        setReport(reportRes.data);
        
        // Update statusData with current report status
        setStatusData({
          status: reportRes.data.status
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load report data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCommentChange = (e) => {
    setComment(e.target.value);
    if (commentError) setCommentError(null);
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await api.delete(`/reports/${id}/comments/${commentId}`);
        // Update the report to remove the deleted comment
        setReport(prevReport => ({
          ...prevReport,
          comments: prevReport.comments.filter(comment => comment._id !== commentId)
        }));
      } catch (err) {
        console.error('Error deleting comment:', err);
        setError(err.response?.data?.msg || 'Failed to delete comment');
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setCommentError('Comment cannot be empty');
      return;
    }
    
    setSubmitting(true);
    setCommentError(null);
    
    try {
      // Save the comment
      await api.post(`/reports/${id}/comment`, { text: comment });
      
      // Fetch the updated report to get the latest data including the new comment
      const updatedReport = await api.get(`/reports/${id}`);
      setReport(updatedReport.data);
      
      // Clear the comment input
      setComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.response?.data?.msg || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (e) => {
    setStatusData({ ...statusData, [e.target.name]: e.target.value });
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    
    if (!statusData.status) {
      setError('Please select a status');
      return;
    }
    
    try {
      console.log('Updating report status to:', statusData.status);
      
      // Only send the status field
      const res = await api.put(`/reports/${id}/status`, {
        status: statusData.status
      });
      setReport(res.data);
      setShowStatusModal(false);
      
      // Show success message
      alert('Report status updated successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.msg || 'Failed to update status');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending': return 'bg-warning';
      case 'in_progress': return 'bg-info';
      case 'resolved': return 'bg-success';
      case 'escalated': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (error || !report) {
    return (
      <Container>
        <Alert variant="danger">{error || 'Report not found'}</Alert>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/government/reports')}
        >
          Back to Reports
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{report.title}</h1>
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/government/reports')}
        >
          Back to Reports
        </Button>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={8}>
              <div className="mb-3">
                <Badge className={`${getStatusBadgeClass(report.status)} px-3 py-2`}>
                  Status: {report.status.replace('_', ' ')}
                </Badge>
                {report.urgency > 0 && (
                  <Badge className="bg-primary ms-2 px-3 py-2">
                    Urgency: {report.urgency}
                  </Badge>
                )}
              </div>
              
              <p><strong>Location:</strong> {report.location}</p>
              <p><strong>Category:</strong> {report.category.replace('_', ' ')}</p>
              <p><strong>Reported by:</strong> {report.reporter ? `${report.reporter.name} (${report.reporter.email})` : 'Unknown'}</p>
              <p><strong>Date Reported:</strong> {new Date(report.createdAt).toLocaleString()}</p>
              
              {report.assignedTo && (
                <p><strong>Assigned To:</strong> {report.assignedTo.name}</p>
              )}
              
              <div className="mt-4">
                <h5>Description</h5>
                <p>{report.description}</p>
              </div>
              
              <Button 
                variant="primary" 
                onClick={() => setShowStatusModal(true)}
                className="mt-3"
              >
                Update Status
              </Button>
            </Col>
            
            <Col md={4}>
              {report.images && report.images.length > 0 ? (
                <div>
                  <h5 className="mb-3">Images</h5>
                  <div className="d-flex flex-wrap gap-3">
                    {report.images.map((image, index) => (
                      <div 
                        key={index}
                        className="position-relative d-inline-block"
                        style={{ maxWidth: '200px' }}
                      >
                        <div className="position-relative">
                          <img 
                            src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                            alt={`Report documentation ${index + 1}`}
                            className="img-thumbnail img-fluid"
                            style={{ 
                              cursor: 'pointer', 
                              transition: 'transform 0.2s',
                              maxHeight: '200px',
                              objectFit: 'cover',
                              width: '100%',
                              height: 'auto'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => {
                              setSelectedImage(image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`);
                              setShowImageModal(true);
                            }}
                          />
                          <div 
                            className="position-absolute top-0 end-0 m-1 bg-dark bg-opacity-50 rounded-circle p-1"
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`);
                              setShowImageModal(true);
                            }}
                          >
                            <FaExpand className="text-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-light rounded">
                  <p className="text-muted mb-0">No images available</p>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Comments & Updates</h5>
        </Card.Header>
        <Card.Body>
          {report.comments && report.comments.length > 0 ? (
            <div>
              {report.comments.map((comment, index) => (
                <div key={index} className="mb-3 p-3 bg-light rounded position-relative">
                  <div className="d-flex justify-content-between">
                    <strong>{comment.user?.name || 'User'}</strong>
                    <small className="text-muted">
                      {new Date(comment.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <p className="mb-0 mt-2">{comment.text}</p>
                  
                  {/* Delete button - only show for the comment's author or admin */}
                  {comment.user?._id === user?.id && (
                    <button 
                      className="btn btn-sm btn-outline-danger position-absolute" 
                      style={{ bottom: '10px', right: '10px' }}
                      onClick={() => handleDeleteComment(comment._id)}
                      title="Delete comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No comments yet</p>
          )}
          
          <Form onSubmit={handleCommentSubmit} className="mt-4">
            <Form.Group className="mb-3" controlId="comment">
              <Form.Label>Add an Official Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={comment}
                onChange={handleCommentChange}
                placeholder="Enter your official comment or update"
                disabled={submitting}
              />
              {commentError && (
                <div className="text-danger mt-1">{commentError}</div>
              )}
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Report Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleStatusSubmit}>
            <Form.Group className="mb-3" controlId="status">
              <Form.Label>Update Status</Form.Label>
              <Form.Select
                name="status"
                value={statusData.status}
                onChange={handleStatusChange}
                required
              >
                <option value="">-- Select Status --</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowStatusModal(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={!statusData.status}
              >
                Update Status
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Image Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton closeVariant="white" className="bg-dark text-white">
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 d-flex justify-content-center bg-dark">
          <img 
            src={selectedImage} 
            alt="Full size preview" 
            className="img-fluid"
            style={{ maxHeight: '70vh', objectFit: 'contain' }}
          />
        </Modal.Body>
        <Modal.Footer className="bg-dark text-white">
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default GovViewReport;

import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Badge, Button, Form, Alert, Row, Col, Modal } from 'react-bootstrap';
import { FaExpand } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';

const ViewReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        setReport(res.data);
        
        // Check if user has already voted
        const userComment = res.data.comments.find(
          comment => comment.user === user.id
        );
        if (userComment) {
          setVoted(true);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report');
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, user.id]);

  const handleCommentChange = (e) => {
    setComment(e.target.value);
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
      const res = await api.post(`/reports/${id}/comment`, { text: comment });
      // Refresh the report to get the latest comments
      const updatedReport = await api.get(`/reports/${id}`);
      setReport(updatedReport.data);
      setComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      setCommentError(err.response?.data?.msg || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async () => {
    if (voted) return;
    
    try {
      const res = await api.put(`/reports/${id}/vote`);
      setReport(res.data);
      setVoted(true);
    } catch (err) {
      console.error('Error voting:', err);
      setError(err.response?.data?.msg || 'Failed to vote');
    }
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
          onClick={() => navigate('/reporter/reports')}
        >
          Back to Reports
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">{report.title}</h1>
        </div>
        <div>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/reporter/reports')}
            size="sm"
          >
            Back to Reports
          </Button>
        </div>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={8}>
              <div className="mb-3">
                <Badge className={`${getStatusBadgeClass(report?.status)} px-3 py-2`}>
                  Status: {report?.status?.replace('_', ' ') || 'N/A'}
                </Badge>
                {report.urgency > 0 && (
                  <Badge className="bg-primary ms-2 px-3 py-2">
                    Urgency: {report.urgency}
                  </Badge>
                )}
              </div>
              
              <p><strong>Location:</strong> {report?.location || 'N/A'}</p>
              <p><strong>Category:</strong> {report?.category?.replace('_', ' ') || 'N/A'}</p>
              <p><strong>Reported by:</strong> {report?.reporter?.name || 'Unknown'}</p>
              <p><strong>Date Reported:</strong> {report?.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
              
              {report.assignedTo && (
                <p><strong>Assigned To:</strong> {report.assignedTo.name}</p>
              )}
              
              <div className="mt-4">
                <h5>Description</h5>
                <p>{report.description}</p>
              </div>
              
              {!voted && (
                <Button 
                  variant="primary" 
                  className="mt-3"
                  onClick={handleVote}
                >
                  Vote on Urgency
                </Button>
              )}
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
                            src={image.startsWith('http') ? image : (image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`)}
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
                              setSelectedImage(image.startsWith('http') ? image : (image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`));
                              setShowImageModal(true);
                            }}
                          />
                          <div 
                            className="position-absolute top-0 end-0 m-1 bg-dark bg-opacity-50 rounded-circle p-1"
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(image.startsWith('http') ? image : (image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`));
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
                <div key={comment._id || index} className="mb-3 p-3 bg-light rounded position-relative">
                  <div className="d-flex justify-content-between">
                    <strong>{(comment.user && (comment.user.name || comment.user.username)) || 'User'}</strong>
                    <small className="text-muted">
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Just now'}
                    </small>
                  </div>
                  <p className="mb-0 mt-2">{comment.text || comment.comment || 'No content'}</p>
                  
                  {/* Delete button - only show for the comment's author */}
                  {comment.user._id === user.id && (
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
              <Form.Label>Add a Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={comment}
                onChange={handleCommentChange}
                placeholder="Enter your comment"
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

      {/* Image Preview Modal */}
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

export default ViewReport;

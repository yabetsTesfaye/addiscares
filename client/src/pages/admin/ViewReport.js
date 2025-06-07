import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { FaExpand } from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../utils/api';

const AdminViewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState('');
  const [users, setUsers] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // Make sure id is a string and not an object
        const reportId = id && id._id ? id._id : id;
        
        // First fetch the report
        const reportRes = await api.get(`/api/reports/${reportId}`);
        setReport(reportRes.data);
        setAssignedTo(reportRes.data.assignedTo?._id || '');
        setStatus(reportRes.data.status);
        
        // Then try to fetch government users (only admins can do this)
        try {
          const usersRes = await api.get('/api/users?role=government');
          setUsers(usersRes.data);
        } catch (usersError) {
          console.warn('Could not fetch users, proceeding without user list');
          setUsers([]);
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const reportId = id && id._id ? id._id : id;
      await api.put(`/api/reports/${reportId}`, { status: newStatus });
      setStatus(newStatus);
      toast.success('Report status updated');
    } catch (err) {
      console.error('Error updating report status:', err);
      toast.error('Failed to update report status');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      const reportId = id && id._id ? id._id : id;
      await api.put(`/api/reports/${reportId}`, { assignedTo });
      toast.success('Report assigned successfully');
    } catch (err) {
      console.error('Error assigning report:', err);
      toast.error('Failed to assign report');
    }
  };

  if (loading) {
    return <div className="text-center my-5">Loading report...</div>;
  }

  if (!report) {
    return <div className="alert alert-danger">Report not found</div>;
  }

  return (
    <div className="container mt-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2>{report.title}</h2>
          <span className={`badge bg-${report.urgency > 2 ? 'danger' : 'warning'} p-2`}>
            {report.urgency > 2 ? 'High Priority' : 'Normal Priority'}
          </span>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <h5>Description</h5>
            <p className="text-muted">{report.description}</p>
          </div>
          
          <div className="row mb-4">
            <div className="col-md-6">
              <h5>Details</h5>
              <p><strong>Category:</strong> {report.category}</p>
              <p><strong>Location:</strong> {report.location}</p>
              <p><strong>Reported by:</strong> {report.reporter?.name || 'Unknown'}</p>
              <p><strong>Reported on:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> {report.status}</p>
            </div>
            <div className="col-md-6">
              <h5>Status Update</h5>
              <select 
                className="form-select mb-3" 
                value={status}
                onChange={handleStatusChange}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>

              <form onSubmit={handleAssign}>
                <div className="mb-3">
                  <label htmlFor="assignTo" className="form-label">Assign to Government Official</label>
                  <select 
                    id="assignTo"
                    className="form-select"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">-- Select Official --</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">
                  Assign
                </button>
              </form>
            </div>
          </div>

          {report.images && report.images.length > 0 && (
            <div className="mb-4">
              <h5>Attachments</h5>
              <div className="d-flex flex-wrap gap-3">
                {report.images.map((image, index) => (
                  <div 
                    key={index}
                    className="position-relative"
                    style={{ width: '200px' }}
                  >
                    <div className="position-relative">
                      <img 
                        src={image.startsWith('http') ? image : (image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`)} 
                        alt={`Attachment ${index + 1}`}
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
          )}

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
        </div>
      </div>
    </div>
  );
};

export default AdminViewReport;

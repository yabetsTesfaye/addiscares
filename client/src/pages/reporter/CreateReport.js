import React, { useState, useContext } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';

const CreateReport = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'road'
  });
  const [images, setImages] = useState([]);
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  // Auth context is still needed for protected routes
  useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    setLoading(true);
    setError(null);
    
    try {
      // Create form data for file upload
      const reportData = new FormData();
      reportData.append('title', formData.title);
      reportData.append('description', formData.description);
      reportData.append('location', formData.location);
      reportData.append('category', formData.category);
      
      // Append each image file
      if (images && images.length > 0) {
        console.log('Uploading', images.length, 'images');
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          console.log('Adding image:', file.name, 'type:', file.type);
          reportData.append('images', file);
        }
      }
      
      // Configure headers for multipart/form-data
      const config = {
        headers: {
          'Accept': 'application/json',
        },
        // Important: Set this to handle the multipart/form-data properly
        transformRequest: [(data) => data]
      };
      
      console.log('Submitting report with images...');
      // Submit report (api utility already adds the auth token)
      const response = await api.post('/reports', reportData, config);
      console.log('Report submitted successfully:', response.data);
      
      setSuccess(true);
      setLoading(false);
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        location: '',
        category: 'road'
      });
      setImages([]);
      setValidated(false);
      
      // Redirect to reports page after short delay
      setTimeout(() => {
        navigate('/reporter/reports');
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.response?.data?.msg || 'Failed to submit report. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <img 
          src="/hazardreportingInaction.jpg" 
          alt="Hazard Reporting" 
          className="img-fluid rounded mb-3"
          style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }}
        />
        <h1>Report New Hazard</h1>
        <p className="text-muted">Help keep your community safe by reporting hazards</p>
      </div>
      
      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Report submitted successfully! Redirecting...</Alert>}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="title">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter a title for the hazard"
                disabled={loading}
              />
              <Form.Control.Feedback type="invalid">
                Please provide a title.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe the hazard in detail"
                disabled={loading}
              />
              <Form.Control.Feedback type="invalid">
                Please provide a description.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="location">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="Enter the location of the hazard"
                disabled={loading}
              />
              <Form.Control.Feedback type="invalid">
                Please provide a location.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="category">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="road">Road</option>
                <option value="building">Building</option>
                <option value="environment">Environment</option>
                <option value="public_service">Public Service</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="images">
              <Form.Label>Images (Optional)</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={handleImageChange}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                You can upload up to 5 images. Each image must be less than 5MB.
              </Form.Text>
            </Form.Group>
            
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/reporter/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateReport;

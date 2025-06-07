import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaMapMarkerAlt, FaCalendarAlt, FaExclamationTriangle, FaCheckCircle, FaClock, FaArrowRight } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentReports = async () => {
      try {
        setLoading(true);
        console.log('Fetching recent reports...');
        const response = await api.get('/api/reports/public?limit=3&sort=-createdAt');
        console.log('Fetched reports:', response.data);
        setRecentReports(Array.isArray(response.data) ? response.data.slice(0, 3) : []);
      } catch (err) {
        console.error('Error fetching recent reports:', err);
        setError('Failed to load recent reports. Using sample data.');
        // Fallback to sample data
        setRecentReports([
          {
            _id: '1',
            title: 'Broken Streetlight',
            description: 'Streetlight not working on Main Street',
            status: 'pending',
            location: 'Main Street',
            createdAt: new Date().toISOString(),
            image: 'https://via.placeholder.com/300x200?text=Broken+Streetlight'
          },
          {
            _id: '2',
            title: 'Pothole',
            description: 'Large pothole causing traffic issues',
            status: 'in-progress',
            location: 'Oak Avenue',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            image: 'https://via.placeholder.com/300x200?text=Pothole'
          },
          {
            _id: '3',
            title: 'Garbage Pileup',
            description: 'Garbage not collected for over a week',
            status: 'resolved',
            location: 'Pine Street',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            image: 'https://via.placeholder.com/300x200?text=Garbage+Pileup'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentReports();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <Badge bg="success"><FaCheckCircle className="me-1" /> Resolved</Badge>;
      case 'in-progress':
        return <Badge bg="warning" text="dark"><FaClock className="me-1" /> In Progress</Badge>;
      default:
        return <Badge bg="danger"><FaExclamationTriangle className="me-1" /> Pending</Badge>;
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Get user role and redirect to appropriate dashboard
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.role) {
        navigate(`/${user.role}/dashboard`);
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };



  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section py-5 bg-primary text-white">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold mb-4">Report and Track Community Issues in Addis Ababa</h1>
              <p className="lead mb-4">
                Make your voice heard and help improve your community by reporting issues that matter to you.
                Together, we can make Addis Ababa a better place to live.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Button 
                  variant="light" 
                  size="lg" 
                  onClick={handleGetStarted}
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started'} <FaArrowRight className="ms-2" />
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('recent-reports');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  View Recent Reports
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <img 
                src="https://via.placeholder.com/600x400?text=AddisCare" 
                alt="Community reporting" 
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Recent Reports Section */}
      <section id="recent-reports" className="py-5">
        <Container>
          <h2 className="text-center mb-5">Recently Reported Issues</h2>
          
          {error && (
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>Notice</Alert.Heading>
              <p>{error}</p>
            </Alert>
          )}
          
          {recentReports.length > 0 ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {recentReports.map((report) => (
                <Col key={report._id}>
                  <Card className="h-100 shadow-sm">
                    <div 
                      className="report-image" 
                      style={{
                        backgroundImage: `url(${report.image || 'https://via.placeholder.com/300x200?text=No+Image'})`,
                        height: '200px',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}
                    >
                      <div className="position-absolute top-0 end-0 m-2">
                        {getStatusBadge(report.status)}
                      </div>
                    </div>
                    <Card.Body>
                      <Card.Title>{report.title}</Card.Title>
                      <Card.Text className="text-muted">
                        {truncateText(report.description, 100)}
                      </Card.Text>
                      <div className="d-flex align-items-center text-muted small mb-2">
                        <FaMapMarkerAlt className="me-2" />
                        <span>{report.location || 'Location not specified'}</span>
                      </div>
                      <div className="d-flex align-items-center text-muted small">
                        <FaCalendarAlt className="me-2" />
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </Card.Body>
                    <Card.Footer className="bg-transparent border-top-0">
                      <Button 
                        variant="outline-primary" 
                        className="w-100"
                        onClick={() => {
                          if (isAuthenticated) {
                            navigate(`/reports/${report._id}`);
                          } else {
                            navigate('/login', { state: { from: `/reports/${report._id}` } });
                          }
                        }}
                      >
                        {isAuthenticated ? 'View Details' : 'Login to View'}
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-5">
              <p className="lead">No recent reports found. Be the first to report an issue!</p>
              <Button variant="primary" onClick={handleGetStarted}>
                {isAuthenticated ? 'Report an Issue' : 'Get Started'}
              </Button>
            </div>
          )}
        </Container>
      </section>

      {/* Call to Action Section */}
      <section className="py-5 bg-primary text-white">
        <Container className="text-center">
          <h2 className="mb-4">Ready to make a difference?</h2>
          <p className="lead mb-4">Join our community and help improve Addis Ababa together.</p>
          <Button 
            variant="light" 
            size="lg" 
            className="px-5"
            onClick={() => navigate('/register')}
          >
            Get Started
          </Button>
        </Container>
      </section>
    </div>
  );
};

export default LandingPage;

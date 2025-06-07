import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';

const ReporterDashboard = () => {
  const [reports, setReports] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (!user || !user._id) {
          setLoading(false);
          return;
        }
        
        // Get reports by current user
        const res = await api.get('/reports/user');
        
        setReports(res.data);
        
        // Get 3 most recent reports
        const recent = [...res.data].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 3);
        
        setRecentReports(recent);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

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

  return (
    <Container>
      <h1 className="mb-4">Reporter Dashboard</h1>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="dashboard-card text-center">
            <Card.Body>
              <h2>{reports.length}</h2>
              <p>Total Reports</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-card text-center">
            <Card.Body>
              <h2>{reports.filter(report => report.status === 'resolved').length}</h2>
              <p>Resolved Reports</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-card text-center">
            <Card.Body>
              <h2>{reports.filter(report => report.status === 'pending' || report.status === 'in_progress').length}</h2>
              <p>Pending Reports</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header as="h5">Quick Actions</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-2">
                  <Button as={Link} to="/reporter/create-report" variant="primary" className="w-100">
                    Report New Hazard
                  </Button>
                </Col>
                <Col md={6} className="mb-2">
                  <Button as={Link} to="/reporter/reports" variant="secondary" className="w-100">
                    View All Reports
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Header as="h5">Recent Reports</Card.Header>
            <Card.Body>
              {recentReports.length === 0 ? (
                <p className="text-center">No reports submitted yet.</p>
              ) : (
                <div>
                  {recentReports.map(report => (
                    <Card key={report._id} className="mb-3 hazard-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">{report.title}</h5>
                          <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-muted mb-2">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        <p className="mb-2">{report.description.substring(0, 100)}...</p>
                        <Button 
                          as={Link} 
                          to={`/reporter/report/${report._id}`}
                          variant="outline-primary"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </Card.Body>
                    </Card>
                  ))}
                  
                  {reports.length > 3 && (
                    <div className="text-center mt-3">
                      <Button as={Link} to="/reporter/reports" variant="link">
                        View All Reports
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ReporterDashboard;

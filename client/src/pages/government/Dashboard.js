import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Spinner from '../../components/layout/Spinner';

const GovDashboard = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    escalated: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all reports
        const reportsRes = await api.get('/reports');
        const allReports = reportsRes.data;
        
        // Get most recent reports
        const recentReports = [...allReports]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        setReports(recentReports);
        
        // Calculate stats
        const pending = allReports.filter(report => report.status === 'pending').length;
        const inProgress = allReports.filter(report => report.status === 'in_progress').length;
        const resolved = allReports.filter(report => report.status === 'resolved').length;
        const escalated = allReports.filter(report => report.status === 'escalated').length;
        
        setStats({
          total: allReports.length,
          pending,
          inProgress,
          resolved,
          escalated
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <h1 className="mb-4">Government Official Dashboard</h1>
      
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="dashboard-card text-center h-100">
            <Card.Body>
              <h2>{stats.total}</h2>
              <p>Total Reports</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="dashboard-card text-center h-100 bg-warning bg-opacity-25">
            <Card.Body>
              <h2>{stats.pending}</h2>
              <p>Pending Reports</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="dashboard-card text-center h-100 bg-info bg-opacity-25">
            <Card.Body>
              <h2>{stats.inProgress}</h2>
              <p>In Progress</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-3">
          <Card className="dashboard-card text-center h-100 bg-success bg-opacity-25">
            <Card.Body>
              <h2>{stats.resolved}</h2>
              <p>Resolved Reports</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-3">
          <Card className="dashboard-card text-center h-100 bg-danger bg-opacity-25">
            <Card.Body>
              <h2>{stats.escalated}</h2>
              <p>Escalated Reports</p>
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
                  <Button as={Link} to="/government/reports" variant="primary" className="w-100">
                    Manage Reports
                  </Button>
                </Col>
                <Col md={6} className="mb-2">
                  <Button as={Link} to="/government/statistics" variant="info" className="w-100">
                    View Statistics
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
              {reports.length === 0 ? (
                <p className="text-center">No reports available.</p>
              ) : (
                <div>
                  {reports.map(report => (
                    <Card key={report._id} className="mb-3 hazard-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">{report.title}</h5>
                          <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-muted mb-1">
                          <small>
                            Reported by: {report.reporter?.name || 'Anonymous'} | 
                            {new Date(report.createdAt).toLocaleDateString()}
                          </small>
                        </p>
                        <p className="text-muted mb-2">
                          <small>Location: {report.location}</small>
                        </p>
                        <p className="mb-2">{report.description.substring(0, 100)}...</p>
                        <Button 
                          as={Link} 
                          to={`/government/report/${report._id}`}
                          variant="outline-primary"
                          size="sm"
                        >
                          View & Manage
                        </Button>
                      </Card.Body>
                    </Card>
                  ))}
                  
                  <div className="text-center mt-3">
                    <Button as={Link} to="/government/reports" variant="link">
                      View All Reports
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default GovDashboard;

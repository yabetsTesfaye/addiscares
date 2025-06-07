import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Nav, Tabs, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';

const ReporterReports = () => {
  const [myReports, setMyReports] = useState([]);
  const [otherReports, setOtherReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('my-reports');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (!user || !user._id) {
          setLoading(false);
          return;
        }
        
        // Get current user's reports
        const myReportsRes = await api.get('/reports/user');
        setMyReports(myReportsRes.data);
        
        // Get reports from other users
        const otherReportsRes = await api.get('/reports/others');
        setOtherReports(otherReportsRes.data);
        
        // Set initial filtered reports to user's own reports
        setFilteredReports(myReportsRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  useEffect(() => {
    // Apply filters whenever search term, status filter, or active tab changes
    const reportsToFilter = activeTab === 'my-reports' ? myReports : otherReports;
    let filtered = [...reportsToFilter];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    setFilteredReports(filtered);
  }, [searchTerm, statusFilter, myReports, otherReports, activeTab]);

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending': return 'bg-warning';
      case 'in_progress': return 'bg-info';
      case 'resolved': return 'bg-success';
      case 'escalated': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };
  
  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    // Reset filters when changing tabs
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <Container>
      <h1 className="mb-4">Report Dashboard</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabSelect}
            id="report-tabs"
            className="mb-4"
          >
            <Tab eventKey="my-reports" title="My Reports" />
            <Tab eventKey="other-reports" title="Reports from Others" />
          </Tabs>
          
          <Row>
            <Col md={8}>
              <InputGroup className="mb-3">
                <Form.Control
                  placeholder={`Search ${activeTab === 'my-reports' ? 'my' : 'other'} reports by title, description or location`}
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="mb-3"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {filteredReports.length === 0 ? (
        <Card className="text-center">
          <Card.Body>
            <p className="mb-0">No reports found.</p>
            {activeTab === 'my-reports' && myReports.length === 0 && (
              <Button 
                as={Link} 
                to="/reporter/create-report" 
                variant="primary"
                className="mt-3"
              >
                Create Your First Report
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {filteredReports.map(report => (
            <Col md={6} key={report._id} className="mb-4">
              <Card className="h-100 hazard-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">{report.title}</h5>
                    <div>
                      {activeTab === 'other-reports' && (
                        <Badge bg="secondary" className="me-2">
                          {report.reporter?.name || 'Unknown User'}
                        </Badge>
                      )}
                      <Badge className={getStatusBadgeClass(report.status)}>
                        {report.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-muted small mb-2">
                    <strong>Location:</strong> {report.location}
                  </p>
                  
                  <p className="text-muted small mb-2">
                    <strong>Category:</strong> {report.category.replace('_', ' ')}
                  </p>
                  
                  <p className="text-muted small mb-3">
                    <strong>Reported on:</strong> {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                  
                  <p className="mb-4">
                    {report.description.length > 100
                      ? `${report.description.substring(0, 100)}...`
                      : report.description}
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    {report.assignedTo && (
                      <small className="text-muted">
                        <strong>Assigned to:</strong> {report.assignedTo.name || 'Unassigned'}
                      </small>
                    )}
                    <Button 
                      as={Link} 
                      to={`/reporter/report/${report._id}`}
                      variant="outline-primary"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ReporterReports;

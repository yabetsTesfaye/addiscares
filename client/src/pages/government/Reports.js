import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Spinner from '../../components/layout/Spinner';

const GovReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        setReports(res.data);
        setFilteredReports(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    // Apply filters whenever search term, status filter, or category filter changes
    let filtered = [...reports];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(report => report.category === categoryFilter);
    }
    
    // Sort reports
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'urgency':
          aValue = a.urgency;
          bValue = b.urgency;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredReports(filtered);
  }, [searchTerm, statusFilter, categoryFilter, sortBy, sortOrder, reports]);

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

  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <Container>
      <h1 className="mb-4">Manage Reports</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <Form.Control
                    placeholder="Search by title, location, or reporter"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            
            <Col md={6} lg={2}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6} lg={2}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={categoryFilter}
                  onChange={handleCategoryFilter}
                >
                  <option value="all">All Categories</option>
                  <option value="road">Road</option>
                  <option value="building">Building</option>
                  <option value="environment">Environment</option>
                  <option value="public_service">Public Service</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label>Sort By</Form.Label>
                <InputGroup>
                  <Form.Select
                    value={sortBy}
                    onChange={handleSortChange}
                  >
                    <option value="date">Date</option>
                    <option value="urgency">Urgency</option>
                    <option value="title">Title</option>
                  </Form.Select>
                  <Button 
                    variant="outline-secondary"
                    onClick={toggleSortOrder}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {filteredReports.length === 0 ? (
        <Card className="text-center">
          <Card.Body>
            <p className="mb-0">No reports found matching your filters.</p>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Reporter</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Urgency</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(report => (
                    <tr key={report._id}>
                      <td>{report.title}</td>
                      <td>{report.reporter?.name || 'Anonymous'}</td>
                      <td>{report.location}</td>
                      <td>{report.category.replace('_', ' ')}</td>
                      <td>
                        <Badge className={getStatusBadgeClass(report.status)}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td>{report.urgency}</td>
                      <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button 
                          as={Link} 
                          to={`/government/report/${report._id}`}
                          variant="primary"
                          size="sm"
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <p className="text-muted mt-2">
              Showing {filteredReports.length} of {reports.length} reports
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default GovReports;

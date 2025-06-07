import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Spinner from '../../components/layout/Spinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: {
      total: 0,
      reporters: 0,
      government: 0,
      admins: 0,
      active: 0,
      inactive: 0
    },
    reports: {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      escalated: 0
    }
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersRes = await api.get('/users');
        const allUsers = usersRes.data;
        
        // Calculate user stats
        const reporters = allUsers.filter(user => user.role === 'reporter').length;
        const government = allUsers.filter(user => user.role === 'government').length;
        const admins = allUsers.filter(user => user.role === 'admin').length;
        const active = allUsers.filter(user => user.status === 'active').length;
        const inactive = allUsers.filter(user => user.status === 'inactive').length;
        
        // Get most recent users
        const recentUsers = [...allUsers]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        setRecentUsers(recentUsers);
        
        // Fetch reports
        const reportsRes = await api.get('/reports');
        const allReports = reportsRes.data;
        
        // Calculate report stats
        const pending = allReports.filter(report => report.status === 'pending').length;
        const inProgress = allReports.filter(report => report.status === 'in_progress').length;
        const resolved = allReports.filter(report => report.status === 'resolved').length;
        const escalated = allReports.filter(report => report.status === 'escalated').length;
        
        setStats({
          users: {
            total: allUsers.length,
            reporters,
            government,
            admins,
            active,
            inactive
          },
          reports: {
            total: allReports.length,
            pending,
            inProgress,
            resolved,
            escalated
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <Container fluid className="p-4">
      <div className="mb-4">
        <h1>Admin Dashboard</h1>
        <p className="text-muted mb-0">Manage users, reports, and system settings</p>
      </div>

      <Row className="g-3 mb-4">
        <Col xl={3} lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Users</h6>
                  <h3 className="mb-0">{stats.users.total}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="bi bi-people fs-4 text-primary"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Reports</h6>
                  <h3 className="mb-0">{stats.reports.total}</h3>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <i className="bi bi-file-text fs-4 text-info"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Resolved</h6>
                  <h3 className="mb-0 text-success">{stats.reports.resolved}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="bi bi-check-circle fs-4 text-success"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Open Reports</h6>
                  <h3 className="mb-0 text-warning">{stats.reports.pending + stats.reports.inProgress}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="bi bi-exclamation-triangle fs-4 text-warning"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col xl={4} lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5 className="card-title mb-4">User Distribution</h5>
              <div className="d-flex justify-content-between text-center">
                <div>
                  <h4 className="text-primary">{stats.users.reporters}</h4>
                  <p className="text-muted mb-0">Reporters</p>
                </div>
                <div>
                  <h4 className="text-info">{stats.users.government}</h4>
                  <p className="text-muted mb-0">Officials</p>
                </div>
                <div>
                  <h4 className="text-secondary">{stats.users.admins}</h4>
                  <p className="text-muted mb-0">Admins</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={8} lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quick Actions</h5>
                <div className="dropdown">
                  <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><a className="dropdown-item" href="/admin/users">Manage Users</a></li>
                    <li><a className="dropdown-item" href="/admin/reports">View Reports</a></li>
                    <li><a className="dropdown-item" href="/admin/statistics">System Statistics</a></li>
                  </ul>
                </div>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <Button as={Link} to="/admin/users" variant="outline-primary" className="w-100 text-start p-3 d-flex align-items-center">
                    <i className="bi bi-people me-2"></i>
                    <span>Manage Users</span>
                  </Button>
                </div>
                <div className="col-6">
                  <Button as={Link} to="/admin/reports" variant="outline-info" className="w-100 text-start p-3 d-flex align-items-center">
                    <i className="bi bi-file-text me-2"></i>
                    <span>View Reports</span>
                  </Button>
                </div>
                <div className="col-6">
                  <Button as={Link} to="/admin/statistics" variant="outline-success" className="w-100 text-start p-3 d-flex align-items-center">
                    <i className="bi bi-graph-up me-2"></i>
                    <span>System Statistics</span>
                  </Button>
                </div>
                <div className="col-6">
                  <Button as={Link} to="/admin/settings" variant="outline-secondary" className="w-100 text-start p-3 d-flex align-items-center">
                    <i className="bi bi-gear me-2"></i>
                    <span>Settings</span>
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Header as="h5">Recent Users</Card.Header>
            <Card.Body>
              {recentUsers.length === 0 ? (
                <p className="text-center">No users available.</p>
              ) : (
                <div>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Date Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.map(user => (
                          <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`badge ${
                                user.role === 'admin' 
                                  ? 'bg-secondary' 
                                  : user.role === 'government' 
                                    ? 'bg-info' 
                                    : 'bg-primary'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                user.status === 'active' ? 'bg-success' : 'bg-danger'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="text-center mt-3">
                    <Button as={Link} to="/admin/users" variant="link">
                      View All Users
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

export default AdminDashboard;

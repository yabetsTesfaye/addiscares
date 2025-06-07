import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import api from '../../utils/api';
import Spinner from '../../components/layout/Spinner';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'reporter'
  });
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    role: '',
    status: ''
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
        setFilteredUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...users];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, statusFilter, users]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setEditData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async () => {
    try {
      // Update role
      await api.put(`/users/${currentUser._id}/role`, { role: editData.role });
      
      // Update status
      await api.put(`/users/${currentUser._id}/status`, { status: editData.status });
      
      // Refresh user list
      const res = await api.get('/users');
      setUsers(res.data);
      
      setShowEditModal(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.msg || 'Failed to update user');
    }
  };

  const handleRegisterSubmit = async () => {
    try {
      if (registerData.password !== registerData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      // Remove confirmPassword before sending
      const { confirmPassword, ...registerPayload } = registerData;
      
      await api.post('/auth/register', registerPayload);
      
      // Refresh user list
      const res = await api.get('/users');
      setUsers(res.data);
      
      // Reset form and close modal
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'reporter'
      });
      setShowRegisterModal(false);
    } catch (err) {
      console.error('Error registering user:', err);
      setError(err.response?.data?.msg || 'Failed to register user');
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      await api.delete(`/users/${currentUser._id}`);
      
      // Refresh user list
      const res = await api.get('/users');
      setUsers(res.data);
      
      setShowDeleteModal(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.msg || 'Failed to delete user');
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Manage Users</h1>
        <Button variant="success" onClick={() => setShowRegisterModal(true)}>
          Add New User
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Search Users</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Filter by Role</Form.Label>
                <Form.Select value={roleFilter} onChange={handleRoleFilter}>
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="government">Government</option>
                  <option value="reporter">Reporter</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Filter by Status</Form.Label>
                <Form.Select value={statusFilter} onChange={handleStatusFilter}>
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          {filteredUsers.length === 0 ? (
            <p className="text-center">No users found.</p>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Date Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg={
                          user.role === 'admin' 
                            ? 'secondary' 
                            : user.role === 'government' 
                              ? 'info' 
                              : 'primary'
                        }>
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={user.status === 'active' ? 'success' : 'danger'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentUser && (
            <Form>
              <Form.Group className="mb-3" controlId="editName">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  disabled
                />
              </Form.Group>
              
              <Form.Group className="mb-3" controlId="editEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={handleEditChange}
                  disabled
                />
              </Form.Group>
              
              <Form.Group className="mb-3" controlId="editRole">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  name="role"
                  value={editData.role}
                  onChange={handleEditChange}
                >
                  <option value="reporter">Reporter</option>
                  <option value="government">Government Official</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3" controlId="editStatus">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={editData.status}
                  onChange={handleEditChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Register User Modal */}
      <Modal show={showRegisterModal} onHide={() => setShowRegisterModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="registerName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={registerData.name}
                onChange={handleRegisterChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="registerEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="registerPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="registerConfirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="registerRole">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="role"
                value={registerData.role}
                onChange={handleRegisterChange}
              >
                <option value="reporter">Reporter</option>
                <option value="government">Government Official</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRegisterModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleRegisterSubmit}
            disabled={
              !registerData.name || 
              !registerData.email || 
              !registerData.password || 
              !registerData.confirmPassword
            }
          >
            Register User
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentUser && (
            <p>
              Are you sure you want to delete the user <strong>{currentUser.name}</strong>?
              This action cannot be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteSubmit}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageUsers;

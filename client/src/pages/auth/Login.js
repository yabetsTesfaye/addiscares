import React, { useState, useContext, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validated, setValidated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login, isAuthenticated, error, setError, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      console.log('User is authenticated, redirecting...', { user });
      
      // Add a small delay to ensure state is fully updated
      const redirectTimer = setTimeout(() => {
        switch (user.role) {
          case 'reporter':
            navigate('/reporter/dashboard');
            break;
          case 'government':
            navigate('/government/dashboard');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, navigate, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      console.log('Form validation failed');
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    console.log('Form is valid, attempting login...');
    setValidated(true);
    setLoginError('');
    
    try {
      console.log('Sending login request with data:', formData);
      const success = await login(formData);
      
      if (success) {
        console.log('Login successful, redirecting based on role...');
        setFormData({ email: '', password: '' });
        setValidated(false);
        
        // The useEffect will handle the redirection based on the updated auth state
        return;
      } else {
        console.error('Login failed');
        setLoginError('Login failed. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // Check for inactive account (403 status or specific error message)
      const isInactive = err.response?.status === 403 || 
                        err.response?.data?.code === 'ACCOUNT_INACTIVE' ||
                        (err.response?.data?.msg && 
                         (err.response.data.msg.includes('not active') || 
                          err.response.data.msg.includes('inactive')));
      
      console.log('Is inactive account?', isInactive);
      
      if (isInactive) {
        console.log('Inactive account detected, preparing redirect...');
        
        // Prepare user data for the inactive account page
        const userData = {
          email: formData.email,
          status: 'inactive',
          deactivationReason: err.response?.data?.msg || 'Your account is not active. Please contact support.'
        };
        
        console.log('Storing user data in localStorage:', userData);
        
        // Store in localStorage and redirect
        localStorage.setItem('inactiveUser', JSON.stringify(userData));
        
        console.log('Redirecting to /inactive-account...');
        window.location.href = '/inactive-account';
        return;
      }
      
      // Handle other errors
      const errorMessage = err.response?.data?.msg || 'Login failed. Please try again.';
      console.log('Setting login error:', errorMessage);
      setLoginError(errorMessage);
    }
  };

  return (
    <div className="auth-form">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Login to AddisCare</h2>
          
          {(error || loginError) && (
            <Alert variant="danger" onClose={() => { setError(''); setLoginError(''); }} dismissible>
              {error || loginError}
            </Alert>
          )}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
              <Form.Control.Feedback type="invalid">
                Please provide a valid email.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
              <Form.Control.Feedback type="invalid">
                Please provide your password.
              </Form.Control.Feedback>
            </Form.Group>
            
            <Button variant="primary" type="submit" className="w-100 mt-3">
              Login
            </Button>
          </Form>
          
          <div className="text-center mt-3">
            <p>
              Don't have an account?{' '}
              <Button variant="link" className="p-0" onClick={() => navigate('/register')}>
                Register
              </Button>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login;

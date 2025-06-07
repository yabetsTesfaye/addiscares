import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Image, ProgressBar, OverlayTrigger, Tooltip, Toast, FormGroup, FormLabel, FormSelect } from 'react-bootstrap';
import { FaCamera, FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../../components/layout/Spinner';
import { formatDate } from '../../utils/dateFormatter';

// Constants
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const NAME_MAX_LENGTH = 50;
const PHONE_MAX_LENGTH = 20;
const ADDRESS_MAX_LENGTH = 200;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    language: 'en',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    variant: 'secondary'
  });
  
  // Password strength checker
  const checkPasswordStrength = useCallback((password) => {
    if (!password) return { score: 0, label: '', variant: 'secondary' };
    
    let score = 0;
    const requirements = [
      password.length >= 8,                     // Length >= 8
      /[a-z]/.test(password),                   // Has lowercase
      /[A-Z]/.test(password),                   // Has uppercase
      /[0-9]/.test(password),                   // Has number
      /[^A-Za-z0-9]/.test(password)             // Has special char
    ];
    
    requirements.forEach(met => met && score++);
    
    // Convert to percentage (0-100)
    const percentage = (score / 5) * 100;
    
    // Determine strength label and variant
    let label, variant;
    if (percentage < 20) {
      label = 'Very Weak';
      variant = 'danger';
    } else if (percentage < 40) {
      label = 'Weak';
      variant = 'warning';
    } else if (percentage < 60) {
      label = 'Moderate';
      variant = 'info';
    } else if (percentage < 80) {
      label = 'Strong';
      variant = 'primary';
    } else {
      label = 'Very Strong';
      variant = 'success';
    }
    
    return { score: percentage, label, variant };
  }, []);
  
  // Update password strength when newPassword changes
  useEffect(() => {
    if (formData.newPassword) {
      const strength = checkPasswordStrength(formData.newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, label: '', variant: 'secondary' });
    }
  }, [formData.newPassword, checkPasswordStrength]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      if (user.profileImage) {
        // If the image path already includes http, use it as is
        if (user.profileImage.startsWith('http')) {
          setPreview(user.profileImage);
        } else {
          // Otherwise, construct the full URL
          const baseUrl = process.env.REACT_APP_API_URL || '';
          // Remove any leading slash from the image path
          const imagePath = user.profileImage.startsWith('/')
            ? user.profileImage.substring(1)
            : user.profileImage;
          setPreview(`${baseUrl}/${imagePath}`);
        }
      }
      setLoading(false);
    }
  }, [user]);

  // Validate image file
  const validateImage = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please select a valid image type (JPEG, PNG, GIF, or WebP)');
      return false;
    }
    
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image size should be less than 5MB');
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!validateImage(file)) {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Clean up object URL when component unmounts or when a new file is selected
      return () => URL.revokeObjectURL(previewUrl);
    }
  };

  const removeImage = () => {
    // Only show confirmation if there's an existing image
    if (user?.profileImage) {
      if (window.confirm('Are you sure you want to remove your profile picture?')) {
        setSelectedFile(null);
        setPreview('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } else {
      setSelectedFile(null);
      setPreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };
  
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = 'Name is required';
        } else if (value.length > NAME_MAX_LENGTH) {
          error = `Name must be less than ${NAME_MAX_LENGTH} characters`;
        }
        break;
        
      case 'phone':
        if (value && !/^[+\d\s-()]{0,20}$/.test(value)) {
          error = 'Please enter a valid phone number';
        }
        break;
        
      case 'currentPassword':
        if (formData.newPassword && !value) {
          error = 'Current password is required to change password';
        }
        break;
        
      case 'newPassword':
        if (value) {
          if (value.length < PASSWORD_MIN_LENGTH) {
            error = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
          } else if (value.length > PASSWORD_MAX_LENGTH) {
            error = `Password must be less than ${PASSWORD_MAX_LENGTH} characters`;
          }
        }
        break;
        
      case 'confirmPassword':
        if (formData.newPassword && value !== formData.newPassword) {
          error = 'Passwords do not match';
        }
        break;
        
      default:
        break;
    }
    
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return !error;
  };

  const toggleEditMode = () => {
    if (editMode) {
      // If canceling edit mode, reset to original values
      setFormData(prev => ({
        ...prev,
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setFormErrors({});
      setSelectedFile(null);
      setPreview(user?.profileImage || '');
    }
    setEditMode(!editMode);
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    // Validate required fields
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.length > NAME_MAX_LENGTH) {
      errors.name = `Name must be less than ${NAME_MAX_LENGTH} characters`;
      isValid = false;
    }
    
    // Validate phone format if provided
    if (formData.phone && !/^[+\d\s-()]{0,20}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
      isValid = false;
    }
    
    // Validate address length if provided
    if (formData.address && formData.address.length > ADDRESS_MAX_LENGTH) {
      errors.address = `Address must be less than ${ADDRESS_MAX_LENGTH} characters`;
      isValid = false;
    }
    
    // Validate password fields if any password field is filled
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required';
        isValid = false;
      }
      
      if (!formData.newPassword) {
        errors.newPassword = 'New password is required';
        isValid = false;
      } else if (formData.newPassword.length < PASSWORD_MIN_LENGTH) {
        errors.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
        isValid = false;
      } else if (formData.newPassword.length > PASSWORD_MAX_LENGTH) {
        errors.newPassword = `Password must be less than ${PASSWORD_MAX_LENGTH} characters`;
        isValid = false;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }
    
    setSaving(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add all form data to FormData
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add image if selected
      if (selectedFile) {
        formDataToSend.append('profileImage', selectedFile);
      } else if (preview === '' && user.profileImage) {
        // If image was removed
        formDataToSend.append('removeImage', 'true');
      }
      
      const res = await api.put('/auth/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Ensure we have valid user data before updating context
      if (res.data && res.data.user) {
        // Only update with the fields we expect
        const { _id, name, email, role, status, profileImage, language } = res.data.user;
        updateUser({
          _id,
          name,
          email,
          role,
          status,
          profileImage,
          language
        });
      }
      
      // Show success message
      toast.success('Profile updated successfully');
      
      // Reset form state
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      // Clear file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Exit edit mode
      setEditMode(false);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      
      let errorMessage = 'Failed to update profile';
      
      if (err.response) {
        // Handle validation errors from server
        if (err.response.status === 400 && err.response.data.errors) {
          const serverErrors = {};
          err.response.data.errors.forEach(error => {
            serverErrors[error.param] = error.msg;
          });
          setFormErrors(serverErrors);
          errorMessage = 'Please fix the form errors';
        } else if (err.response.data.msg) {
          errorMessage = err.response.data.msg;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <Container className="py-4">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <h1 className="mb-4">User Profile</h1>
      
      <Row>
        <Col lg={8} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Profile Information</h5>
              <Button 
                variant={editMode ? "outline-light" : "light"} 
                size="sm"
                onClick={toggleEditMode}
              >
                {editMode ? "Cancel" : "Edit Profile"}
              </Button>
            </Card.Header>
            <Card.Body className="p-4">
              {/* Profile Image Upload */}
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block">
                  <div 
                    className="rounded-circle overflow-hidden bg-light" 
                    style={{
                      width: '150px', 
                      height: '150px',
                      border: '3px solid #dee2e6',
                      cursor: editMode ? 'pointer' : 'default'
                    }}
                    onClick={() => editMode && fileInputRef.current.click()}
                  >
                    {preview ? (
                      <div className="position-relative w-100 h-100">
                        <Image 
                          src={preview} 
                          alt="Profile" 
                          fluid 
                          className="w-100 h-100 object-fit-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            setPreview('');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                        <div className="text-muted">
                          {editMode ? 'Click to upload' : 'No image'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {editMode && (
                    <div className="position-absolute" style={{ bottom: '10px', right: '10px' }}>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="rounded-circle p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current.click();
                        }}
                      >
                        <FaCamera />
                      </Button>
                      {preview && (
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="rounded-circle p-2 ms-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                        >
                          <FaTimes />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="d-none"
                    disabled={!editMode}
                  />
                </div>
              </div>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!editMode}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.email}
                        disabled={true}
                      />
                      <Form.Text className="text-muted">
                        Email cannot be changed
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!editMode}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Control
                        type="text"
                        value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                        disabled={true}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group controlId="address" className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    isInvalid={!!formErrors.address}
                    disabled={!editMode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.address}
                  </Form.Control.Feedback>
                </Form.Group>

                
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Account Created</Form.Label>
                      <Form.Control
                        type="text"
                        value={formatDate(user?.createdAt, true)}
                        disabled={true}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                {editMode && (
                  <>
                    <hr />
                    <h5 className="mb-3">Change Password</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter current password to change password"
                      />
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>New Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Enter new password"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirm New Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <div className="d-grid gap-2 mt-4">
                      <Button 
                        variant="success" 
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Updating...' : 'Save Changes'}
                      </Button>
                    </div>
                  </>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;

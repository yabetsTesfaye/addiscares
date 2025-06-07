import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const InactiveAccount = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const { user, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for deactivation info
  const [deactivationInfo, setDeactivationInfo] = useState({
    reason: 'Your account has been deactivated by an administrator.',
    appealStatus: 'none',
    email: '',
    userId: null
  });
  
  // Load user data from localStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log('InactiveAccount: Loading user data...');
        
        // Get user data from localStorage
        const storedUser = localStorage.getItem('inactiveUser');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('InactiveAccount: Loaded user data from localStorage:', userData);
            
            // Set the deactivation info
            setDeactivationInfo({
              reason: userData.deactivationReason || 'Your account is not active. Please contact support.',
              appealStatus: 'none',
              email: userData.email || '',
              userId: null,
              status: 'inactive'
            });
            
            // Clear the stored data
            localStorage.removeItem('inactiveUser');
            return;
          } catch (error) {
            console.error('Error parsing stored user data:', error);
          }
        }
        
        // Check location state if localStorage is empty
        if (location.state) {
          console.log('InactiveAccount: Using location state:', location.state);
          
          const stateData = location.state;
          const deactivationData = {
            reason: stateData.deactivationReason || 
                   stateData.response?.data?.deactivationReason ||
                   stateData.response?.data?.message ||
                   stateData.message ||
                   'Your account is not active. Please contact support.',
            appealStatus: stateData.appealStatus || stateData.response?.data?.appealStatus || 'none',
            email: stateData.email || stateData.response?.data?.email || '',
            userId: stateData.id || stateData.response?.data?.userId || null,
            status: stateData.status || stateData.response?.data?.status || 'inactive'
          };
          
          console.log('InactiveAccount: Setting deactivation info from location state:', deactivationData);
          setDeactivationInfo(deactivationData);
          return;
        }
        
        // If we have a user context, try to refresh the data
        if (user) {
          try {
            console.log('Refreshing user data...');
            const updatedUser = await refreshUser();
            if (updatedUser) {
              setDeactivationInfo({
                reason: updatedUser.deactivationReason || 
                       'Your account is not active. Please contact support.',
                appealStatus: updatedUser.appeal?.status || 'none',
                email: updatedUser.email || '',
                userId: updatedUser._id || null,
                status: updatedUser.status || 'inactive'
              });
            }
          } catch (err) {
            console.error('Error refreshing user data:', err);
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };
    
    loadUserData();
  }, [location.state, user, refreshUser]);
  
  // Check if we should redirect to home page
  useEffect(() => {
    // If we have a user context and they're active, redirect to home
    if (user?.status === 'active') {
      navigate('/');
      return;
    }
    
    // If we have deactivation info but no user context, we're probably in the right place
    if (deactivationInfo.status === 'inactive') {
      return;
    }
    
    // If we don't have any user data, redirect to login
    if (!user && !deactivationInfo.userId) {
      navigate('/login');
    }
  }, [user, deactivationInfo, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/appeals', {
        reason: appealReason,
        status: 'pending'
      });

      setMessage('Your appeal has been submitted successfully. We will review it shortly.');
      setAppealReason('');
      
      // Refresh user data to get the latest appeal status
      const updatedUser = await refreshUser();
      if (updatedUser) {
        setDeactivationInfo({
          reason: updatedUser.deactivationReason || 'Your account has been deactivated by an administrator.',
          appealStatus: updatedUser.appeal?.status || 'pending'
        });
      }
    } catch (err) {
      console.error('Error submitting appeal:', err);
      setError(err.response?.data?.msg || 'Failed to submit appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-header bg-danger text-white">
              <h4 className="mb-0">Account Inactive</h4>
            </div>
            <div className="card-body">
              <div className="alert alert-warning">
                <h5 className="alert-heading">Your account is currently inactive.</h5>
                <p className="mb-0">
                  {deactivationInfo.reason}
                </p>
              </div>

              {message && <div className="alert alert-success">{message}</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="mt-4">
                {deactivationInfo.appealStatus === 'none' || deactivationInfo.appealStatus === 'rejected' ? (
                  <div>
                    <h5>Submit an Appeal</h5>
                    <p>
                      If you believe this is a mistake, you can submit an appeal to request reactivation of your account.
                    </p>
                    <textarea
                      className="form-control mb-3"
                      rows="5"
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      placeholder="Please explain why you believe your account should be reactivated..."
                      required
                    ></textarea>
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmitAppeal}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
                    </button>
                  </div>
                ) : user.appeal.status === 'pending' ? (
                  <div className="alert alert-info">
                    Your appeal is currently under review. We will notify you once a decision has been made.
                  </div>
                ) : null}

                <div className="mt-4">
                  <button className="btn btn-outline-secondary me-2" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactiveAccount;

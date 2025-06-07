import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Spinner from './components/layout/Spinner';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import InactiveAccount from './pages/auth/InactiveAccount';
import Profile from './pages/profile/Profile';
import LandingPage from './pages/landing/LandingPage';

// Pages - Reporter
import ReporterDashboard from './pages/reporter/Dashboard';
import CreateReport from './pages/reporter/CreateReport';
import ViewReport from './pages/reporter/ViewReport';
import ReporterReports from './pages/reporter/Reports';
import ReporterNotifications from './pages/reporter/Notifications';

// Pages - Government
import GovDashboard from './pages/government/Dashboard';
import GovReports from './pages/government/Reports';
import GovViewReport from './pages/government/ViewReport';
import GovStatistics from './pages/government/Statistics';
import GovNotifications from './pages/government/Notifications';

// Pages - Admin
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import AdminReports from './pages/admin/Reports';
import AdminViewReport from './pages/admin/ViewReport';
import AdminStatistics from './pages/admin/Statistics';
import AdminNotifications from './pages/admin/Notifications';

// Shared Pages
import SearchResults from './pages/shared/SearchResults';

// Protected route components
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const location = useLocation();
  
  if (loading) return <Spinner />;
  
  if (!isAuthenticated) {
    // Redirect to login with the current location to come back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user account is inactive
  if (user && user.status !== 'active') {
    // Don't redirect if we're already on the inactive account page to prevent loops
    if (location.pathname === '/inactive-account') {
      return children;
    }
    return <Navigate to="/inactive-account" state={{ from: location }} replace />;
  }
  
  return children;
};

const ReporterRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const location = useLocation();
  
  if (loading) return <Spinner />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user account is inactive
  if (user && user.status !== 'active') {
    return <Navigate to="/inactive-account" state={{ from: location }} replace />;
  }
  
  if (user.role !== 'reporter') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const GovRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const location = useLocation();
  
  if (loading) return <Spinner />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user account is inactive
  if (user && user.status !== 'active') {
    return <Navigate to="/inactive-account" state={{ from: location }} replace />;
  }
  
  if (user.role !== 'government') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const location = useLocation();
  
  if (loading) return <Spinner />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user account is inactive
  if (user && user.status !== 'active') {
    return <Navigate to="/inactive-account" state={{ from: location }} replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  
  if (loading) {
    return <Spinner />;
  }
  
  // Determine the dashboard route based on user role and authentication
  const getDashboardRoute = () => {
    if (!isAuthenticated) return '/';
    
    switch (user.role) {
      case 'reporter':
        return '/reporter/dashboard';
      case 'government':
        return '/government/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };
  
  return (
    <Router>
        <Header />
        <div className="container main-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/inactive-account" element={<InactiveAccount />} />
            <Route path="/search" element={
              <ProtectedRoute>
                <SearchResults />
              </ProtectedRoute>
            } />
            
            {/* Redirect /notifications to role-specific notifications page */}
            <Route path="/notifications" element={
              <ProtectedRoute>
                {user?.role === 'admin' ? (
                  <Navigate to="/admin/notifications" replace />
                ) : user?.role === 'government' ? (
                  <Navigate to="/government/notifications" replace />
                ) : user?.role === 'reporter' ? (
                  <Navigate to="/reporter/notifications" replace />
                ) : (
                  <Navigate to="/login" state={{ from: '/notifications' }} replace />
                )}
              </ProtectedRoute>
            } />
            
            {/* Settings/Profile Route */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Reporter Routes */}
            <Route path="/reporter/dashboard" element={
              <ReporterRoute>
                <ReporterDashboard />
              </ReporterRoute>
            } />
            <Route path="/reporter/reports" element={
              <ReporterRoute>
                <ReporterReports />
              </ReporterRoute>
            } />
            {/* Keep the old route for backward compatibility */}
            <Route path="/reporter/reports/create" element={
              <ReporterRoute>
                <CreateReport />
              </ReporterRoute>
            } />
            {/* New, shorter route */}
            <Route path="/reporter/create-report" element={
              <ReporterRoute>
                <CreateReport />
              </ReporterRoute>
            } />
            <Route path="/reporter/reports/:id" element={
              <ReporterRoute>
                <ViewReport />
              </ReporterRoute>
            } />
            {/* Support for singular 'report' path for backward compatibility */}
            <Route path="/reporter/report/:id" element={
              <ReporterRoute>
                <ViewReport />
              </ReporterRoute>
            } />
            <Route path="/reporter/notifications" element={
              <ReporterRoute>
                <ReporterNotifications />
              </ReporterRoute>
            } />
            
            {/* Government Routes */}
            <Route path="/government/dashboard" element={
              <GovRoute>
                <GovDashboard />
              </GovRoute>
            } />
            <Route path="/government/reports" element={
              <GovRoute>
                <GovReports />
              </GovRoute>
            } />
            <Route path="/government/reports/:id" element={
              <GovRoute>
                <GovViewReport />
              </GovRoute>
            } />
            {/* Support for singular 'report' path for backward compatibility */}
            <Route path="/government/report/:id" element={
              <GovRoute>
                <GovViewReport />
              </GovRoute>
            } />
            <Route path="/government/statistics" element={
              <GovRoute>
                <GovStatistics />
              </GovRoute>
            } />
            <Route path="/government/notifications" element={
              <GovRoute>
                <GovNotifications />
              </GovRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <ManageUsers />
              </AdminRoute>
            } />
            <Route path="/admin/reports" element={
              <AdminRoute>
                <AdminReports />
              </AdminRoute>
            } />
            <Route path="/admin/reports/:id" element={
              <AdminRoute>
                <AdminViewReport />
              </AdminRoute>
            } />
            {/* Support for singular 'report' path for backward compatibility */}
            <Route path="/admin/report/:id" element={
              <AdminRoute>
                <AdminViewReport />
              </AdminRoute>
            } />
            <Route path="/admin/report/:id" element={
              <AdminRoute>
                <AdminViewReport />
              </AdminRoute>
            } />
            <Route path="/admin/statistics" element={
              <AdminRoute>
                <AdminStatistics />
              </AdminRoute>
            } />
            <Route path="/admin/notifications" element={
              <AdminRoute>
                <AdminNotifications />
              </AdminRoute>
            } />
            
            {/* Shared Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={
              <div className="container my-5">
                <div className="row">
                  <div className="col-md-12 text-center">
                    <h1>404</h1>
                    <p>Page not found</p>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </div>
        <Footer />
      </Router>
  );
}

export default App;

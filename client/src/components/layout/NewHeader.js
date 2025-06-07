import React, { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Navbar, Nav, Container, NavDropdown, Badge, Offcanvas, 
  Form, InputGroup, Button, OverlayTrigger, Tooltip, Collapse 
} from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  FaBell, FaUser, FaSignInAlt, FaUserPlus, FaBars, 
  FaHome, FaChartLine, FaFileAlt, FaUsers, FaExclamationTriangle, 
  FaSearch, FaSun, FaMoon, FaTimes, FaCog, FaSignOutAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Header = () => {
  const { isAuthenticated, user, logout, unreadCount, setUnreadCount } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  
  // State management
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? JSON.parse(savedMode) : 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Toggle dark/light theme
  const toggleTheme = useCallback(() => {
    setDarkMode(prevMode => !prevMode);
  }, []);

  // Apply dark/light theme
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  
  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setShowMobileMenu(prev => !prev);
  }, []);
  
  // Toggle notifications
  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev);
  }, []);
  
  // Handle search
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [navigate, searchQuery]);
  
  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
    toast.success('You have been logged out successfully');
  }, [logout, navigate]);
  
  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [setUnreadCount]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [setUnreadCount]);
  
  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated, setUnreadCount]);
  
  // Set up scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set up click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Set mounted state for animations
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Fetch notifications on mount and set up refresh interval
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
      
      const interval = setInterval(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);
  
  // Render notification badge
  const renderNotificationBadge = useCallback(() => {
    if (!unreadCount) return null;
    return (
      <Badge 
        bg="danger" 
        pill 
        className="position-absolute top-0 end-0 translate-middle"
        style={{ fontSize: '0.6rem', padding: '0.25rem 0.35rem' }}
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </Badge>
    );
  }, [unreadCount]);
  
  // Navigation links configuration
  const navLinks = useMemo(() => ({
    reporter: [
      { to: '/reporter/dashboard', text: 'Dashboard', icon: <FaHome className="me-1" /> },
      { to: '/reporter/create-report', text: 'Report Hazard', icon: <FaExclamationTriangle className="me-1" /> },
      { to: '/reporter/reports', text: 'My Reports', icon: <FaFileAlt className="me-1" /> },
    ],
    government: [
      { to: '/government/dashboard', text: 'Dashboard', icon: <FaHome className="me-1" /> },
      { to: '/government/reports', text: 'View Reports', icon: <FaFileAlt className="me-1" /> },
      { to: '/government/statistics', text: 'Statistics', icon: <FaChartLine className="me-1" /> },
    ],
    admin: [
      { to: '/admin/dashboard', text: 'Dashboard', icon: <FaHome className="me-1" /> },
      { to: '/admin/users', text: 'Manage Users', icon: <FaUsers className="me-1" /> },
      { to: '/admin/reports', text: 'Reports', icon: <FaFileAlt className="me-1" /> },
      { to: '/admin/statistics', text: 'Statistics', icon: <FaChartLine className="me-1" /> },
    ]
  }), []);
  
  // Render navigation links based on user role
  const renderNavLinks = useCallback(() => {
    if (!user?.role) return null;
    const links = navLinks[user.role] || [];
    
    return links.map((link, index) => (
      <Nav.Link 
        key={index} 
        as={Link} 
        to={link.to}
        className={`d-flex align-items-center ${location.pathname === link.to ? 'active' : ''}`}
        onClick={() => setShowMobileMenu(false)}
      >
        {link.icon}
        <span className="ms-1">{link.text}</span>
      </Nav.Link>
    ));
  }, [user?.role, location.pathname, navLinks]);
  
  // Render user dropdown menu
  const renderUserDropdown = useCallback(() => (
    <DropdownMenu
      title={
        <div className="d-flex align-items-center">
          <div className="position-relative">
            <UserAvatar $darkMode={darkMode}>
              <FaUser size={14} />
            </UserAvatar>
            {renderNotificationBadge()}
          </div>
          <span className="ms-2 d-none d-lg-inline">
            {user?.name || 'User'}
          </span>
        </div>
      }
      id="user-dropdown"
      align="end"
      className="px-2"
      $darkMode={darkMode}
      menuVariant={darkMode ? 'dark' : undefined}
    >
      <div className="px-3 py-2 border-bottom">
        <div className="fw-bold">{user?.name || 'User'}</div>
        <small className="text-muted text-capitalize">{user?.role}</small>
      </div>
      <NavDropdown.Divider />
      <NavDropdown.Item 
        as={Link} 
        to="/profile" 
        className="d-flex align-items-center"
        onClick={() => setShowNotifications(false)}
      >
        <FaUser className="me-2" /> Profile
      </NavDropdown.Item>
      <NavDropdown.Item 
        as={Link} 
        to="/settings" 
        className="d-flex align-items-center"
        onClick={() => setShowNotifications(false)}
      >
        <FaCog className="me-2" /> Settings
      </NavDropdown.Item>
      <NavDropdown.Divider />
      <NavDropdown.Item 
        onClick={handleLogout}
        className="text-danger d-flex align-items-center"
      >
        <FaSignOutAlt className="me-2" /> Logout
      </NavDropdown.Item>
    </NavDropdown>
  ), [darkMode, handleLogout, renderNotificationBadge, user?.name, user?.role]);

  // Render notifications dropdown
  const renderNotifications = useCallback(() => (
    <NavDropdown
      title={
        <div className="position-relative">
          <FaBell size={20} />
          {renderNotificationBadge()}
        </div>
      }
      align="end"
      show={showNotifications}
      onToggle={toggleNotifications}
      className="px-2"
      menuVariant={darkMode ? 'dark' : undefined}
    >
      <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Notifications</h6>
        {unreadCount > 0 && (
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 text-decoration-none"
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        )}
        {loading ? (
          </div>
        </div>
       {notifications.length > 0 ? (
        <div style={{ maxHeight: '400px', overflowY: 'auto', backgroundColor: darkMode ? '#333' : '#f9f9f9', padding: '10px', borderRadius: '10px' }}>
          {notifications.map((notification) => (
            <NotificationItem 
              key={notification._id}
              className={!notification.read ? 'unread' : ''}
              style={{ backgroundColor: darkMode ? '#444' : '#fff', padding: '10px', borderBottom: '1px solid #ccc' }}
              onClick={() => markAsRead(notification._id)}
              $darkMode={darkMode}
            >
              <div className="d-flex w-100">
                <div className="flex-shrink-0">
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                       style={{ width: '32px', height: '32px' }}>
                    <FaBell className="text-white" size={14} />
                  </div>
                </div>
                <div className="ms-2 flex-grow-1">
                  <div className="d-flex justify-content-between">
                    <strong>{notification.title}</strong>
                    {!notification.read && (
                      <span className="badge bg-primary rounded-pill">New</span>
                    )}
                  </div>
                  <div className="text-muted small">{notification.message}</div>
                  <div className="text-muted small">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </NavDropdown.Item>
          ))
        ) : (
          <div className="text-center p-3 text-muted">
            No notifications found
          </div>
        )}
      </div>
      {notifications.length > 0 && (
        <NavDropdown.Divider />
      )}
      <NavDropdown.Item 
        as={Link} 
        to="/notifications" 
        className="text-center"
        onClick={() => setShowNotifications(false)}
      >
        View all notifications
      </NavDropdown.Item>
    </NavDropdown>
  ), [darkMode, loading, markAllAsRead, markAsRead, notifications, renderNotificationBadge, showNotifications, toggleNotifications, unreadCount]);

  // Render search form
  const renderSearchForm = useCallback((isMobile = false) => (
    <Form className={`d-flex ${isMobile ? 'w-100 me-2' : 'd-none d-lg-block me-2'}`} onSubmit={handleSearch}>
      <InputGroup>
        <Form.Control
          type="search"
          placeholder="Search..."
          className="border-end-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search"
        />
        <Button 
          variant={darkMode ? 'outline-light' : 'outline-secondary'} 
          type="submit"
          className="border-start-0"
        >
          <FaSearch />
        </Button>
      </InputGroup>
    </Form>
  ), [darkMode, handleSearch, searchQuery]);

  // Render theme toggle button
  const renderThemeToggle = useCallback((isMobile = false) => (
    <Button 
      variant={darkMode ? 'outline-light' : 'outline-secondary'} 
      className={`ms-2 ${isMobile ? 'w-100' : ''}`}
      onClick={toggleTheme}
      size={isMobile ? 'lg' : 'sm'}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <FaSun className="me-1" /> : <FaMoon className="me-1" />}
      {isMobile && (darkMode ? 'Light Mode' : 'Dark Mode')}
    </Button>
  ), [darkMode, toggleTheme]);

  // Render auth buttons
  const renderAuthButtons = useCallback((isMobile = false) => (
    <div className={`d-flex ${isMobile ? 'flex-column w-100' : 'd-none d-lg-flex'}`}>
      <Button 
        as={Link} 
        to="/login" 
        variant="outline-primary" 
        className={`me-2 ${isMobile ? 'w-100 mb-2' : ''}`}
        size={isMobile ? 'lg' : 'sm'}
        onClick={isMobile ? toggleMobileMenu : undefined}
      >
        <FaSignInAlt className="me-1" /> Login
      </Button>
      <Button 
        as={Link} 
        to="/register" 
        variant="primary" 
        size={isMobile ? 'lg' : 'sm'}
        className={isMobile ? 'w-100' : ''}
        onClick={isMobile ? toggleMobileMenu : undefined}
      >
        <FaUserPlus className="me-1" /> Register
      </Button>
    </div>
  ), [toggleMobileMenu]);

  return (
    <header 
      className={`sticky-top ${scrolled ? 'shadow-sm' : ''}`}
      style={{
        transition: 'all 0.3s ease-in-out',
        zIndex: 1030,
        backgroundColor: darkMode ? '#212529' : '#f8f9fa'
      }}
    >
      <Navbar 
        expand="lg" 
        className={`py-2 ${darkMode ? 'bg-dark' : 'bg-light'}`}
        variant={darkMode ? 'dark' : 'light'}
      >
        <Container fluid>
          {/* Brand/logo */}
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <span className="fw-bold">AddisCare</span>
          </Navbar.Brand>

          {/* Mobile menu toggle */}
          <div className="d-flex align-items-center d-lg-none">
            {isAuthenticated && (
              <>
                <Button 
                  variant="link" 
                  className={`text-${darkMode ? 'light' : 'dark'} me-2 p-1`}
                  onClick={toggleNotifications}
                >
                  <div className="position-relative">
                    <FaBell size={20} />
                    {renderNotificationBadge()}
                  </div>
                </Button>
              </>
            )}
            <Button
              variant={darkMode ? 'outline-light' : 'outline-secondary'}
              className="p-1 me-2"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation"
            >
              {showMobileMenu ? <FaTimes size={20} /> : <FaBars size={20} />}
            </Button>
          </div>

          {/* Desktop navigation */}
          <Navbar.Collapse className="justify-content-between">
            <Nav className="me-auto mb-2 mb-lg-0">
              {isAuthenticated ? renderNavLinks() : null}
            </Nav>
            
            <div className="d-flex align-items-center">
              {isAuthenticated ? (
                <>
                  <div className="d-none d-lg-block">
                    {renderSearchForm()}
                  </div>
                  <div className="d-flex align-items-center">
                    {renderThemeToggle()}
                    <div className="d-none d-lg-block">
                      {renderNotifications()}
                    </div>
                    {renderUserDropdown()}
                  </div>
                </>
              ) : (
                <>
                  <div className="d-none d-lg-block">
                    {renderThemeToggle()}
                  </div>
                  {renderAuthButtons()}
                </>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Mobile offcanvas menu */}
      <Offcanvas 
        show={showMobileMenu} 
        onHide={toggleMobileMenu}
        placement="end"
        className={darkMode ? 'bg-dark text-light' : ''}
      >
        <Offcanvas.Header closeButton closeVariant={darkMode ? 'white' : undefined}>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {isAuthenticated ? (
            <div className="d-flex flex-column h-100">
              <div className="mb-3">
                {renderSearchForm(true)}
              </div>
              <Nav className="flex-column mb-3">
                {renderNavLinks()}
              </Nav>
              <div className="mt-auto">
                {renderThemeToggle(true)}
                {renderAuthButtons(true)}
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column h-100">
              <div className="mt-auto">
                {renderThemeToggle(true)}
                {renderAuthButtons(true)}
              </div>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </header>
  );
};

export default Header;

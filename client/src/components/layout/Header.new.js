import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  Navbar, Nav, Container, NavDropdown, Badge, 
  Form, InputGroup, Button, Collapse 
} from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  FaBell, FaUser, FaSignInAlt, FaUserPlus, FaBars, 
  FaHome, FaChartLine, FaFileAlt, FaUsers, FaExclamationTriangle, 
  FaSearch, FaSun, FaMoon, FaTimes, FaCog, FaSignOutAlt, FaGlobe
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Header = () => {
  // Context and hooks
  const { 
    user, 
    isAuthenticated, 
    logout,
    notifications = [],
    unreadCount = 0,
    fetchNotifications,
    markAllAsRead,
    markAsRead
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  // Toggle dark/light theme
  const toggleTheme = useCallback(() => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.setAttribute('data-bs-theme', newDarkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Handle search form submission
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  }, [searchQuery, navigate]);

  // Handle click outside notifications dropdown
  const handleClickOutside = useCallback((event) => {
    if (
      notificationsRef.current && 
      !notificationsRef.current.contains(event.target) &&
      !event.target.closest('.notification-dropdown')
    ) {
      setShowNotifications(false);
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) { // lg breakpoint
        setShowMobileMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set initial theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }, [darkMode]);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set up notification polling
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Not setting up notification polling: user not authenticated');
      return;
    }

    console.log('Setting up notification polling...');
    
    // Initial fetch
    const initialFetch = async () => {
      try {
        await fetchNotifications();
      } catch (error) {
        console.error('Initial notification fetch failed:', error);
      }
    };
    
    initialFetch();
    
    // Set up polling every 15 seconds
    const interval = setInterval(() => {
      console.log('Polling for new notifications...');
      fetchNotifications().catch(error => {
        console.error('Error during notification polling:', error);
      });
    }, 15000);
    
    // Clean up interval on unmount
    return () => {
      console.log('Cleaning up notification polling');
      clearInterval(interval);
    };
  }, [isAuthenticated, fetchNotifications]);

  // Toggle notifications dropdown
  const toggleNotifications = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setShowNotifications(prev => {
      const newState = !prev;
      if (newState && unreadCount > 0) {
        markAllAsRead().catch(error => {
          console.error('Error marking all as read:', error);
          toast.error('Failed to mark notifications as read');
        });
      }
      return newState;
    });
  }, [unreadCount, markAllAsRead]);

  // Handle mark as read for a single notification
  const handleMarkAsRead = useCallback(async (notificationId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, [markAsRead]);

  // Render navigation links based on user role
  const renderNavLinks = useCallback(() => {
    if (!user) return null;

    const commonLinks = [
      { to: '/dashboard', icon: <FaHome className="me-1" />, text: 'Dashboard' },
      { to: '/reports', icon: <FaFileAlt className="me-1" />, text: 'Reports' },
    ];

    const reporterLinks = [
      ...commonLinks,
      { to: '/submit-report', icon: <FaExclamationTriangle className="me-1" />, text: 'Submit Report' },
    ];

    const govtLinks = [
      ...commonLinks,
      { to: '/statistics', icon: <FaChartLine className="me-1" />, text: 'Statistics' },
    ];

    const adminLinks = [
      ...commonLinks,
      { to: '/admin/users', icon: <FaUsers className="me-1" />, text: 'Manage Users' },
      { to: '/admin/settings', icon: <FaCog className="me-1" />, text: 'Settings' },
    ];

    let links = [];
    if (user.role === 'admin') {
      links = adminLinks;
    } else if (user.role === 'government') {
      links = govtLinks;
    } else {
      links = reporterLinks;
    }

    return links.map((link, index) => (
      <Nav.Link 
        key={index} 
        as={Link} 
        to={link.to}
        active={location.pathname === link.to}
        className="mx-2"
      >
        {link.icon} {link.text}
      </Nav.Link>
    ));
  }, [user, location.pathname]);

  // Check if current page is home
  const isHomePage = location.pathname === '/';
  
  // Navbar background color - dark purple only on home page
  const navbarBgColor = isHomePage 
    ? 'rgba(33, 37, 41, 0.9)' 
    : (darkMode ? '#212529' : '#ffffff');

  // User dropdown menu
  const renderUserDropdown = () => (
    <NavDropdown
      title={
        <span className="d-flex align-items-center">
          <FaUser className="me-1" />
          {user?.name || 'Account'}
        </span>
      }
      id="user-dropdown"
      align="end"
      className="ms-2"
    >
      <NavDropdown.Item as={Link} to="/profile">
        <FaUser className="me-2" /> Profile
      </NavDropdown.Item>
      <NavDropdown.Item as={Link} to="/settings">
        <FaCog className="me-2" /> Settings
      </NavDropdown.Item>
      <NavDropdown.Divider />
      <NavDropdown.Item onClick={logout}>
        <FaSignOutAlt className="me-2" /> Logout
      </NavDropdown.Item>
    </NavDropdown>
  );

  // Auth buttons (login/register)
  const renderAuthButtons = () => (
    <>
      <Button 
        variant="outline-light" 
        as={Link} 
        to="/login" 
        className="me-2"
      >
        <FaSignInAlt className="me-1" /> Login
      </Button>
      <Button 
        variant="primary" 
        as={Link} 
        to="/register"
      >
        <FaUserPlus className="me-1" /> Register
      </Button>
    </>
  );

  // Notification dropdown
  const renderNotificationDropdown = () => (
    <div className="dropdown notification-dropdown ms-2" ref={notificationsRef}>
      <Button 
        variant="link" 
        className="position-relative p-0"
        onClick={toggleNotifications}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <FaBell size={20} className={darkMode ? 'text-light' : 'text-dark'} />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </Button>

      {showNotifications && (
        <div className="dropdown-menu dropdown-menu-end p-0 shadow" style={{ width: '350px', display: 'block' }}>
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="mb-0 fw-bold">Notifications</h6>
            <div className="d-flex">
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 me-2 text-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchNotifications();
                }}
                aria-label="Refresh notifications"
              >
                <FaSync />
              </Button>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 text-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead().catch(console.error);
                }}
                disabled={unreadCount === 0}
                aria-label="Mark all as read"
              >
                <FaCheck />
              </Button>
            </div>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted mb-0">No notifications yet</p>
                <small className="text-muted">We'll notify you when something new arrives</small>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {notifications.map(notification => (
                  <div 
                    key={notification._id} 
                    className={`list-group-item list-group-item-action ${!notification.read ? 'bg-light' : ''}`}
                    onClick={() => {
                      if (notification.link) {
                        navigate(notification.link);
                      }
                      if (!notification.read) {
                        handleMarkAsRead(notification._id);
                      }
                      setShowNotifications(false);
                    }}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">
                        {notification.type === 'alert' ? (
                          <FaExclamationTriangle className="text-warning me-2" />
                        ) : (
                          <FaInfoCircle className="text-primary me-2" />
                        )}
                        {notification.title}
                      </h6>
                      <small className="text-muted">
                        {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                    <p className="mb-1">{notification.message}</p>
                    <small className="text-muted">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-top text-center">
            <Link 
              to="/notifications" 
              className="text-decoration-none"
              onClick={() => setShowNotifications(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className={`sticky-top ${scrolled ? 'shadow-sm' : ''}`} 
            style={{ 
              backgroundColor: navbarBgColor,
              borderBottom: darkMode ? '1px solid #2c3034' : '1px solid #e9ecef',
              transition: 'background-color 0.3s ease-in-out'
            }}
    >
      <Navbar 
        expand="lg" 
        variant={darkMode ? 'dark' : 'light'}
        className="py-2"
        style={{ backgroundColor: 'transparent' }}
      >
        <Container fluid="lg">
          {/* Brand/Logo */}
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <span className="fw-bold">AddisCare</span>
          </Navbar.Brand>

          {/* Mobile menu button */}
          <div className="d-flex align-items-center order-lg-2 ms-auto">
            {/* Search button (mobile) */}
            <Button 
              variant="link" 
              className={`d-lg-none text-${darkMode ? 'light' : 'dark'} me-2 p-1`}
              onClick={() => setShowSearch(!showSearch)}
              aria-label="Search"
            >
              <FaSearch />
            </Button>

            {/* Theme toggle */}
            <Button 
              variant="link" 
              className={`text-${darkMode ? 'light' : 'dark'} me-2 p-1`}
              onClick={toggleTheme}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </Button>

            {/* Notifications */}
            {isAuthenticated && renderNotificationDropdown()}

            {/* User dropdown or auth buttons */}
            <div className="ms-2">
              {isAuthenticated ? renderUserDropdown() : renderAuthButtons()}
            </div>

            {/* Mobile menu toggle */}
            <Button
              variant="link"
              className={`d-lg-none text-${darkMode ? 'light' : 'dark'} ms-2 p-1`}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle navigation"
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? <FaTimes /> : <FaBars />}
            </Button>
          </div>

          {/* Search form (desktop) */}
          <Form 
            className={`d-none d-lg-flex ms-3 me-auto ${showSearch ? 'd-flex' : ''}`}
            onSubmit={handleSearch}
          >
            <InputGroup>
              <Form.Control
                type="search"
                placeholder="Search..."
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchRef}
                className={darkMode ? 'bg-dark text-light border-secondary' : ''}
              />
              <Button 
                variant={darkMode ? 'outline-light' : 'outline-secondary'}
                type="submit"
              >
                <FaSearch />
              </Button>
            </InputGroup>
          </Form>

          {/* Mobile search form */}
          <Collapse in={showSearch} className="d-lg-none w-100 mt-2">
            <Form onSubmit={handleSearch} className="mb-2">
              <InputGroup>
                <Form.Control
                  type="search"
                  placeholder="Search..."
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={darkMode ? 'bg-dark text-light border-secondary' : ''}
                />
                <Button 
                  variant={darkMode ? 'outline-light' : 'outline-secondary'}
                  type="submit"
                >
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>
          </Collapse>

          {/* Navigation links */}
          <Navbar.Collapse 
            id="basic-navbar-nav" 
            in={showMobileMenu} 
            onToggle={setShowMobileMenu}
            className="order-lg-1"
          >
            <Nav className="me-auto">
              {isAuthenticated ? (
                renderNavLinks()
              ) : (
                <>
                  <Nav.Link as={Link} to="/" active={location.pathname === '/'} className="mx-2">
                    <FaHome className="me-1" /> Home
                  </Nav.Link>
                  <Nav.Link as={Link} to="/about" active={location.pathname === '/about'} className="mx-2">
                    About
                  </Nav.Link>
                  <Nav.Link as={Link} to="/contact" active={location.pathname === '/contact'} className="mx-2">
                    Contact
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;

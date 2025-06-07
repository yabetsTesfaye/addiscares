import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  Navbar, Nav, Container, NavDropdown, 
  Form, InputGroup, Button, Collapse 
} from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  FaUser, FaSignInAlt, FaUserPlus, FaBars, 
  FaHome, FaChartLine, FaFileAlt, FaUsers, 
  FaSearch, FaSun, FaMoon, FaTimes, FaCog, FaSignOutAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NotificationDropdown from '../notifications/NotificationDropdown';

const Header = () => {
  // Context and hooks
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  
  // State management
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Toggle mobile menu
  const toggleMobileMenu = useCallback((show = null) => {
    setShowMobileMenu(prev => show !== null ? show : !prev);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const navbar = document.querySelector('.navbar');
      const toggleButton = document.querySelector('.navbar-toggler');
      
      if (showMobileMenu && 
          !navbar.contains(event.target) && 
          !toggleButton.contains(event.target)) {
        toggleMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileMenu, toggleMobileMenu]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setShowMobileMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial mode
    const initialMode = savedMode !== null ? savedMode === 'true' : prefersDark;
    setDarkMode(initialMode);
    document.documentElement.setAttribute('data-bs-theme', initialMode ? 'dark' : 'light');
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const newMode = e.matches;
      setDarkMode(newMode);
      localStorage.setItem('darkMode', newMode);
      document.documentElement.setAttribute('data-bs-theme', newMode ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navbar background color based on scroll and theme
  const navbarBgColor = scrolled 
    ? (darkMode ? 'rgba(33, 37, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)')
    : 'transparent';

  // Render navigation links based on user role
  const renderNavLinks = () => {
    if (!isAuthenticated) return null;

    const commonLinks = [
      { to: '/', text: 'Home', icon: <FaHome className="me-1" /> },
    ];

    const adminLinks = [
      { to: '/admin/dashboard', text: 'Dashboard', icon: <FaChartLine className="me-1" /> },
      { to: '/admin/reports', text: 'Reports', icon: <FaFileAlt className="me-1" /> },
      { to: '/admin/users', text: 'Users', icon: <FaUsers className="me-1" /> },
    ];

    const reporterLinks = [
      { to: '/reporter/dashboard', text: 'Dashboard', icon: <FaChartLine className="me-1" /> },
      { to: '/reporter/reports', text: 'My Reports', icon: <FaFileAlt className="me-1" /> },
    ];

    const governmentLinks = [
      { to: '/government/dashboard', text: 'Dashboard', icon: <FaChartLine className="me-1" /> },
      { to: '/government/reports', text: 'All Reports', icon: <FaFileAlt className="me-1" /> },
    ];

    let roleLinks = [];
    if (user?.role === 'admin') {
      roleLinks = adminLinks;
    } else if (user?.role === 'reporter') {
      roleLinks = reporterLinks;
    } else if (user?.role === 'government') {
      roleLinks = governmentLinks;
    }

    return [...commonLinks, ...roleLinks].map((link) => (
      <Nav.Link 
        key={link.to} 
        as={Link} 
        to={link.to}
        className={`mx-1 ${location.pathname === link.to ? 'active' : ''}`}
      >
        {link.icon}
        {link.text}
      </Nav.Link>
    ));
  };

  return (
    <header className={`sticky-top ${scrolled ? 'shadow-sm' : ''}`} 
            style={{ 
              backgroundColor: navbarBgColor,
              borderBottom: darkMode ? '1px solid #2c3034' : '1px solid #e9ecef',
              transition: 'background-color 0.3s ease-in-out'
            }}>
      <Navbar 
        expand="lg" 
        className="py-2"
        variant={darkMode ? 'dark' : 'light'}
        style={{
          transition: 'background-color 0.3s ease-in-out',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <Container fluid="lg">
          {/* Brand/Logo */}
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <span className="fw-bold">AddisCare</span>
          </Navbar.Brand>

          {/* Mobile menu toggle */}
          <Navbar.Toggle 
            aria-controls="basic-navbar-nav" 
            onClick={() => toggleMobileMenu(!showMobileMenu)}
            className="border-0"
            style={{
              boxShadow: 'none',
              padding: '0.5rem',
              color: darkMode ? '#fff' : '#000',
            }}
          >
            {showMobileMenu ? <FaTimes size={20} /> : <FaBars size={20} />}
          </Navbar.Toggle>

          {/* Navigation */}
          <Navbar.Collapse 
            id="basic-navbar-nav" 
            in={showMobileMenu} 
            onToggle={setShowMobileMenu} 
            onClick={(e) => e.stopPropagation()}
          >
            <Nav className="me-auto">
              {isAuthenticated ? (
                renderNavLinks()
              ) : (
                <>
                  <Nav.Link as={Link} to="/" className={`mx-1 ${location.pathname === '/' ? 'active' : ''}`}>
                    <FaHome className="me-1" /> Home
                  </Nav.Link>
                  <Nav.Link as={Link} to="/about" className={`mx-1 ${location.pathname === '/about' ? 'active' : ''}`}>
                    About
                  </Nav.Link>
                  <Nav.Link as={Link} to="/contact" className={`mx-1 ${location.pathname === '/contact' ? 'active' : ''}`}>
                    Contact
                  </Nav.Link>
                </>
              )}
            </Nav>

            <div className="d-flex align-items-center">
              {/* Theme Toggle */}
              <Button 
                variant="link" 
                className={`me-2 p-0 text-${darkMode ? 'light' : 'dark'}`}
                onClick={toggleTheme}
                aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              >
                {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              </Button>

              {/* Search */}
              <div className="me-2 position-relative" ref={searchRef}>
                <Button 
                  variant="link" 
                  className={`p-0 me-2 text-${darkMode ? 'light' : 'dark'}`}
                  onClick={() => setShowSearch(!showSearch)}
                  aria-label="Search"
                >
                  <FaSearch size={20} />
                </Button>

                {showSearch && (
                  <div 
                    className="position-absolute end-0 mt-2 p-2 bg-white rounded shadow"
                    style={{
                      minWidth: '250px',
                      zIndex: 1000
                    }}
                  >
                    <Form onSubmit={handleSearch} className="d-flex">
                      <Form.Control
                        type="search"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="me-2"
                      />
                      <Button variant="primary" type="submit">
                        <FaSearch />
                      </Button>
                    </Form>
                  </div>
                )}
              </div>

              {/* Notifications */}
              {isAuthenticated && (
                <div className="me-2">
                  <NotificationDropdown />
                </div>
              )}

              {/* User Dropdown */}
              {isAuthenticated ? (
                <NavDropdown
                  align="end"
                  title={
                    <div className="d-inline-flex align-items-center">
                      <FaUser className="me-1" />
                      <span className="d-none d-md-inline">{user.name || user.email}</span>
                    </div>
                  }
                  id="user-dropdown"
                  className={`nav-link ${darkMode ? 'text-light' : 'text-dark'}`}
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
              ) : (
                <>
                  <Button 
                    variant="outline-primary" 
                    className="me-2" 
                    as={Link} 
                    to="/login"
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
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;

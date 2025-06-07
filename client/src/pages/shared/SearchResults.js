import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import api from '../../utils/api';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState({
    reports: [],
    users: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q');

    if (query) {
      const performSearch = async () => {
        try {
          setResults(prev => ({ ...prev, loading: true }));
          // Adjust the API endpoint based on your backend implementation
          const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
          setResults({
            reports: response.data.reports || [],
            users: response.data.users || [],
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Search error:', error);
          setResults(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch search results. Please try again.'
          }));
        }
      };

      performSearch();
    } else {
      // If no search query, redirect to home
      navigate('/');
    }
  }, [location.search, navigate]);

  if (results.loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Searching...</p>
      </Container>
    );
  }

  if (results.error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          {results.error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4">Search Results</h2>
      
      {/* Reports Section */}
      {results.reports.length > 0 && (
        <div className="mb-5">
          <h4>Reports</h4>
          <Row xs={1} md={2} lg={3} className="g-4">
            {results.reports.map(report => (
              <Col key={report._id}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>{report.title}</Card.Title>
                    <Card.Text className="text-muted">
                      {report.description?.substring(0, 100)}...
                    </Card.Text>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`/reports/${report._id}`)}
                    >
                      View Report
                    </button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Users Section */}
      {results.users.length > 0 && (
        <div className="mb-5">
          <h4>Users</h4>
          <Row xs={1} md={2} lg={3} className="g-4">
            {results.users.map(user => (
              <Col key={user._id}>
                <Card className="h-100">
                  <Card.Body className="text-center">
                    <div className="mb-3">
                      <div className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center" 
                           style={{ width: '80px', height: '80px' }}>
                        <span className="text-white h4 mb-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    </div>
                    <Card.Title>{user.name || 'User'}</Card.Title>
                    <Card.Text className="text-muted text-capitalize">
                      {user.role}
                    </Card.Text>
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate(`/profile/${user._id}`)}
                    >
                      View Profile
                    </button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* No Results */}
      {results.reports.length === 0 && results.users.length === 0 && (
        <Alert variant="info">
          No results found for your search.
        </Alert>
      )}
    </Container>
  );
};

export default SearchResults;

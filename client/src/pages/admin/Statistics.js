import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Pie, Line, Doughnut } from 'react-chartjs-2';
import api from '../../utils/api';
import Spinner from '../../components/layout/Spinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminStatistics = () => {
  const [stats, setStats] = useState(null);
  const [userStats, setUserStats] = useState({
    total: 0,
    reporters: 0,
    government: 0,
    admins: 0,
    active: 0,
    inactive: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching statistics data...');
        // Fetch hazard statistics
        const statsRes = await api.get('/statistics');
        console.log('Statistics API response:', JSON.stringify(statsRes.data, null, 2));
        
        // Log the structure of statusCounts
        if (statsRes.data?.statusCounts) {
          console.log('statusCounts structure:', {
            isArray: Array.isArray(statsRes.data.statusCounts),
            type: typeof statsRes.data.statusCounts,
            keys: Object.keys(statsRes.data.statusCounts),
            values: Object.values(statsRes.data.statusCounts)
          });
        }
        
        setStats(statsRes.data);
        
        // Fetch user statistics
        console.log('Fetching user data...');
        const usersRes = await api.get('/users');
        const allUsers = usersRes.data;
        console.log('Users data:', allUsers);
        
        // Calculate user stats
        const reporters = allUsers.filter(user => user.role === 'reporter').length;
        const government = allUsers.filter(user => user.role === 'government').length;
        const admins = allUsers.filter(user => user.role === 'admin').length;
        const active = allUsers.filter(user => user.status === 'active').length;
        const inactive = allUsers.filter(user => user.status === 'inactive').length;
        
        const userStatsData = {
          total: allUsers.length,
          reporters,
          government,
          admins,
          active,
          inactive
        };
        
        console.log('Processed user stats:', userStatsData);
        setUserStats(userStatsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        if (err.response) {
          console.error('Error response data:', err.response.data);
          console.error('Error status:', err.response.status);
          console.error('Error headers:', err.response.headers);
          
          // If we get a 401, the user might not be authenticated
          if (err.response.status === 401) {
            console.error('Authentication error - user might not be logged in or session expired');
          }
        } else if (err.request) {
          console.error('No response received:', err.request);
        } else {
          console.error('Error setting up request:', err.message);
        }
        setError('Failed to load statistics data. Please check your connection and try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const prepareStatusData = () => {
    if (!stats || !stats.statusCounts) {
      return { labels: [], datasets: [] };
    }

    let statusCountsObj = {};
    
    // Handle both array and object formats
    if (Array.isArray(stats.statusCounts)) {
      // Format: [ { _id: 'pending', count: 5 }, ... ]
      statusCountsObj = stats.statusCounts.reduce((acc, item) => {
        if (item && item._id) {
          acc[item._id] = item.count || 0;
        }
        return acc;
      }, {});
    } else if (typeof stats.statusCounts === 'object') {
      // Format: { pending: 5, in_progress: 3, ... }
      statusCountsObj = { ...stats.statusCounts };
    }

    const labels = Object.keys(statusCountsObj).map(key => 
      key.replace('_', ' ').charAt(0).toUpperCase() + key.replace('_', ' ').slice(1)
    );
    
    const data = Object.values(statusCountsObj);
    
    const backgroundColor = [
      '#ffc107', // pending - yellow
      '#17a2b8', // in_progress - cyan
      '#28a745', // resolved - green
      '#dc3545', // escalated - red
      '#6c757d', // rejected - gray
      '#6f42c1'  // other - purple
    ].slice(0, Math.max(labels.length, 1)); // Ensure we have enough colors

    return {
      labels,
      datasets: [
        {
          label: 'Reports by Status',
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareCategoryData = () => {
    if (!stats || !stats.categoryCounts) {
      return { labels: [], datasets: [] };
    }

    let categoryCountsObj = {};
    
    // Handle both array and object formats
    if (Array.isArray(stats.categoryCounts)) {
      // Format: [ { _id: 'road', count: 5 }, ... ]
      categoryCountsObj = stats.categoryCounts.reduce((acc, item) => {
        if (item && item._id) {
          acc[item._id] = item.count || 0;
        }
        return acc;
      }, {});
    } else if (typeof stats.categoryCounts === 'object') {
      // Format: { road: 5, building: 3, ... }
      categoryCountsObj = { ...stats.categoryCounts };
    }

    const labels = Object.keys(categoryCountsObj).map(key => 
      key.replace('_', ' ').charAt(0).toUpperCase() + key.replace('_', ' ').slice(1)
    );
    
    const data = Object.values(categoryCountsObj);
    
    const backgroundColor = [
      '#fd7e14', // road - orange
      '#6f42c1', // building - purple
      '#20c997', // environment - teal
      '#0d6efd', // public_service - blue
      '#6c757d', // other - gray
      '#ffc107', // yellow for additional categories
      '#dc3545'  // red for additional categories
    ].slice(0, Math.max(labels.length, 1)); // Ensure we have enough colors

    return {
      labels,
      datasets: [
        {
          label: 'Reports by Category',
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareTimeSeriesData = () => {
    if (!stats || !stats.reportsOverTime) {
      return { labels: [], datasets: [] };
    }

    try {
      // Ensure we have an array to work with
      const reportsData = Array.isArray(stats.reportsOverTime) 
        ? stats.reportsOverTime 
        : [];

      // Process the reportsOverTime data to handle different formats:
      // 1. { month: '2025-01', count: 5 }
      // 2. { _id: { year: 2025, month: 1 }, count: 5 }
      // 3. { _id: { year: 2025, month: 5 }, count: 21 }
      const processedData = reportsData.map(item => {
        if (item.month) {
          // Handle format: { month: '2025-01', count: 5 }
          const [year, month] = item.month.split('-').map(Number);
          return { _id: { year, month }, count: item.count };
        } else if (item._id && item._id.year && item._id.month) {
          // Already in correct format: { _id: { year, month }, count }
          return item;
        }
        return null;
      }).filter(Boolean); // Remove any null entries

      if (processedData.length === 0) return { labels: [], datasets: [] };

      // Sort the reports by date (chronological order)
      const sortedReports = [...processedData].sort((a, b) => {
        const yearA = a?._id?.year || 0;
        const yearB = b?._id?.year || 0;
        const monthA = a?._id?.month || 0;
        const monthB = b?._id?.month || 0;
        
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      });

      // Format month names
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      const labels = sortedReports.map(item => {
        const month = item?._id?.month || 1;
        const year = item?._id?.year || new Date().getFullYear();
        return `${monthNames[Math.min(11, Math.max(0, month - 1))]} ${year}`;
      });
      
      const data = sortedReports.map(item => item?.count || 0);

      return {
        labels,
        datasets: [
          {
            label: 'Reports Submitted',
            data,
            fill: false,
            borderColor: '#0d6efd',
            tension: 0.1,
            backgroundColor: 'rgba(13, 110, 253, 0.2)',
          },
        ],
      };
    } catch (error) {
      console.error('Error preparing time series data:', error);
      return { labels: [], datasets: [] };
    }
  };

  const prepareUserRolesData = () => {
    const labels = ['Reporters', 'Government Officials', 'Admins'];
    const data = [userStats.reporters, userStats.government, userStats.admins];
    
    const backgroundColor = [
      'rgba(13, 110, 253, 0.7)',  // reporters - blue
      'rgba(23, 162, 184, 0.7)',  // government - cyan
      'rgba(108, 117, 125, 0.7)'  // admins - gray
    ];

    return {
      labels,
      datasets: [
        {
          label: 'User Roles',
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareUserStatusData = () => {
    const labels = ['Active', 'Inactive'];
    const data = [userStats.active, userStats.inactive];
    
    const backgroundColor = [
      'rgba(40, 167, 69, 0.7)',  // active - green
      'rgba(220, 53, 69, 0.7)'   // inactive - red
    ];

    return {
      labels,
      datasets: [
        {
          label: 'User Status',
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  };

  // Debug log the current state
  useEffect(() => {
    if (stats) {
      console.log('Current stats state:', JSON.parse(JSON.stringify(stats)));
      console.log('statusCounts:', stats.statusCounts);
      console.log('type of statusCounts:', typeof stats.statusCounts);
      console.log('isArray:', Array.isArray(stats.statusCounts));
      console.log('Object.keys(stats.statusCounts):', 
        stats.statusCounts ? Object.keys(stats.statusCounts) : 'N/A');
      
      // Log specific status counts
      if (stats.statusCounts) {
        console.log('Resolved count:', stats.statusCounts.resolved);
        console.log('Pending count:', stats.statusCounts.pending);
        console.log('In Progress count:', stats.statusCounts.in_progress);
        console.log('Escalated count:', stats.statusCounts.escalated);
        console.log('Rejected count:', stats.statusCounts.rejected);
      }
    }
    console.log('Current userStats state:', userStats);
    console.log('Loading state:', loading);
    console.log('Error state:', error);
  }, [stats, userStats, loading, error]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <Container>
        <div className="alert alert-danger">
          <h4>Error Loading Statistics</h4>
          <p>{error}</p>
          <p>Please check the console for more details.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="mb-4">System Statistics</h1>
      
      <h4 className="mb-3">Overview</h4>
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card text-center h-100">
            <Card.Body>
              <h2 className="display-5 fw-bold">{userStats.total || 0}</h2>
              <p className="text-muted mb-0">Total Users</p>
              <div className="small text-muted">
                {userStats.reporters} Reporters • {userStats.government} Gov't • {userStats.admins} Admins
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card text-center h-100">
            <Card.Body>
              <h2 className="display-5 fw-bold">
                {stats?.totalReports !== undefined ? stats.totalReports : 0}
              </h2>
              <p className="text-muted mb-0">Total Reports</p>
              <div className="small text-muted">
                {stats?.categoryCounts ? (
                  Object.entries(stats.categoryCounts).map(([key, value]) => (
                    <span key={key} className="me-2">
                      {value} {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                  ))
                ) : 'No category data'}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card text-center h-100 bg-success bg-opacity-10">
            <Card.Body>
              <h2 className="display-5 fw-bold text-success">
                {stats?.statusCounts?.resolved || 0}
              </h2>
              <p className="text-muted mb-0">Resolved Reports</p>
              <div className="small text-muted">
                {stats?.statusCounts ? (
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    <span className="badge bg-success">
                      {stats.statusCounts.resolved || 0} Resolved
                    </span>
                    <span className="badge bg-warning text-dark">
                      {stats.statusCounts.pending || 0} Pending
                    </span>
                    <span className="badge bg-info text-dark">
                      {stats.statusCounts.in_progress || 0} In Progress
                    </span>
                    <span className="badge bg-danger">
                      {stats.statusCounts.escalated || 0} Escalated
                    </span>
                    <span className="badge bg-secondary">
                      {stats.statusCounts.rejected || 0} Rejected
                    </span>
                  </div>
                ) : 'No status data'}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <Card className="dashboard-card text-center h-100 bg-warning bg-opacity-10">
            <Card.Body>
              <h2 className="display-5 fw-bold text-warning">
                {stats?.avgResolutionTime ? Number(stats.avgResolutionTime).toFixed(1) : '0.0'}
              </h2>
              <p className="text-muted mb-0">Avg. Resolution Time</p>
              <div className="small text-muted">
                {stats?.urgencyLevels ? (
                  Object.entries(stats.urgencyLevels).map(([key, value]) => (
                    <span key={key} className="me-2">
                      {value} {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                  ))
                ) : 'No urgency data'}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <h4 className="mb-3">User Statistics</h4>
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>User Roles Distribution</Card.Header>
            <Card.Body>
              <div className="chart-container">
                <Doughnut 
                  data={prepareUserRolesData()} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>User Status</Card.Header>
            <Card.Body>
              <div className="chart-container">
                <Pie 
                  data={prepareUserStatusData()} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <h4 className="mb-3">Hazard Report Statistics</h4>
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>Reports by Status</Card.Header>
            <Card.Body>
              <div className="chart-container">
                <Pie 
                  data={prepareStatusData()} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Header>Reports by Category</Card.Header>
            <Card.Body>
              <div className="chart-container">
                <Pie 
                  data={prepareCategoryData()} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Header>Reports Over Time</Card.Header>
            <Card.Body>
              <div className="chart-container">
                <Line 
                  data={prepareTimeSeriesData()} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminStatistics;

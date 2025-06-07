const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let reportId = '';

// Test user credentials
const admin = {
  email: 'admin@addiscare.com',
  password: 'password123'
};

const government = {
  email: 'government@addiscare.com',
  password: 'password123'
};

const reporter = {
  email: 'reporter@addiscare.com',
  password: 'password123'
};

// Axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set auth token for subsequent requests
const setAuthToken = (token) => {
  authToken = token;
  api.defaults.headers.common['x-auth-token'] = token;
};

// Log response data with formatting
const logResponse = (title, data) => {
  console.log('\n==============================');
  console.log(`🔹 ${title}`);
  console.log('==============================');
  console.log(JSON.stringify(data, null, 2));
  console.log('------------------------------\n');
};

// Handle errors
const handleError = (error, operation) => {
  console.error(`❌ Error during ${operation}:`);
  if (error.response) {
    console.error(error.response.data);
  } else {
    console.error(error.message);
  }
};

// Test functions
const tests = {
  // 1. Authentication tests
  async testRegister() {
    try {
      const newUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        role: 'reporter'
      };
      
      const res = await api.post('/auth/register', newUser);
      logResponse('REGISTER NEW USER', res.data);
      return res.data.token;
    } catch (error) {
      handleError(error, 'user registration');
    }
  },

  async testLogin(credentials) {
    try {
      const res = await api.post('/auth/login', credentials);
      logResponse('LOGIN USER', res.data);
      return res.data.token;
    } catch (error) {
      handleError(error, 'user login');
    }
  },

  async testGetUserProfile() {
    try {
      const res = await api.get('/auth/user');
      logResponse('GET USER PROFILE', res.data);
      return res.data;
    } catch (error) {
      handleError(error, 'getting user profile');
    }
  },

  // 2. Report tests
  async testCreateReport() {
    try {
      const newReport = {
        title: 'Test Hazard Report',
        description: 'This is a test hazard report created via API',
        location: 'Test Location, Addis Ababa',
        category: 'road'
      };
      
      const res = await api.post('/reports', newReport);
      logResponse('CREATE NEW REPORT', res.data);
      return res.data._id;
    } catch (error) {
      handleError(error, 'creating report');
    }
  },

  async testGetAllReports() {
    try {
      const res = await api.get('/reports');
      logResponse('GET ALL REPORTS', res.data);
    } catch (error) {
      handleError(error, 'getting all reports');
    }
  },

  async testGetSingleReport(id) {
    try {
      const res = await api.get(`/reports/${id}`);
      logResponse('GET SINGLE REPORT', res.data);
    } catch (error) {
      handleError(error, 'getting single report');
    }
  },

  async testAddComment(id) {
    try {
      const comment = {
        text: 'This is a test comment on the hazard report'
      };
      
      const res = await api.post(`/reports/${id}/comment`, comment);
      logResponse('ADD COMMENT TO REPORT', res.data);
    } catch (error) {
      handleError(error, 'adding comment');
    }
  },

  async testVoteOnUrgency(id) {
    try {
      const res = await api.put(`/reports/${id}/vote`);
      logResponse('VOTE ON REPORT URGENCY', res.data);
    } catch (error) {
      handleError(error, 'voting on urgency');
    }
  },

  async testUpdateReportStatus(id) {
    try {
      const update = {
        status: 'in_progress'
      };
      
      const res = await api.put(`/reports/${id}/status`, update);
      logResponse('UPDATE REPORT STATUS', res.data);
    } catch (error) {
      handleError(error, 'updating report status');
    }
  },

  // 3. User management tests
  async testGetAllUsers() {
    try {
      const res = await api.get('/users');
      logResponse('GET ALL USERS', res.data);
      return res.data;
    } catch (error) {
      handleError(error, 'getting all users');
    }
  },

  async testUpdateUserRole(userId) {
    try {
      const update = {
        role: 'government'
      };
      
      const res = await api.put(`/users/${userId}/role`, update);
      logResponse('UPDATE USER ROLE', res.data);
    } catch (error) {
      handleError(error, 'updating user role');
    }
  },

  // 4. Notification tests
  async testSendNotification(recipientId) {
    try {
      const notification = {
        title: 'Test Notification',
        message: 'This is a test notification sent via API',
        recipientId
      };
      
      const res = await api.post('/notifications', notification);
      logResponse('SEND NOTIFICATION', res.data);
      return res.data._id;
    } catch (error) {
      handleError(error, 'sending notification');
    }
  },

  async testGetNotifications() {
    try {
      const res = await api.get('/notifications');
      logResponse('GET NOTIFICATIONS', res.data);
      return res.data;
    } catch (error) {
      handleError(error, 'getting notifications');
    }
  },

  async testMarkNotificationAsRead(notificationId) {
    try {
      const res = await api.put(`/notifications/${notificationId}/read`);
      logResponse('MARK NOTIFICATION AS READ', res.data);
    } catch (error) {
      handleError(error, 'marking notification as read');
    }
  },

  // 5. Statistics tests
  async testGetStatistics() {
    try {
      const res = await api.get('/statistics');
      logResponse('GET STATISTICS', res.data);
    } catch (error) {
      handleError(error, 'getting statistics');
    }
  }
};

// Main test runner
async function runTests() {
  console.log('\n🚀 STARTING ADDISCARE API TESTS 🚀\n');
  
  // 1. Test Authentication
  console.log('\n🔐 TESTING AUTHENTICATION 🔐');
  
  // Register a new user
  await tests.testRegister();
  
  // Login as admin
  const adminToken = await tests.testLogin(admin);
  setAuthToken(adminToken);
  
  // Get admin profile
  await tests.testGetUserProfile();
  
  // Get all users as admin
  const users = await tests.testGetAllUsers();
  
  // 2. Test Reports as reporter
  console.log('\n📝 TESTING REPORTS AS REPORTER 📝');
  
  // Login as reporter
  const reporterToken = await tests.testLogin(reporter);
  setAuthToken(reporterToken);
  
  // Create new report
  reportId = await tests.testCreateReport();
  
  // Get all reports
  await tests.testGetAllReports();
  
  // Get single report
  await tests.testGetSingleReport(reportId);
  
  // Add comment
  await tests.testAddComment(reportId);
  
  // Vote on urgency
  await tests.testVoteOnUrgency(reportId);
  
  // 3. Test Government Official features
  console.log('\n👨‍💼 TESTING GOVERNMENT OFFICIAL FEATURES 👨‍💼');
  
  // Login as government official
  const governmentToken = await tests.testLogin(government);
  setAuthToken(governmentToken);
  
  // Update report status
  await tests.testUpdateReportStatus(reportId);
  
  // Get statistics
  await tests.testGetStatistics();
  
  // 4. Test Admin features
  console.log('\n🔧 TESTING ADMIN FEATURES 🔧');
  
  // Login as admin again
  setAuthToken(adminToken);
  
  // Update user role (if there are users)
  if (users && users.length > 0) {
    // Find a user that's not already admin
    const userToUpdate = users.find(user => user.role !== 'admin');
    if (userToUpdate) {
      await tests.testUpdateUserRole(userToUpdate._id);
    }
  }
  
  // 5. Test Notifications
  console.log('\n🔔 TESTING NOTIFICATIONS 🔔');
  
  // Send notification as admin
  if (users && users.length > 0) {
    const notificationId = await tests.testSendNotification(users[0]._id);
    
    // Login as the recipient
    const recipientToken = await tests.testLogin({
      email: users[0].email,
      password: 'password123' // Assuming the password is the same as in seed data
    });
    
    if (recipientToken) {
      setAuthToken(recipientToken);
      
      // Get notifications
      await tests.testGetNotifications();
      
      // Mark notification as read
      if (notificationId) {
        await tests.testMarkNotificationAsRead(notificationId);
      }
    }
  }
  
  console.log('\n✅ ALL TESTS COMPLETED ✅\n');
}

// Run all tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});

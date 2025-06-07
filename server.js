const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { setupSwagger } = require('./swagger');
const checkUserStatus = require('./middleware/checkUserStatus');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/addiscare';
const PORT = process.env.PORT || 3001;

// Set mongoose options for better reliability
mongoose.set('strictQuery', false);

// Enable debug mode for mongoose to see detailed logs
mongoose.set('debug', true);

// MongoDB connection options for Mongoose 7+
const mongooseOptions = {
  // Connection timeouts
  serverSelectionTimeoutMS: 30000,  // Increased timeout for server selection
  socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity
  connectTimeoutMS: 30000,          // Increased initial connection timeout
  
  // Connection pool settings
  maxPoolSize: 10,                  // Maximum number of connections in the connection pool
  minPoolSize: 1,                   // Minimum number of connections in the connection pool
  
  // Write concern
  w: 'majority',                    // Write concern for replica set
  
  // SSL/TLS options for Atlas - try with and without these if connection fails
  ssl: true,                       // Use SSL for Atlas
  tls: true,                       // Use TLS for Atlas
  tlsAllowInvalidCertificates: false, // Validate SSL certificate
  
  // Retry options
  retryWrites: true,               // Retry write operations if they fail
  retryReads: true,                // Retry read operations if they fail
  
  // Authentication
  authMechanism: 'SCRAM-SHA-1',     // Explicitly set authentication mechanism
  authSource: 'admin'               // Authentication database
};

// Enable Mongoose debugging
mongoose.set('debug', process.env.NODE_ENV !== 'production');

// Global connection state
global.isMongoConnected = false;

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:3000',  // Allow frontend to access the API
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With'],
  credentials: true,  // Allow cookies to be sent cross-origin
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 hours
  exposedHeaders: ['x-auth-token'] // Expose custom headers to the client
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Set proper cache control for images
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif')) {
      res.set('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// API Routes
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const appealRoutes = require('./routes/appealRoutes');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const statisticsRoutes = require('./routes/statistics');
const searchRoutes = require('./routes/search');

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/search', searchRoutes);

// Setup Swagger documentation
setupSwagger(app);



// Remove the middleware that enables mock data
app.use((req, res, next) => {
  // Simply pass through all requests
  next();
});

// Add a mock auth endpoint that always works
app.post('/api/mock-auth/login', (req, res) => {
  const { email, password } = req.body;
  // Simple mock authentication
  if (email && password === 'password123') {
    const mockToken = 'mock_jwt_token_for_development';
    res.json({ token: mockToken });
  } else {
    res.status(400).json({ msg: 'Invalid credentials' });
  }
});



// MongoDB connection event handlers
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('ℹ️  MongoDB disconnected');
});

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Add a test endpoint to check MongoDB connection
app.get('/api/test-connection', async (req, res) => {
  try {
    // Try to ping the database
    await mongoose.connection.db.admin().ping();
    res.json({ 
      status: 'success', 
      message: 'Successfully connected to MongoDB',
      mongoConnected: global.isMongoConnected
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to connect to MongoDB',
      error: error.message,
      mongoConnected: global.isMongoConnected
    });
  }
});

// Add a status endpoint to check server and database status
app.get('/api/status', (req, res) => {
  const status = {
    server: 'running',
    database: global.isMongoConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage()
  };
  res.json(status);
});

// Start the server
const startServer = async () => {
  try {
    // Start the Express server first
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
      console.log(`🔍 Status endpoint: http://localhost:${PORT}/api/status`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') throw error;
      
      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Connect to MongoDB with detailed logging
    console.log('🔌 Attempting to connect to MongoDB...');
    
    // Ensure we're using the correct database name (all lowercase)
    const dbName = 'addiscare';
    const mongoUri = MONGODB_URI.replace(/\/\w+\?/, `/${dbName}?`);
    
    console.log(`🌐 Using MongoDB URI: ${mongoUri.split('@')[1]?.split('?')[0] || 'local database'}`);
    
    // Connect to MongoDB with a timeout and retry logic
    const connectWithRetry = async (attempt = 1, maxAttempts = 5) => {
      const startTime = Date.now();
      try {
        console.log(`\n🔍 Attempt ${attempt} of ${maxAttempts} to connect to MongoDB...`);
        
        // Log connection details (without credentials)
        const dbInfo = MONGODB_URI.match(/@([^?]+)/);
        console.log(`🌐 Connecting to: ${dbInfo ? dbInfo[1] : 'MongoDB instance'}`);
        
        // Set a timeout for the connection attempt (longer timeout for first attempt)
        const timeoutDuration = attempt === 1 ? 15000 : 10000;
        console.log(`🔄 Attempting to connect with URI: ${mongoUri.split('//')[0]}//***@${mongoUri.split('@')[1]}`);
        
        const connectionPromise = mongoose.connect(mongoUri, {
          ...mongooseOptions,
          dbName: dbName,  // Explicitly set the database name
          retryWrites: true,
          w: 'majority'
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Connection timeout after ${timeoutDuration}ms`)), timeoutDuration)
        );
        
        // Race the connection attempt against the timeout
        await Promise.race([connectionPromise, timeoutPromise]);
        
        // Verify the connection by pinging the database
        await mongoose.connection.db.admin().ping();
        
        // If we get here, connection was successful
        const connectionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        global.isMongoConnected = true;
        console.log(`✅ MongoDB Connected Successfully in ${connectionTime}s`);
        return true;
      } catch (error) {
        const errorTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`\n❌ Connection attempt ${attempt} failed after ${errorTime}s: ${error.message}`);
        
        if (attempt >= maxAttempts) {
          console.error(`\n❌❌ Failed to connect to MongoDB after ${maxAttempts} attempts`);
          
          // Detailed error analysis
          console.log('\n🔧 Detailed Error Analysis:');
          if (error.message.includes('ENOTFOUND')) {
            console.log('🔹 DNS resolution failed - Check your internet connection and DNS settings');
          } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
            console.log('🔹 Connection timed out or refused - Check if MongoDB is running and accessible');
            console.log('   - Verify the hostname and port are correct');
            console.log('   - Check if a firewall is blocking the connection');
          } else if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
            console.log('🔹 Authentication failed - Check your username and password');
            console.log('   - Verify your credentials in the .env file');
            console.log('   - Check if the database user has the correct permissions');
          } else if (error.message.includes('self signed certificate')) {
            console.log('🔹 SSL certificate validation failed');
            console.log('   - If using self-signed certificates, set tlsAllowInvalidCertificates: true');
          }
          
          console.log('\n🔧 Troubleshooting Steps:');
          console.log('1. Check your internet connection');
          console.log('2. Verify your IP is whitelisted in MongoDB Atlas');
          console.log('3. Check if MongoDB Atlas cluster is running and accessible');
          console.log('4. Try connecting with MongoDB Compass using the same connection string');
          console.log('5. Check for any network restrictions or firewalls');
          console.log('6. Verify your MongoDB Atlas connection string in the .env file');
          
          return false;
        }
        
        // Calculate delay with exponential backoff and jitter
        const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
        const jitter = Math.floor(Math.random() * 1000);
        const delay = baseDelay + jitter;
        
        console.log(`⏳ Retrying in ${(delay/1000).toFixed(1)} seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Clear mongoose state before retrying
        await mongoose.disconnect().catch(() => {});
        
        return connectWithRetry(attempt + 1, maxAttempts);
      }
    };
    
    // Start the MongoDB connection in the background
    connectWithRetry().then(success => {
      if (success) {
        console.log('✅ MongoDB connection established successfully');
      } else {
        console.warn('⚠️  Running in limited mode without database connection');
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') throw error;
      
      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('\nTroubleshooting Tips:');
    console.log('1. Check if MongoDB is running and accessible');
    console.log('2. Verify your MongoDB connection string in the .env file');
    console.log('3. Make sure your IP is whitelisted in MongoDB Atlas if using Atlas');
    console.log('4. Check your internet connection');
    process.exit(1);
  }
};

// Start the application
startServer();

// Get the default connection
const db = mongoose.connection;

// Event listeners
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  global.isMongoConnected = false;
});

db.on('disconnected', () => {
  console.log('MongoDB disconnected');
  global.isMongoConnected = false;
});

db.on('reconnected', () => {
  console.log('MongoDB reconnected');
  global.isMongoConnected = true;
});

db.on('connected', () => {
  console.log('MongoDB connected');
  global.isMongoConnected = true;
});

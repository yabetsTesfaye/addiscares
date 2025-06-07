const express = require('express');
const router = express.Router();
const cors = require('cors');
const mongoose = require('mongoose');
const { auth, admin } = require('../middleware/auth');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { notificationValidation, bulkNotificationValidation } = require('../middleware/validate');

// CORS configuration for all notification routes
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Apply CORS to all notification routes
router.use(cors(corsOptions));

// Handle preflight requests for all routes
router.options('*', cors(corsOptions));

// Get sent notifications for the current user
router.get('/sent', auth, async (req, res) => {
  try {
    console.log(`Getting sent notifications for user ${req.user.id}`);
    
    // Only show notifications where the current user is the sender
    // Include even those that have been soft-deleted
    const sentNotifications = await Notification.find({ 
      sender: req.user.id,
      isDeleted: { $ne: true } // Don't show hard-deleted notifications
    })
    .populate('recipient', 'name email role')
    .sort({ createdAt: -1 });
    
    // For each notification, add info about who has hidden it
    const detailedNotifications = await Promise.all(sentNotifications.map(async notification => {
      // Get list of users who have read this notification
      const readByUsers = notification.readBy || [];
      
      // Check if current user has read this notification
      const readByUser = readByUsers.some(entry => {
        if (!entry.user) return false;
        const entryUserId = entry.user._id ? entry.user._id.toString() : entry.user.toString();
        const userIdStr = req.user.id.toString();
        return entryUserId === userIdStr;
      });
      
      // Get list of users who have hidden this notification
      const hiddenByCount = notification.hiddenFor ? notification.hiddenFor.length : 0;
      
      // Return enriched notification
      return {
        ...notification.toObject(),
        readByUser: readByUser || false,
        stats: {
          readCount: readByUsers.length,
          hiddenCount: hiddenByCount
        },
        wasModified: notification.lastModifiedAt ? true : false
      };
    }));
    
    res.json(detailedNotifications);
  } catch (err) {
    console.error('Error fetching sent notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all notifications for the current user
router.get('/', auth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, attempting to reconnect...');
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Successfully reconnected to MongoDB');
      } catch (err) {
        console.error('Failed to reconnect to MongoDB:', err);
        console.log('Returning mock notifications');
        
        // Generate mock notifications based on user role
        const mockNotifications = [
          {
            _id: '507f1f77bcf86cd799439201',
            title: 'New Report Assigned',
            message: 'A new hazard report has been assigned to you for review',
            recipient: req.user.id,
            sender: {
              _id: '507f1f77bcf86cd799439011',
              name: 'System Admin'
            },
            reportId: {
              _id: '507f1f77bcf86cd799439101',
              title: 'Pothole on Main Street'
            },
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
          },
          {
            _id: '507f1f77bcf86cd799439202',
            title: 'Report Status Updated',
            message: 'The status of your report has been updated to "in progress"',
            recipient: req.user.id,
            sender: {
              _id: '507f1f77bcf86cd799439012',
              name: 'Government Official'
            },
            reportId: {
              _id: '507f1f77bcf86cd799439102',
              title: 'Broken Street Light'
            },
            read: true,
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          },
          {
            _id: '507f1f77bcf86cd799439203',
            title: 'New Comment on Report',
            message: 'Someone has commented on a report you submitted',
            recipient: req.user.id,
            sender: {
              _id: '507f1f77bcf86cd799439013',
              name: 'Reporter User'
            },
            reportId: {
              _id: '507f1f77bcf86cd799439103',
              title: 'Garbage Collection Missed'
            },
            read: false,
            createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
          }
        ];
        
        return res.json(mockNotifications);
      }
    }
    
    console.log('Fetching notifications for user:', req.user.id);
    
    // Build the base query conditions
    const orConditions = [
      { isBroadcast: true }  // Always include broadcast messages
    ];
    
    // Add role-based conditions if user has a role
    if (req.user?.role) {
      orConditions.push({
        'recipients.role': req.user.role,
        'recipients.user': { $exists: false }
      });
    }
    
    // Add direct recipient conditions if user is logged in
    if (req.user?._id) {
      orConditions.push(
        { recipient: req.user._id },
        { 'recipients.user': req.user._id }
      );
    }
    
    // Build the final query
    const query = {
      $and: [
        { $or: orConditions },
        { hiddenFor: { $ne: req.user?._id || null } },
        { sender: { $ne: req.user?._id || null } }
      ]
    };
    
    console.log('Running notification query:', JSON.stringify(query, null, 2));
    
    // First, check MongoDB connection
    const db = mongoose.connection;
    if (db.readyState !== 1) {
      console.error('MongoDB is not connected, cannot fetch notifications');
      return res.status(500).json({ message: 'Database connection error' });
    }
    
    console.log('MongoDB connection state:', db.states[db.readyState]);
    
    // Check if we have any notifications in the database
    console.log('Checking for existing notifications with query:', JSON.stringify(query, null, 2));
    const notificationCount = await Notification.countDocuments(query).catch(err => {
      console.error('Error counting notifications:', err);
      return 0;
    });
    console.log(`Found ${notificationCount} notifications in database`);
    
    if (notificationCount === 0 && process.env.NODE_ENV === 'development') {
      console.log('No notifications found, creating sample data...');
      
      // Clear any existing notifications first to avoid duplicates
      await Notification.deleteMany({}).catch(console.error);
      
      try {
        console.log('Creating sample notification...');
        
        // Create a simple notification that will definitely match our query
        const sampleNotification = new Notification({
          title: 'Welcome to AddisCare',
          message: 'Thank you for using AddisCare. This is a sample notification.',
          isBroadcast: true,
          type: 'info',
          readBy: [],
          recipients: [
            {
              role: req.user?.role || 'admin',
              read: false
            }
          ],
          hiddenFor: []
        });
        
        console.log('Creating sample notification:', sampleNotification);
        
        // Save the notification
        await sampleNotification.save();
        
        // Update the query to find the new notification
        query = { _id: sampleNotification._id };
      } catch (err) {
        console.error('Error creating sample notification:', err);
      }
    }
    
    // Get all notifications that should be visible to this user
    const notifications = await Notification.aggregate([
      {
        $match: query
      },
      // Sort by creation date, newest first
      { $sort: { createdAt: -1 } },
      // Lookup sender details
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      // Add a field to check if the current user has read the notification
      {
        $addFields: {
          readByUser: {
            $cond: {
              if: { 
                $and: [
                  { $isArray: '$readBy' },
                  { $ne: [req.user?._id, undefined] },
                  { $ne: [req.user?._id, null] }
                ]
              },
              then: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$readBy',
                        as: 'read',
                        cond: { 
                          $or: [
                            { $eq: ['$$read.user', req.user._id] },
                            { $eq: [{ $toString: '$$read.user' }, String(req.user._id)] },
                            { $eq: [{ $toString: '$$read.user._id' }, String(req.user._id)] }
                          ]
                        }
                      }
                    }
                  },
                  0
                ]
              },
              else: false
            }
          },
          // Add read status based on readByUser and global read flag
          read: {
            $cond: {
              if: { $and: [
                { $eq: ['$readByUser', true] },
                { $eq: ['$read', true] }
              ] },
              then: true,
              else: false
            }
          }
        }
      },
      // Only include necessary fields
      {
        $project: {
          _id: 1,
          title: 1,
          message: 1,
          isBroadcast: 1,
          recipients: 1,
          'sender._id': 1,
          'sender.name': 1,
          'sender.email': 1,
          readByUser: 1,
          read: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    console.log(`Returning ${notifications.length} notifications`);
    if (notifications.length > 0) {
      console.log('First notification sample:', {
        _id: notifications[0]._id,
        title: notifications[0].title,
        sender: notifications[0].sender,
        readByUser: notifications[0].readByUser,
        createdAt: notifications[0].createdAt
      });
    }
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    if (err.code === 'ECONNREFUSED') {
      console.error('MongoDB connection refused. Is the database running?');
      return res.status(500).json({ 
        message: 'Database connection error',
        error: 'Could not connect to database',
        code: 'DB_CONNECTION_ERROR'
      });
    }
    res.status(500).json({ 
      message: 'Server Error',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   GET /api/notifications/sent
// @desc    Get all notifications sent by current user
// @access  Private
router.get('/sent', auth, async (req, res) => {
  try {
    const notifications = await Notification.aggregate([
      {
        $match: {
          sender: req.user._id,
          hiddenFor: { $ne: req.user._id }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'recipient',
          foreignField: '_id',
          as: 'recipient'
        }
      },
      { $unwind: { path: '$recipient', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'recipients.user',
          foreignField: '_id',
          as: 'recipients.user'
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          title: 1,
          message: 1,
          type: 1,
          recipient: 1,
          recipients: 1,
          reportId: 1,
          readBy: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching sent notifications:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
  try {
    // Ensure user is properly authenticated
    if (!req.user || !req.user._id) {
      console.error('No authenticated user found or user ID is undefined');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user._id;
    const userRole = req.user.role;

    console.log('Fetching unread count for user:', { userId, userRole });
    
    // Build the base query conditions
    const orConditions = [
      { isBroadcast: true }  // Always include broadcast messages
    ];
    
    // Add role-based conditions if user has a role
    if (userRole) {
      orConditions.push({
        'recipients.role': userRole,
        'recipients.user': { $exists: false }
      });
    }
    
    // Add direct recipient conditions
    orConditions.push(
      { recipient: userId },
      { 'recipients.user': userId }
    );
    
    // First, get all notifications for the user (matching the same query as the main notifications endpoint)
    const notifications = await Notification.find({
      $and: [
        { $or: orConditions },
        { hiddenFor: { $ne: userId } },
        { sender: { $ne: userId } }
      ]
    }).lean();
    
    // Now filter for unread notifications on the server side
    const unreadNotifications = notifications.filter(notification => {
      // A notification is unread if:
      // 1. It's not marked as read globally AND not marked as read by the user, OR
      // 2. It's a broadcast and the user hasn't read it yet
      const isReadByUser = notification.readBy?.some(r => r.user.toString() === userId.toString());
      return !isReadByUser;
    });
    
    const count = unreadNotifications.length;
    
    console.log('Unread count result:', { 
      userId, 
      count,
      totalNotifications: notifications.length,
      query: JSON.stringify({
        $and: [
          { $or: orConditions },
          { hiddenFor: { $ne: userId } },
          { sender: { $ne: userId } }
        ]
      }, null, 2)
    });
    
    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ 
      message: 'Server Error',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get all notifications with user information
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching notifications for user:', req.user.id);
    
    // Build the base query conditions
    const orConditions = [
      { isBroadcast: true }  // Always include broadcast messages
    ];
    
    // Add role-based conditions if user has a role
    if (req.user?.role) {
      orConditions.push({
        'recipients.role': req.user.role,
        'recipients.user': { $exists: false }
      });
    }
    
    // Add direct recipient conditions if user is logged in
    if (req.user?._id) {
      orConditions.push(
        { recipient: req.user._id },
        { 'recipients.user': req.user._id }
      );
    }
    
    // Build the final query
    const query = {
      $and: [
        { $or: orConditions },
        { hiddenFor: { $ne: req.user?._id || null } },
        { sender: { $ne: req.user?._id || null } }
      ]
    };
    
    console.log('Running notification query:', JSON.stringify(query, null, 2));
    
    // First, check MongoDB connection
    const db = mongoose.connection;
    if (db.readyState !== 1) {
      console.error('MongoDB is not connected, cannot fetch notifications');
      return res.status(500).json({ message: 'Database connection error' });
    }
    
    console.log('MongoDB connection state:', db.states[db.readyState]);
    
    // Check if we have any notifications in the database
    console.log('Checking for existing notifications with query:', JSON.stringify(query, null, 2));
    const notificationCount = await Notification.countDocuments(query).catch(err => {
      console.error('Error counting notifications:', err);
      return 0;
    });
    console.log(`Found ${notificationCount} notifications in database`);
    
    // Get all notifications that should be visible to this user
    const notifications = await Notification.aggregate([
      {
        $match: query
      },
      // Sort by creation date, newest first
      { $sort: { createdAt: -1 } },
      // Lookup sender details
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      // Add a field to check if the current user has read the notification
      {
        $addFields: {
          readByUser: {
            $cond: {
              if: { 
                $and: [
                  { $isArray: '$readBy' },
                  { $ne: [req.user?._id, undefined] },
                  { $ne: [req.user?._id, null] }
                ]
              },
              then: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$readBy',
                        as: 'read',
                        cond: { 
                          $or: [
                            { $eq: ['$$read.user', req.user._id] },
                            { $eq: [{ $toString: '$$read.user' }, String(req.user._id)] },
                            { $eq: [{ $toString: '$$read.user._id' }, String(req.user._id)] }
                          ]
                        }
                      }
                    }
                  },
                  0
                ]
              },
              else: false
            }
          },
          // Add read status based on readByUser and global read flag
          read: {
            $cond: {
              if: { $and: [
                { $eq: ['$readByUser', true] },
                { $eq: ['$read', true] }
              ] },
              then: true,
              else: false
            }
          }
        }
      },
      // Only include necessary fields
      {
        $project: {
          _id: 1,
          title: 1,
          message: 1,
          isBroadcast: 1,
          recipients: 1,
          'sender._id': 1,
          'sender.name': 1,
          'sender.email': 1,
          readByUser: 1,
          read: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    console.log(`Returning ${notifications.length} notifications`);
    if (notifications.length > 0) {
      console.log('First notification sample:', {
        _id: notifications[0]._id,
        title: notifications[0].title,
        sender: notifications[0].sender,
        readByUser: notifications[0].readByUser,
        createdAt: notifications[0].createdAt
      });
    }
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    if (err.code === 'ECONNREFUSED') {
      console.error('MongoDB connection refused. Is the database running?');
      return res.status(500).json({ 
        message: 'Database connection error',
        error: 'Could not connect to database',
        code: 'DB_CONNECTION_ERROR'
      });
    }
    res.status(500).json({ 
      message: 'Server Error',
      error: err.message,
    });
  }
});

// Mark notification as read - OPTIONS for CORS
router.options('/:id/read', (req, res) => {
  // Handle preflight requests
  res.header('Access-Control-Allow-Methods', 'GET, PUT, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).end();
});

// Alias PATCH to PUT for marking notifications as read
router.patch('/:id/read', (req, res, next) => {
  // Convert PATCH to PUT for backward compatibility
  req.method = 'PUT';
  next();
});

// Handle OPTIONS request for mark-all-read (CORS preflight)
router.options('/mark-all-read', (req, res) => {
  // Handle preflight requests
  res.header('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).end();
});

// Mark all notifications as read for the current user
router.patch('/mark-all-read', auth, async (req, res) => {
  // Set CORS headers for the actual request
  const origin = req.headers.origin || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'x-auth-token');
  
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] ${message}`, JSON.stringify(data, null, 2));
  }
  
  try {
    const userId = req.user.id;
    
    log('Mark all as read request received', { userId });
    
    // Call the model method to mark all notifications as read
    const result = await Notification.markAllAsRead(userId);
    
    log('Successfully marked all notifications as read', { 
      userId, 
      count: result.count 
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      message: result.message,
      count: result.count
    });
    
  } catch (error) {
    log('Error marking all notifications as read', {
      message: error.message,
      stack: error.stack
    });
    
    const status = error.status || 500;
    const message = status === 500 ? 'Server error' : error.message;
    
    res.status(status).json({
      success: false,
      message: message
    });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  // Set CORS headers for the actual request
  const origin = req.headers.origin || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'x-auth-token');
  
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] ${message}`, JSON.stringify(data, null, 2));
  }
  
  try {
    const { id: notificationId } = req.params;
    const { id: userId, role: userRole } = req.user;
    
    log('Mark as read request received', { 
      notificationId, 
      userId, 
      userRole,
      headers: req.headers
    });
    
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      log('MongoDB disconnected, handling mock response');
      return res.status(200).json({ 
        success: true, 
        message: 'Notification marked as read (mock)' 
      });
    }
    
    // Use the static method which handles all the logic
    const updatedNotification = await Notification.markAsRead(notificationId, userId);
    
    if (!updatedNotification) {
      throw new Error('Failed to mark notification as read');
    }
    
    log('Notification marked as read successfully', { 
      notificationId: updatedNotification._id,
      read: updatedNotification.read,
      readBy: updatedNotification.readBy ? updatedNotification.readBy.length : 0,
      readByUser: updatedNotification.readBy ? updatedNotification.readBy.some(entry => 
        entry.user && entry.user.toString() === userId
      ) : false
    });
    
    // Format the response with more detailed information
    const userReadEntry = updatedNotification.readBy && updatedNotification.readBy.find(entry => {
      if (!entry.user) return false;
      const entryId = entry.user._id || entry.user;
      const entryIdStr = entryId.toString();
      const userIdStr = userId.toString();
      return entryIdStr === userIdStr;
    });
    
    // Create a clean notification response object
    const response = {
      success: true,
      message: 'Notification marked as read',
      notification: {
        _id: updatedNotification._id,
        title: updatedNotification.title,
        message: updatedNotification.message,
        type: updatedNotification.recipient ? 'direct' : 'bulk',
        // Read status information
        isRead: !!userReadEntry,
        readByUser: !!userReadEntry,
        readAt: userReadEntry ? userReadEntry.readAt : null,
        // Stats
        readByCount: updatedNotification.readBy ? updatedNotification.readBy.length : 0,
        totalRecipients: updatedNotification.recipients 
          ? updatedNotification.recipients.length 
          : (updatedNotification.recipient ? 1 : 0)
      }
    };
    
    log('Sending response', { response });
    return res.json(response);
    
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to mark notification as read';
    
    log('Error in mark as read endpoint', { 
      error: message,
      status,
      details: err.details || {},
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    return res.status(status).json({
      success: false,
      message,
      details: err.details || {}
    });
  }
});

// Hide notification (soft delete)
router.put('/:id/hide', auth, async (req, res) => {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] ${message}`, JSON.stringify(data, null, 2));
  }
  
  try {
    const { id: notificationId } = req.params;
    const { id: userId, role: userRole } = req.user;
    
    log('Hide notification request received', { notificationId, userId, userRole });
    
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      log('MongoDB disconnected, handling mock response');
      return res.status(200).json({ 
        success: true, 
        message: 'Notification hidden (mock)' 
      });
    }
    
    // Use the static method to hide the notification
    const updatedNotification = await Notification.hideNotification(notificationId, userId);
    
    if (!updatedNotification) {
      throw new Error('Failed to hide notification');
    }
    
    log('Notification hidden successfully', { 
      notificationId: updatedNotification._id,
      hiddenFor: updatedNotification.hiddenFor ? updatedNotification.hiddenFor.length : 0
    });
    
    // We don't need to get updated unread count when user intentionally hides a notification
    // This prevents the counter from increasing when a user archives notifications
    
    return res.status(200).json({
      success: true,
      message: 'Notification hidden successfully'
      // Not returning unreadCount as per user's request to avoid counter changes when archiving
    });
    
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to hide notification';
    
    log('Error in hide notification endpoint', { 
      error: message,
      status,
      details: err.details || {},
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    return res.status(status).json({
      success: false,
      message,
      details: err.details || {}
    });
  }
});

// Hard delete notification (complete removal)
router.delete('/:id', auth, async (req, res) => {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] ${message}`, JSON.stringify(data, null, 2));
  }
  
  try {
    const { id: notificationId } = req.params;
    const { id: userId, role: userRole } = req.user;
    
    log('Delete notification request received', { notificationId, userId, userRole });
    
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      log('MongoDB disconnected, handling mock response');
      return res.status(200).json({ 
        success: true, 
        message: 'Notification deleted (mock)' 
      });
    }
    
    // Use the static method to delete the notification
    // Pass true for isAdmin if user is admin
    const result = await Notification.deleteNotification(
      notificationId, 
      userId, 
      userRole === 'admin'
    );
    
    if (!result || !result.deleted) {
      throw new Error('Failed to delete notification');
    }
    
    log('Notification deleted successfully', { 
      notificationId,
      hardDeleted: result.hardDeleted
    });
    
    return res.status(200).json({
      success: true,
      message: `Notification ${result.hardDeleted ? 'permanently' : 'soft'} deleted successfully`
    });
    
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to delete notification';
    
    log('Error in delete notification endpoint', { 
      error: message,
      status,
      details: err.details || {},
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    return res.status(status).json({
      success: false,
      message,
      details: err.details || {}
    });
  }
});

// Modify notification (admin, official, or creator only)
router.put('/:id/modify', auth, async (req, res) => {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] ${message}`, JSON.stringify(data, null, 2));
  }
  
  try {
    const { id: notificationId } = req.params;
    const { id: userId, role: userRole } = req.user;
    const updates = req.body;
    
    // Validate request body
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }
    
    // Only allow title and message to be updated
    const allowedUpdates = {};
    if (updates.title) allowedUpdates.title = updates.title;
    if (updates.message) allowedUpdates.message = updates.message;
    
    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid updates provided'
      });
    }
    
    log('Modify notification request received', { 
      notificationId, 
      userId, 
      userRole,
      updates: allowedUpdates
    });
    
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      log('MongoDB disconnected, handling mock response');
      return res.status(200).json({ 
        success: true, 
        message: 'Notification modified (mock)' 
      });
    }
    
    // Use the static method to modify the notification
    const updatedNotification = await Notification.modifyNotification(
      notificationId, 
      userId,
      allowedUpdates,
      userRole
    );
    
    if (!updatedNotification) {
      throw new Error('Failed to modify notification');
    }
    
    log('Notification modified successfully', { 
      notificationId: updatedNotification._id,
      title: updatedNotification.title,
      modifiedAt: updatedNotification.lastModifiedAt
    });
    
    return res.status(200).json({
      success: true,
      message: 'Notification modified successfully',
      notification: {
        _id: updatedNotification._id,
        title: updatedNotification.title,
        message: updatedNotification.message,
        lastModifiedAt: updatedNotification.lastModifiedAt,
        lastModifiedBy: updatedNotification.lastModifiedBy
      }
    });
    
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to modify notification';
    
    log('Error in modify notification endpoint', { 
      error: message,
      status,
      details: err.details || {},
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    return res.status(status).json({
      success: false,
      message,
      details: err.details || {}
    });
  }
});

// Hard delete notification (complete removal)
router.delete('/:id', auth, async (req, res) => {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] ${message}`, JSON.stringify(data, null, 2));
  }
  
  try {
    const { id: notificationId } = req.params;
    const { id: userId, role: userRole } = req.user;
    
    log('Delete notification request received', { notificationId, userId, userRole });
    
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      log('MongoDB disconnected, handling mock response');
      return res.status(200).json({ 
        success: true, 
        message: 'Notification deleted (mock)' 
      });
    }
    
    // Use the static method to delete the notification
    // Pass true for isAdmin if user is admin
    const result = await Notification.deleteNotification(
      notificationId, 
      userId, 
      userRole === 'admin'
    );
    
    if (!result || !result.deleted) {
      throw new Error('Failed to delete notification');
    }
    
    log('Notification deleted successfully', { 
      notificationId,
      hardDeleted: result.hardDeleted
    });
    
    return res.status(200).json({
      success: true,
      message: `Notification ${result.hardDeleted ? 'permanently' : 'soft'} deleted successfully`
    });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to delete notification';
    
    log('Error in delete notification endpoint', { 
      error: message,
      status,
      details: err.details || {},
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    return res.status(status).json({
      success: false,
      message,
      details: err.details || {}
    });
  }
});

// Create a new notification (admin only)
router.post('/', [auth, admin, ...notificationValidation], async (req, res) => {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] ${message}`, data);
  }
  
  try {
    const { title, message, recipientId, reportId, isBroadcast, recipients } = req.body;
    
    log('Create notification request received', { 
      title,
      recipientId,
      isBroadcast: !!isBroadcast,
      recipientsCount: recipients?.length || 0
    });
    
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      log('MongoDB disconnected, handling mock response');
      return res.json({
        _id: 'mock-notification-id',
        title,
        message,
        recipient: recipientId || null,
        recipients: recipients || [],
        isBroadcast: !!isBroadcast,
        read: false,
        readBy: [],
        createdAt: new Date().toISOString()
      });
    }
    
    // Mark as read for the sender
    const readBy = [{
      user: req.user.id,
      readAt: new Date()
    }];

    const notification = new Notification({
      title,
      message,
      sender: req.user.id,
      recipient: recipientId,
      recipients: recipients || [],
      isBroadcast: !!isBroadcast,
      report: reportId,
      read: false, // This will be set based on the recipient
      readBy
    });
    
    // If there's a specific recipient and it's not a broadcast, mark as read for the sender only
    if (recipientId && !isBroadcast) {
      notification.read = false; // Unread for recipient
    } else if (isBroadcast) {
      // For broadcasts, mark as read for the sender
      notification.read = false; // Will be unread for recipients
    }
    
    const savedNotification = await notification.save();
    
    // Populate the response
    const result = await Notification.findById(savedNotification._id)
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .populate('recipients.user', 'name email role')
      .populate('readBy.user', 'name email role');
    
    log('Notification created successfully', { notificationId: result._id });
    
    return res.status(201).json({
      success: true,
      notification: result
    });
    
  } catch (err) {
    const message = 'Failed to create notification';
    log(message, { error: err.message });
    
    return res.status(500).json({ 
      success: false, 
      msg: message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Create bulk notifications (admin only)
router.post('/bulk', [auth, admin, ...bulkNotificationValidation], async (req, res) => {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  const log = (message, data = {}) => {
    console.log(`[${new Date().toISOString()}] [${sessionId}] ${message}`, JSON.stringify(data, null, 2));
  };
  
  log('Request received', {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: {
      'content-type': req.headers['content-type'],
      authorization: req.headers.authorization ? '***REDACTED***' : 'none'
    }
  });
  
  try {
    const { title, message, role, reportId } = req.body;
    
    log('Create bulk notification request received', { 
      title, 
      role,
      reportId: reportId || 'not provided',
      body: req.body // Log the full body for debugging
    });
    
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      log('MongoDB disconnected, handling mock response');
      return res.json({
        success: true,
        count: 5, // Mock count
        notifications: Array(5).fill(0).map((_, i) => ({
          _id: `mock-notification-${i}`,
          title,
          message,
          recipients: [{ role }],
          isBroadcast: true,
          read: false,
          readBy: [],
          createdAt: new Date().toISOString()
        }))
      });
    }
    
    // Find all users with the specified role
    const users = await User.find({ role });
    
    if (users.length === 0) {
      log('No users found with role', { role });
      return res.status(404).json({
        success: false,
        msg: `No users found with role: ${role}`
      });
    }
    
    log(`Found ${users.length} users with role ${role}`);
    
    // Create a bulk notification
    const notification = new Notification({
      title,
      message,
      sender: req.user.id,
      recipients: users
        .filter(user => user._id.toString() !== req.user.id) // Exclude sender from recipients
        .map(user => ({
          user: user._id,
          role: user.role
        })),
      isBroadcast: true,
      report: reportId,
      // Mark as read for the sender
      readBy: [{
        user: req.user.id,
        readAt: new Date()
      }],
      // Mark as unread for recipients (will be updated when they read it)
      read: false,
      readBy: []
    });
    
    const savedNotification = await notification.save();
    
    // Populate the response
    const result = await Notification.findById(savedNotification._id)
      .populate('sender', 'name email role')
      .populate('recipients.user', 'name email role')
      .populate('readBy.user', 'name email role');
    
    log('Bulk notification created successfully', { 
      notificationId: result._id,
      recipientCount: users.length 
    });
    
    return res.status(201).json({
      success: true,
      count: users.length,
      notifications: [result]
    });
    
  } catch (err) {
    const message = 'Failed to create bulk notification';
    log(message, { error: err.message });
    
    return res.status(500).json({ 
      success: false, 
      msg: message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;

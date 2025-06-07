const mongoose = require('mongoose');

// Helper to validate notification recipients
const validateRecipients = function(recipients) {
  if (!Array.isArray(recipients)) return false;
  return recipients.every(recipient => {
    // Either role or user must be specified
    const hasRole = recipient.role && ['reporter', 'government', 'admin'].includes(recipient.role);
    const hasUser = recipient.user && mongoose.Types.ObjectId.isValid(recipient.user);
    return hasRole || hasUser;
  });
};

// Helper to check if a user is a recipient of the notification
const isUserRecipient = function(userId, recipients = []) {
  if (!userId) return false;
  
  return recipients.some(recipient => {
    // Check if recipient has a user ID that matches
    if (recipient.user && recipient.user.toString() === userId.toString()) {
      return true;
    }
    
    // If no user is specified but role matches, consider it a match
    // (actual role check should be done at query time)
    return false;
  });
};

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isBroadcast: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: [
      'info', 
      'warning', 
      'success', 
      'error',
      'user_registered',
      'report_created',
      'report_updated',
      'report_resolved',
      'comment_added',
      'status_changed',
      'admin_alert'
    ],
    default: 'info'
  },
  link: String,
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  recipients: [{
    role: {
      type: String,
      required: function() { return !this.user; }
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  hiddenFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedAt: {
    type: Date
  },
  originalContent: {
    title: String,
    message: String
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be longer than 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  // For direct notifications to a single user
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { 
      return !this.isBroadcast && (!this.recipients || this.recipients.length === 0); 
    },
    validate: {
      validator: function(v) {
        return !v || mongoose.Types.ObjectId.isValid(v);
      },
      message: props => `${props.value} is not a valid user ID`
    }
  },
  // For bulk/broadcast notifications
  recipients: {
    type: [{
      role: {
        type: String,
        enum: ['reporter', 'government', 'admin'],
        required: function() { return this.isBroadcast === false; }
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        validate: {
          validator: function(v) {
            return !v || mongoose.Types.ObjectId.isValid(v);
          },
          message: props => `${props.value} is not a valid user ID`
        }
      }
    }],
    validate: {
      validator: function(v) {
        // If recipients is empty, it's valid if there's a direct recipient
        if (!v || v.length === 0) return !!this.recipient || this.isBroadcast;
        return validateRecipients(v);
      },
      message: props => 'Invalid recipients format. Each recipient must have either a valid role or user ID.'
    },
    default: undefined
  },
  // Flag to indicate if this is a broadcast to all users
  isBroadcast: {
    type: Boolean,
    default: false
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: props => `${props.value} is not a valid user ID`
    }
  },
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    validate: {
      validator: function(v) {
        return !v || mongoose.Types.ObjectId.isValid(v);
      },
      message: props => `${props.value} is not a valid report ID`
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  readBy: {
    type: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster querying
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ 'recipients.role': 1, read: 1, createdAt: -1 });
notificationSchema.index({ isBroadcast: 1, read: 1, createdAt: -1 });

// Add instance methods
notificationSchema.methods.hasRead = function(userId) {
  if (!userId) return false;
  return this.readBy.some(entry => entry.user && entry.user.toString() === userId.toString());
};

notificationSchema.methods.markAsRead = async function(userId) {
  console.log(`[markAsRead:instance] Starting for notification ${this._id} and user ${userId}`);
  
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Convert userId to string for comparison
  const userIdStr = userId.toString();
  
  try {
    // Check if already marked as read by this user
    const alreadyRead = this.readBy.some(entry => {
      if (!entry.user) return false;
      const entryUserId = entry.user.toString();
      return entryUserId === userIdStr;
    });
    
    if (alreadyRead) {
      console.log(`[markAsRead:instance] Notification ${this._id} already marked as read by user ${userId}`);
      return this;
    }
    
    // Add user to readBy array with current timestamp
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    
    // Update readByUser flag
    this.readByUser = true;
    
    // For direct notifications or if user is in recipients, set read flag
    if (this.recipient) {
      const recipientId = this.recipient.toString();
      if (recipientId === userIdStr) {
        this.read = true;
      }
    } else if (this.recipients && this.recipients.length > 0) {
      // For bulk notifications, mark as read for the specific user
      const userRecipient = this.recipients.find(r => {
        if (!r.user) return false;
        return r.user.toString() === userIdStr;
      });
      
      if (userRecipient) {
        userRecipient.read = true;
      }
      
      // Check if all recipients have read it
      const allRecipientsRead = this.recipients.every(r => {
        if (!r.user) return true; // Skip role-based recipients
        return this.readBy.some(entry => entry.user.toString() === r.user.toString());
      });
      
      if (allRecipientsRead) {
        this.read = true;
      }
    }
    
    // Save changes
    await this.save();
    
    // Return fresh copy with populated fields
    const result = await this.constructor.findById(this._id)
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .populate('recipients.user', 'name email role')
      .populate('readBy.user', 'name email role')
      .populate('report', 'title status');
    
    return result;
    
  } catch (error) {
    console.error(`[markAsRead:instance] Error:`, error);
    throw error;
  }
};

notificationSchema.statics.findForUser = function(userId, userRole, options = {}) {
  const { read, sort = { createdAt: -1 }, skip = 0, limit = 10 } = options;
  
  // First, add a query condition to exclude notifications hidden by this user
  const hiddenCondition = { 'hiddenFor': { $ne: mongoose.Types.ObjectId(userId) } };
  
  // Base query for notifications that should be visible to this user
  // For reporters/consumers, include automatic notifications
  // For owners/admins, only include notifications explicitly for them
  const directQuery = {
    $and: [
      {
        $or: [
          { recipient: userId },
          { 'recipients.user': userId },
          // Only include role-based (automatic) notifications for reporters
          ...(userRole === 'reporter' ? [{ 'recipients.role': userRole }] : [])
        ]
      },
      hiddenCondition
    ]
  };

  // For admin, show all notifications except hidden ones
  const query = userRole === 'admin' ? hiddenCondition : directQuery;

  console.log(`[findForUser] Query for user ${userId} (${userRole}):`, JSON.stringify(query, null, 2));

  // Use aggregation to properly handle read status for the current user
  return this.aggregate([
    { $match: query },
    {
      $addFields: {
        // Add a field to check if the current user has read the notification
        readByUser: {
          $cond: {
            if: { $isArray: '$readBy' },
            then: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: '$readBy',
                      as: 'read',
                      cond: { 
                        $eq: [
                          { $toString: '$$read.user' },
                          { $toString: userId }
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
        // Keep the original read status for backward compatibility
        read: '$read'
      }
    },
    // Filter by read status if specified
    ...(typeof read === 'boolean' ? [
      { $match: { readByUser: read } }
    ] : []),
    // Sort, skip, and limit
    { $sort: sort },
    { $skip: parseInt(skip) },
    { $limit: parseInt(limit) },
    // Lookup related data
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'sender'
      }
    },
    { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
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
        from: 'reports',
        localField: 'report',
        foreignField: '_id',
        as: 'report'
      }
    },
    { $unwind: { path: '$report', preserveNullAndEmptyArrays: true } },
    // Project only the fields we need
    {
      $project: {
        title: 1,
        message: 1,
        type: 1,
        isRead: '$readByUser',
        read: '$readByUser', // For backward compatibility
        readByUser: 1,
        readAt: 1,
        createdAt: 1,
        updatedAt: 1,
        'sender._id': 1,
        'sender.name': 1,
        'sender.email': 1,
        'sender.role': 1,
        'recipient._id': 1,
        'recipient.name': 1,
        'recipient.email': 1,
        'recipient.role': 1,
        'report._id': 1,
        'report.title': 1,
        'report.status': 1,
        recipients: 1,
        readBy: 1
      }
    }
  ]);
};

notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] ${message}`, JSON.stringify(data, null, 2));
  }
  
  log('Mark as read request received', { notificationId, userId });
  
  if (!notificationId) {
    const error = new Error('Notification ID is required');
    error.status = 400;
    log('Error: Notification ID is required');
    throw error;
  }
  
  if (!userId) {
    const error = new Error('User ID is required');
    error.status = 400;
    error.details = { field: 'userId' };
    log('Error: User ID is required');
    throw error;
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    log('Fetching notification from database');
    
    // Find the notification with minimal population first
    const notification = await this.findById(notificationId)
      .session(session);
    
    if (!notification) {
      const error = new Error('Notification not found');
      error.status = 404;
      error.details = { notificationId };
      log('Error: Notification not found', { notificationId });
      throw error;
    }
    
    log('Found notification', {
      id: notification._id,
      type: notification.recipient ? 'direct' : 'bulk',
      recipient: notification.recipient,
      sender: notification.sender,
      recipientsCount: notification.recipients?.length || 0,
      currentReadStatus: notification.read,
      readByCount: notification.readBy?.length || 0
    });
    
    // Check if already marked as read by this user
    const alreadyRead = notification.readBy.some(entry => 
      entry.user && entry.user.toString() === userId.toString()
    );
    
    if (!alreadyRead) {
      // Add user to readBy array with current timestamp
      notification.readBy.push({
        user: userId,
        readAt: new Date()
      });
      
      // Update readByUser flag
      notification.readByUser = true;
      
      // For direct notifications, mark as read
      if (notification.recipient && notification.recipient.toString() === userId.toString()) {
        notification.read = true;
      }
      
      // For bulk notifications with recipients
      if (notification.recipients && notification.recipients.length > 0) {
        const userRecipientIndex = notification.recipients.findIndex(r => 
          r.user && r.user.toString() === userId.toString()
        );
        
        if (userRecipientIndex !== -1) {
          notification.recipients[userRecipientIndex].read = true;
        }
        
        // Check if all recipients have read it
        const allRecipientsRead = notification.recipients.every(r => {
          if (!r.user) return true; // Skip role-based recipients
          return notification.readBy.some(entry => 
            entry.user && entry.user.toString() === r.user.toString()
          ) || r.read === true;
        });
        
        if (allRecipientsRead) {
          notification.read = true;
        }
      }
      
      // Save the notification with the session
      await notification.save({ session });
    }
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    // Get the fully populated notification to return
    const populatedNotification = await this.findById(notificationId)
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .populate('recipients.user', 'name email role')
      .populate('readBy.user', 'name email role')
      .populate('report', 'title status');
    
    log('Successfully marked notification as read', {
      notificationId: populatedNotification._id,
      read: populatedNotification.read,
      readByCount: populatedNotification.readBy?.length || 0
    });
    
    return populatedNotification;
      
  } catch (error) {
    // Abort the transaction in case of error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (session) {
      session.endSession();
    }
    
    // Enhance the error with more context
    if (!error.status) {
      error.status = 500;
    }
    if (!error.details) {
      error.details = { notificationId, userId };
    }
    
    log('Error marking notification as read', {
      message: error.message,
      status: error.status,
      details: error.details,
      stack: error.stack
    });
    
    throw error;
  }
};

// Mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] ${message}`, JSON.stringify(data, null, 2));
  }
  
  log('Mark all as read request received', { userId });
  
  if (!userId) {
    const error = new Error('User ID is required');
    error.status = 400;
    log('Error: User ID is required');
    throw error;
  }
  
  try {
    // Find all unread notifications for this user
    const unreadNotifications = await this.find({
      'readBy.user': { $ne: userId },
      $or: [
        { recipient: userId },
        { 'recipients.user': userId },
        { isBroadcast: true }
      ]
    });
    
    log(`Found ${unreadNotifications.length} unread notifications for user`, { userId });
    
    // Mark each notification as read
    const updatePromises = unreadNotifications.map(notification => {
      return this.findByIdAndUpdate(
        notification._id,
        {
          $addToSet: {
            readBy: {
              user: userId,
              readAt: new Date()
            }
          },
          $set: { 
            read: true, 
            updatedAt: new Date() 
          }
        },
        { new: true }
      );
    });
    
    // Wait for all updates to complete
    const updatedNotifications = await Promise.all(updatePromises);
    
    log(`Successfully marked ${updatedNotifications.length} notifications as read`, { userId });
    
    return {
      success: true,
      message: `Marked ${updatedNotifications.length} notifications as read`,
      count: updatedNotifications.length
    };
    
  } catch (error) {
    log('Error marking all notifications as read', {
      message: error.message,
      stack: error.stack
    });
    
    if (!error.status) {
      error.status = 500;
    }
    
    throw error;
  }
};

// Method to hide a notification for a specific user (soft delete)
notificationSchema.statics.hideNotification = async function(notificationId, userId) {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] [hideNotification] ${message}`, JSON.stringify(data, null, 2));
  }
  
  try {
    if (!notificationId) {
      const error = new Error('Notification ID is required');
      error.status = 400;
      throw error;
    }
    
    if (!userId) {
      const error = new Error('User ID is required');
      error.status = 400;
      throw error;
    }
    
    log('Hiding notification', { notificationId, userId });
    
    // Convert IDs to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Find the notification
    const notification = await this.findById(notificationId);
    
    if (!notification) {
      const error = new Error('Notification not found');
      error.status = 404;
      throw error;
    }
    
    // Check if the notification is already hidden for this user
    const alreadyHidden = notification.hiddenFor.some(id => id.toString() === userId.toString());
    
    if (alreadyHidden) {
      log('Notification already hidden for user', { notificationId, userId });
      return notification;
    }
    
    // Add the user to hiddenFor array
    notification.hiddenFor.push(userObjectId);
    
    // Save the notification
    await notification.save();
    
    log('Successfully hid notification', { notificationId, userId });
    
    return notification;
  } catch (err) {
    log('Error hiding notification', { error: err.message, stack: err.stack });
    throw err;
  }
};

// Method to completely delete a notification (hard delete)
notificationSchema.statics.deleteNotification = async function(notificationId, userId, isAdmin = false) {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] [deleteNotification] ${message}`, JSON.stringify(data, null, 2));
  }
  
  try {
    if (!notificationId) {
      const error = new Error('Notification ID is required');
      error.status = 400;
      throw error;
    }
    
    if (!userId) {
      const error = new Error('User ID is required');
      error.status = 400;
      throw error;
    }
    
    log('Deleting notification', { notificationId, userId, isAdmin });
    
    // Find the notification
    const notification = await this.findById(notificationId);
    
    if (!notification) {
      const error = new Error('Notification not found');
      error.status = 404;
      throw error;
    }
    
    // Check if user is authorized to delete this notification
    // Only sender or admin can hard delete
    const isSender = notification.sender && notification.sender.toString() === userId.toString();
    
    if (!isAdmin && !isSender) {
      const error = new Error('Not authorized to delete this notification');
      error.status = 403;
      throw error;
    }
    
    // If admin is viewing sender's notifications or sender is deleting their own notification,
    // actually remove from database
    if (isAdmin || (isSender && !notification.isDeleted)) {
      // Completely remove from database
      await this.findByIdAndDelete(notificationId);
      log('Notification completely removed from database', { notificationId });
      return { deleted: true, hardDeleted: true };
    } else {
      // Mark as deleted but keep in database for sender reference
      notification.isDeleted = true;
      await notification.save();
      log('Notification marked as deleted', { notificationId });
      return { deleted: true, hardDeleted: false };
    }
  } catch (err) {
    log('Error deleting notification', { error: err.message, stack: err.stack });
    throw err;
  }
};

// Method to modify a notification (admin or creator only)
notificationSchema.statics.modifyNotification = async function(notificationId, userId, updates, userRole) {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] [modifyNotification] ${message}`, JSON.stringify(data, null, 2));
  }
  
  try {
    if (!notificationId) {
      const error = new Error('Notification ID is required');
      error.status = 400;
      throw error;
    }
    
    if (!userId) {
      const error = new Error('User ID is required');
      error.status = 400;
      throw error;
    }
    
    if (!updates || (typeof updates !== 'object')) {
      const error = new Error('Updates object is required');
      error.status = 400;
      throw error;
    }
    
    log('Modifying notification', { notificationId, userId, updates, userRole });
    
    // Find the notification
    const notification = await this.findById(notificationId);
    
    if (!notification) {
      const error = new Error('Notification not found');
      error.status = 404;
      throw error;
    }
    
    // Check if user is authorized to modify this notification
    // Only admin, official or the creator can modify
    const isCreator = notification.sender && notification.sender.toString() === userId.toString();
    const canModify = ['admin', 'government'].includes(userRole) || isCreator;
    
    if (!canModify) {
      const error = new Error('Not authorized to modify this notification');
      error.status = 403;
      throw error;
    }
    
    // Store original content before first modification if not already stored
    if (!notification.originalContent.title && updates.title) {
      notification.originalContent.title = notification.title;
    }
    
    if (!notification.originalContent.message && updates.message) {
      notification.originalContent.message = notification.message;
    }
    
    // Apply updates
    if (updates.title) notification.title = updates.title;
    if (updates.message) notification.message = updates.message;
    
    // Update modification tracking
    notification.lastModifiedBy = mongoose.Types.ObjectId(userId);
    notification.lastModifiedAt = new Date();
    
    // Save the notification
    await notification.save();
    
    log('Successfully modified notification', { notificationId });
    
    return notification;
  } catch (err) {
    log('Error modifying notification', { error: err.message, stack: err.stack });
    throw err;
  }
};

notificationSchema.statics.getUnreadCount = async function(userId, userRole) {
  const sessionId = Math.random().toString(36).substr(2, 9);
  
  function log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] [${sessionId}] [getUnreadCount] ${message}`, JSON.stringify(data, null, 2));
  }
  
  try {
    if (!userId) {
      log('User ID is required');
      return 0;
    }
    
    log('Starting unread count calculation', { userId, userRole });
    
    // Convert userId to ObjectId to ensure consistent comparison
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Base query for notifications that should be visible to this user
    const directQuery = {
      $and: [
        {
          $or: [
            { recipient: userObjectId },
            { 'recipients.user': userObjectId },
            { 'recipients.role': userRole }
          ]
        },
        { 'hiddenFor': { $ne: userObjectId } },
        // Exclude notifications where the current user is the sender
        { 'sender': { $ne: userObjectId } }
      ]
    };

    // For admin, show all notifications except hidden ones and those they sent
    const query = userRole === 'admin' 
      ? { 
          'hiddenFor': { $ne: userObjectId },
          'sender': { $ne: userObjectId } // Exclude notifications sent by the current admin
        } 
      : directQuery;
    
    log('Using query', { query });
    
    // First, check if there are any notifications at all for this user
    const allNotifications = await this.find(query).lean();
    log('Found total notifications', { count: allNotifications.length });
    
    // Manual count of unread notifications
    let unreadCount = 0;
    
    for (const notification of allNotifications) {
      // Check if the user has read this notification
      const readByUser = notification.readBy && notification.readBy.some(entry => {
        if (!entry.user) return false;
        const entryUserId = entry.user._id || entry.user;
        return entryUserId.toString() === userId.toString();
      });
      
      if (!readByUser) {
        unreadCount++;
      }
    }
    
    log('Calculated unread count', { unreadCount, totalNotifications: allNotifications.length });
    
    // Also perform the aggregation for verification
    const result = await this.aggregate([
      { $match: query },
      {
        $addFields: {
          // Check if the current user has read the notification
          hasRead: {
            $cond: {
              if: { $isArray: '$readBy' },
              then: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$readBy',
                        as: 'read',
                        cond: { 
                          $or: [
                            // Compare as string
                            { $eq: [{ $toString: '$$read.user' }, userId.toString()] },
                            // Compare as ObjectId if possible
                            { $eq: ['$$read.user', userObjectId] }
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
          }
        }
      },
      // Only count unread notifications
      { $match: { hasRead: false } },
      // Count the results
      { $count: 'count' }
    ]);

    const aggregateCount = result.length > 0 ? result[0].count : 0;
    log('Aggregation count result', { aggregateCount });
    
    // If there's a discrepancy, use the manual count
    if (unreadCount !== aggregateCount) {
      log('Count discrepancy detected', { manualCount: unreadCount, aggregateCount });
    }
    
    // Return the manual count which is more reliable
    return unreadCount;
  } catch (err) {
    log('Error calculating unread count', { error: err.message, stack: err.stack });
    return 0; // Return 0 on error to prevent UI issues
  }
};

module.exports = mongoose.model('Notification', notificationSchema);

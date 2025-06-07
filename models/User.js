const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['reporter', 'government', 'admin'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_approval'],
    default: 'active'
  },
  profileImage: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  language: {
    type: String,
    enum: ['en', 'am', 'om'],
    default: 'en',
    required: true
  },
  appeal: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    reason: String,
    message: String,
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adminResponse: String
  },
  accountDeactivated: {
    type: Boolean,
    default: false
  },
  deactivationReason: String,
  deactivatedAt: Date,
  deactivatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastActive: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Check if user is active
userSchema.methods.isActive = function() {
  return this.status === 'active' && !this.accountDeactivated;
};

// Create appeal
userSchema.methods.createAppeal = function(reason, message) {
  this.appeal = {
    status: 'pending',
    reason: reason,
    message: message,
    submittedAt: new Date()
  };
  return this.save();
};

// Process appeal (admin)
userSchema.methods.processAppeal = async function(adminId, status, response) {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid appeal status');
  }
  
  this.appeal.status = status;
  this.appeal.reviewedAt = new Date();
  this.appeal.reviewedBy = adminId;
  this.appeal.adminResponse = response;
  
  if (status === 'approved') {
    this.status = 'active';
    this.accountDeactivated = false;
  }
  
  return this.save();
};

module.exports = mongoose.model('User', userSchema);

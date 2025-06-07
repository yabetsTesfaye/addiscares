const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for faster querying
appealSchema.index({ user: 1, status: 1 });
appealSchema.index({ status: 1, createdAt: -1 });

// Static method to create a new appeal
appealSchema.statics.createAppeal = async function(userId, appealData) {
  const appeal = new this({
    user: userId,
    reason: appealData.reason,
    message: appealData.message,
    status: 'pending',
    metadata: {
      ipAddress: appealData.ipAddress,
      userAgent: appealData.userAgent
    }
  });
  
  return appeal.save();
};

// Method to process an appeal (admin action)
appealSchema.methods.processAppeal = async function(adminId, status, response) {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status. Must be either approved or rejected');
  }
  
  this.status = status;
  this.adminResponse = response || '';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  
  return this.save();
};

// Virtual for formatted status
appealSchema.virtual('formattedStatus').get(function() {
  return this.status.charAt(0).toUpperCase() + this.status.slice(1);
});

// Pre-save hook to update user status when appeal is processed
appealSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status !== 'pending') {
    const User = mongoose.model('User');
    const update = { 
      'appeal.status': this.status,
      'appeal.reviewedAt': new Date(),
      'appeal.reviewedBy': this.reviewedBy,
      'appeal.adminResponse': this.adminResponse
    };
    
    if (this.status === 'approved') {
      update.status = 'active';
      update.accountDeactivated = false;
    }
    
    await User.findByIdAndUpdate(this.user, { $set: update });
  }
  next();
});

const Appeal = mongoose.model('Appeal', appealSchema);

module.exports = Appeal;

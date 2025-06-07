const User = require('../models/User');
const Appeal = require('../models/Appeal');
const Notification = require('../models/Notification');

/**
 * @desc    Submit an appeal
 * @route   POST /api/appeals
 * @access  Private
 */
const submitAppeal = async (req, res, next) => {
  try {
    const { reason, message } = req.body;
    
    // Check if user has an active appeal
    const existingAppeal = await Appeal.findOne({
      user: req.user.id,
      status: 'pending'
    });

    if (existingAppeal) {
      return res.status(400).json({
        success: false,
        msg: 'You already have a pending appeal',
        code: 'APPEAL_EXISTS'
      });
    }


    // Create new appeal
    const appeal = await Appeal.create({
      user: req.user.id,
      reason,
      message,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Update user's appeal status
    await User.findByIdAndUpdate(req.user.id, {
      'appeal.status': 'pending',
      'appeal.reason': reason,
      'appeal.message': message,
      'appeal.submittedAt': new Date()
    });

    // Notify admins
    const admins = await User.find({ role: 'admin' });
    const adminIds = admins.map(admin => admin._id);
    
    await Notification.create({
      recipients: adminIds,
      title: 'New Account Appeal',
      message: `User ${req.user.name} has submitted an appeal to reactivate their account.`,
      type: 'appeal',
      referenceId: appeal._id,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      msg: 'Appeal submitted successfully. You will be notified once reviewed.',
      data: appeal
    });
  } catch (error) {
    console.error('Error submitting appeal:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's appeal status
 * @route   GET /api/appeals/me
 * @access  Private
 */
const getMyAppeal = async (req, res, next) => {
  try {
    const appeal = await Appeal.findOne({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email');

    if (!appeal) {
      return res.status(200).json({
        success: true,
        data: null,
        hasAppeal: false
      });
    }

    res.status(200).json({
      success: true,
      data: appeal,
      hasAppeal: true
    });
  } catch (error) {
    console.error('Error getting appeal:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get all appeals (Admin)
 * @route   GET /api/appeals
 * @access  Private/Admin
 */
const getAppeals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const appeals = await Appeal.find(query)
      .populate('user', 'name email status')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appeals.length,
      data: appeals
    });
  } catch (error) {
    console.error('Error getting appeals:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Process an appeal (Admin)
 * @route   PUT /api/appeals/:id/process
 * @access  Private/Admin
 */
const processAppeal = async (req, res, next) => {
  try {
    const { status, response } = req.body;
    const appeal = await Appeal.findById(req.params.id);

    if (!appeal) {
      return res.status(404).json({
        success: false,
        msg: 'Appeal not found'
      });
    }

    if (appeal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        msg: 'This appeal has already been processed'
      });
    }

    // Update appeal
    appeal.status = status;
    appeal.adminResponse = response || '';
    appeal.reviewedBy = req.user.id;
    appeal.reviewedAt = new Date();
    await appeal.save();

    // Update user status if approved
    const update = {
      'appeal.status': status,
      'appeal.adminResponse': response || '',
      'appeal.reviewedBy': req.user.id,
      'appeal.reviewedAt': new Date()
    };

    if (status === 'approved') {
      update.status = 'active';
      update.accountDeactivated = false;
    }

    await User.findByIdAndUpdate(appeal.user, { $set: update });

    // Create notification for the user
    await Notification.create({
      recipients: [appeal.user],
      title: 'Appeal Processed',
      message: `Your account appeal has been ${status}. ${response || ''}`,
      type: 'appeal_response',
      referenceId: appeal._id,
      createdBy: req.user.id
    });

    res.status(200).json({
      success: true,
      msg: `Appeal ${status} successfully`,
      data: appeal
    });
  } catch (error) {
    console.error('Error processing appeal:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  submitAppeal,
  getMyAppeal,
  getAppeals,
  processAppeal
};

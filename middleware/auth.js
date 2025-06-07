const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  // Get token from header
  let token = req.header('x-auth-token');
  
  // If no token in x-auth-token header, try Authorization header
  if (!token && req.headers.authorization) {
    if (req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else {
      token = req.headers.authorization;
    }
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false,
      msg: 'No token, authorization denied',
      code: 'NO_TOKEN'
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ 
        success: false,
        msg: 'Server configuration error',
        code: 'SERVER_ERROR'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.user || !decoded.user.id) {
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid token structure',
        code: 'INVALID_TOKEN_STRUCTURE'
      });
    }

    // Get user from database to check status
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if account is deactivated
    if (user.accountDeactivated) {
      return res.status(403).json({
        success: false,
        msg: 'Your account has been deactivated.',
        code: 'ACCOUNT_DEACTIVATED',
        appealStatus: user.appeal?.status || 'none',
        deactivationReason: user.deactivationReason,
        status: 'inactive'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        msg: 'Your account is not active. Please contact support.',
        code: 'ACCOUNT_INACTIVE',
        status: user.status
      });
    }
    
    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Add user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(500).json({ 
      success: false,
      msg: 'Server error during authentication',
      code: 'AUTH_ERROR',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      msg: 'Admin access required',
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }
};

// Government middleware
const government = (req, res, next) => {
  if (req.user && req.user.role === 'government') {
    next();
  } else {
    res.status(403).json({
      success: false,
      msg: 'Government access required',
      code: 'GOVERNMENT_ACCESS_REQUIRED'
    });
  }
};

// Reporter middleware
const reporter = (req, res, next) => {
  if (req.user && req.user.role === 'reporter') {
    next();
  } else {
    res.status(403).json({
      success: false,
      msg: 'Reporter access required',
      code: 'REPORTER_ACCESS_REQUIRED'
    });
  }
};

module.exports = {
  auth,
  admin,
  government,
  reporter
};

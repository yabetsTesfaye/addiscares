const { validationResult, check } = require('express-validator');

// Middleware to check validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', {
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      errors: errors.array()
    });
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

// Validation rules for user registration
exports.registerValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('role', 'Role must be reporter, government, or admin').isIn(['reporter', 'government', 'admin']),
  validateRequest
];

// Validation rules for user login
exports.loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
  validateRequest
];

// Validation rules for creating a report
exports.reportValidation = [
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('location', 'Location is required').not().isEmpty(),
  check('category', 'Category must be valid').isIn(['road', 'building', 'environment', 'public_service', 'other']),
  validateRequest
];

// Validation rules for updating report status
exports.statusValidation = [
  check('status', 'Status must be valid').isIn(['pending', 'in_progress', 'resolved', 'escalated']),
  validateRequest
];

// Validation rules for adding a comment
exports.commentValidation = [
  check('text', 'Comment text is required').not().isEmpty(),
  validateRequest
];

// Validation rules for sending notifications
exports.notificationValidation = [
  check('title', 'Title is required').not().isEmpty(),
  check('message', 'Message is required').not().isEmpty(),
  check('recipientId', 'Recipient ID is required').not().isEmpty(),
  validateRequest
];

// Validation rules for updating user role
exports.roleValidation = [
  check('role', 'Role must be reporter, government, or admin').isIn(['reporter', 'government', 'admin']),
  validateRequest
];

// Validation rules for updating user status
exports.statusUserValidation = [
  check('status', 'Status must be active or inactive').isIn(['active', 'inactive']),
  validateRequest
];

// Validation rules for bulk notifications
exports.bulkNotificationValidation = [
  check('title', 'Title is required').trim().notEmpty(),
  check('message', 'Message is required').trim().notEmpty(),
  check('role', 'Role must be reporter, government, or admin').isIn(['reporter', 'government', 'admin']),
  check('reportId', 'Report ID must be a valid ID')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId(),
  validateRequest
];

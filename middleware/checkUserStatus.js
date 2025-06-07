const User = require('../models/User');

/**
 * Middleware to check if user account is active
 * Blocks access for suspended accounts
 */
const checkUserStatus = async (req, res, next) => {
    try {
        // Skip middleware for auth routes
        if (req.path.startsWith('/auth')) {
            return next();
        }

        // Get user from request (assuming user is attached by auth middleware)
        const user = req.user;
        
        if (!user) {
            return next(); // No user in request, let auth middleware handle it
        }

        // Check if user is suspended
        if (user.status === 'suspended') {
            return res.status(403).json({ 
                success: false, 
                message: 'Your account has been suspended. Please contact support.' 
            });
        }

        // User is active, proceed to next middleware/route
        next();
    } catch (error) {
        console.error('Error in checkUserStatus middleware:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

module.exports = checkUserStatus;

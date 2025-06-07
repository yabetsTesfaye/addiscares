const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validate');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile-images');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer with configuration
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and registration
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserAuth:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           description: User's password (min 6 characters)
 *     UserRegister:
 *       allOf:
 *         - $ref: '#/components/schemas/UserAuth'
 *         - type: object
 *           required:
 *             - name
 *             - role
 *           properties:
 *             name:
 *               type: string
 *               description: User's full name
 *             role:
 *               type: string
 *               enum: [reporter, government, admin]
 *               description: User's role in the system
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT token for authenticated requests
 *         user:
 *           $ref: '#/components/schemas/User'
 *         isMongoConnected:
 *           type: boolean
 *           description: Indicates if the application is connected to MongoDB
 */

// Function to notify admins about new user registration
const notifyAdminsNewUser = async (newUser) => {
  console.log('Starting admin notification process...');
  
  if (!newUser || !newUser._id) {
    console.error('Invalid newUser object provided to notifyAdminsNewUser');
    return;
  }
  
  console.log(`Preparing to notify admins about new user: ${newUser.email} (${newUser._id})`);
  
  try {
    // Find all admin users
    console.log('Looking for admin users...');
    const admins = await User.find({ role: 'admin' }).select('_id email').lean();
    
    if (!admins || admins.length === 0) {
      console.log('No admin users found to notify');
      return;
    }
    
    console.log(`Found ${admins.length} admin(s) to notify`);

    // Create notification for each admin
    const notificationPromises = admins.map(admin => {
      console.log(`Creating notification for admin: ${admin._id} (${admin.email})`);
      
      const notification = new Notification({
        title: 'New User Registration',
        message: `A new ${newUser.role} has registered: ${newUser.name} (${newUser.email})`,
        recipient: admin._id,
        sender: newUser._id, // The new user is the sender of this notification
        type: 'user_registered',
        read: false,
        createdAt: new Date()
      });
      
      return notification.save()
        .then(savedNotif => {
          console.log(`Notification created for admin ${admin._id}`);
          return savedNotif;
        })
        .catch(err => {
          console.error(`Failed to save notification for admin ${admin._id}:`, err.message);
          return null;
        });
    });

    const results = await Promise.all(notificationPromises);
    const successfulNotifications = results.filter(r => r !== null).length;
    
    console.log(`Successfully sent notifications to ${successfulNotifications} of ${admins.length} admins`);
    
    if (successfulNotifications < admins.length) {
      console.warn(`${admins.length - successfulNotifications} notifications failed to send`);
    }
    
    return results;
    
  } catch (err) {
    console.error('Unexpected error in notifyAdminsNewUser:', err);
    throw err; // Re-throw to be caught by the caller
  }
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      console.log('MongoDB disconnected, using mock registration');
      
      // Simple mock registration - return a success response with a token
      // In a real app, we would validate that the email isn't already used
      const mockUserId = '507f1f77bcf86cd799439' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      const payload = {
        user: {
          id: mockUserId,
          role: role
        }
      };
      
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ 
            token,
            msg: 'Registered with mock data (database unavailable)'
          });
        }
      );
      return;
    }

    // Real registration with MongoDB (only runs if connected)
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user with default language
    user = new User({
      name,
      email,
      password,
      role: role || 'reporter',
      status: 'active',
      language: 'en' // Default language
    });

    // Save the user and wait for it to complete
    const savedUser = await user.save();
    console.log(`User registered successfully: ${savedUser._id}`);

    // Notify admins about the new registration (in the background)
    if (global.isMongoConnected) {
      console.log('Notifying admins about new user registration...');
      notifyAdminsNewUser(savedUser)
        .then(() => console.log('Successfully notified admins'))
        .catch(err => console.error('Error in admin notification:', err));
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).send('Server error: ' + err.message);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserAuth'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      console.log('MongoDB disconnected, using mock authentication');
      
      // Use mock authentication when MongoDB is disconnected
      if (email && password === 'password123') {
        // Create role based on email prefix
        let role = 'reporter';
        if (email.startsWith('gov')) role = 'government';
        if (email.startsWith('admin')) role = 'admin';
        
        const payload = {
          user: {
            id: '507f1f77bcf86cd799439011', // Mock ID
            role: role
          }
        };
        
        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '24h' },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        );
        return;
      } else {
        return res.status(400).json({ msg: 'Invalid credentials (Mock Auth)' });
      }
    }
    
    // Real authentication with MongoDB (only runs if connected)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
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

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        status: user.status
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error: ' + err.message);
  }
});

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.get('/user', auth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      console.log('MongoDB disconnected, returning mock user data');
      
      // Create mock user based on the role in the JWT token
      const mockUser = {
        _id: req.user.id,
        name: 'Mock User',
        email: req.user.role + '@example.com',
        role: req.user.role,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      return res.json(mockUser);
    }
    
    // Real database query (only runs if connected)
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error getting user data:', err.message);
    res.status(500).send('Server error: ' + err.message);
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               address:
 *                 type: string
 *                 description: User's address
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password (required if changing password)
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (required if changing password)
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *               removeImage:
 *                 type: string
 *                 description: Set to 'true' to remove profile image
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or password mismatch
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.put('/profile', [auth, upload.single('profileImage')], async (req, res) => {
  try {
    const { name, phone, address, currentPassword, newPassword, removeImage, language } = req.body;
    const userId = req.user.id;
    const updates = {};

    // Find the user
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update basic profile info
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (language && ['en', 'am', 'om'].includes(language)) {
      updates.language = language;
    }

    // Handle password change if currentPassword and newPassword are provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Current password is incorrect' });
      }
      
      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    // Handle profile image upload
    if (req.file) {
      // If there's an old image, delete it
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, '..', user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Save the new image path relative to the uploads directory
      updates.profileImage = 'uploads/profile-images/' + req.file.filename;
    } else if (removeImage === 'true' && user.profileImage) {
      // Remove profile image if requested
      const oldImagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      updates.profileImage = '';
    }

    // Update the user
    user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    // If we have a new profile image, include the full URL in the response
    if (req.file) {
      user = user.toObject();
      user.profileImage = `/uploads/profile-images/${req.file.filename}`;
    }

    res.json(user);
  } catch (err) {
    console.error('Error updating profile:', err);
    // If there's a file upload error, remove the uploaded file
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error removing uploaded file:', unlinkErr);
      });
    }
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

module.exports = router;

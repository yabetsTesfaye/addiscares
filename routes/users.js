const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, admin } = require('../middleware/auth');
const { roleValidation, statusUserValidation } = require('../middleware/validate');

// Get all users (Admin only)
router.get('/', [auth, admin], async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      console.log('MongoDB disconnected, returning mock user data for admin');
      
      // Generate a variety of mock users with different roles and statuses
      const mockUsers = [
        // Admin users
        {
          _id: '507f1f77bcf86cd799439001',
          name: 'Admin User',
          email: 'admin@example.com',
          phone: '+251911223344',
          address: 'Bole Road, Addis Ababa',
          role: 'admin',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString() // 30 days ago
        },
        {
          _id: '507f1f77bcf86cd799439002',
          name: 'System Admin',
          email: 'system@example.com',
          phone: '+251922334455',
          address: 'Meskel Square, Addis Ababa',
          role: 'admin',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 60).toISOString() // 60 days ago
        },
        
        // Government users
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Government Official 1',
          email: 'gov1@example.com',
          phone: '+251933445566',
          address: 'Kirkos Sub-city, Addis Ababa',
          role: 'government',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 25).toISOString() // 25 days ago
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Government Official 2',
          email: 'gov2@example.com',
          phone: '+251944556677',
          address: 'Yeka Sub-city, Addis Ababa',
          role: 'government',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 20).toISOString() // 20 days ago
        },
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'Government Official 3',
          email: 'gov3@example.com',
          phone: '+251955667788',
          address: 'Gulele Sub-city, Addis Ababa',
          role: 'government',
          status: 'inactive',
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString() // 15 days ago
        },
        
        // Reporter users
        {
          _id: '507f1f77bcf86cd799439021',
          name: 'Reporter User 1',
          email: 'reporter1@example.com',
          phone: '+251966778899',
          address: 'Bole Michael, Addis Ababa',
          role: 'reporter',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString() // 10 days ago
        },
        {
          _id: '507f1f77bcf86cd799439022',
          name: 'Reporter User 2',
          email: 'reporter2@example.com',
          phone: '+251977889900',
          address: 'Megenagna, Addis Ababa',
          role: 'reporter',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 8).toISOString() // 8 days ago
        },
        {
          _id: '507f1f77bcf86cd799439023',
          name: 'Reporter User 3',
          email: 'reporter3@example.com',
          phone: '+251988990011',
          address: 'Kazanchis, Addis Ababa',
          role: 'reporter',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
        },
        {
          _id: '507f1f77bcf86cd799439024',
          name: 'Reporter User 4',
          email: 'reporter4@example.com',
          phone: '+251999001122',
          address: 'Piassa, Addis Ababa',
          role: 'reporter',
          status: 'inactive',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
        },
        {
          _id: '507f1f77bcf86cd799439025',
          name: 'Reporter User 5',
          email: 'reporter5@example.com',
          phone: '+251911223355',
          address: 'Sarbet, Addis Ababa',
          role: 'reporter',
          status: 'active',
          createdAt: new Date().toISOString() // Today
        }
      ];
      
      return res.json(mockUsers);
    }

    // Real database query (only runs if connected)
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Get single user (Admin only)
router.get('/:id', [auth, admin], async (req, res) => {
  try {

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update user role (Admin only)
router.put('/:id/role', [auth, admin, ...roleValidation], async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update user status (Admin only)
router.put('/:id/status', [auth, admin, ...statusUserValidation], async (req, res) => {
  try {
    const { status } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete user (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update user profile (All authenticated users)
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, currentPassword, newPassword } = req.body;
    
    // Find the user by ID from the auth token
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update basic profile fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    // If user is trying to change password
    if (currentPassword && newPassword) {
      // Check if current password is correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(400).json({ msg: 'Current password is incorrect' });
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search for reports and users
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query string
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         description: No search query provided
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = q.trim();
    
    // Search for reports
    const reports = await Report.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { location: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } }
      ],
      status: { $ne: 'deleted' }
    })
    .populate('reporter', 'name email role')
    .populate('assignedTo', 'name email role')
    .sort({ createdAt: -1 })
    .limit(10);

    // Search for users (exclude sensitive data)
    const users = await User.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { role: { $regex: searchQuery, $options: 'i' } }
      ],
      status: 'active'
    })
    .select('-password -refreshToken -resetPasswordToken -resetPasswordExpire')
    .limit(10);

    res.json({
      reports,
      users
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

module.exports = router;

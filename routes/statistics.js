const express = require('express');
const router = express.Router();
const { auth, admin, government } = require('../middleware/auth');
const Report = require('../models/Report');

// Get statistics (Government Officials and Admins only)
router.get('/', [auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'government') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized to access this resource' });
  }
}], async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      console.log('MongoDB disconnected, returning mock statistics data');
      
      // Create mock statistics data
      const mockStatistics = {
        totalReports: 42,
        statusCounts: [
          { _id: 'pending', count: 12 },
          { _id: 'in_progress', count: 15 },
          { _id: 'resolved', count: 10 },
          { _id: 'escalated', count: 5 }
        ],
        categoryCounts: [
          { _id: 'road', count: 15 },
          { _id: 'water', count: 8 },
          { _id: 'electricity', count: 7 },
          { _id: 'garbage', count: 5 },
          { _id: 'other', count: 7 }
        ],
        avgResolutionTime: 3.5, // days
        urgencyData: [
          { _id: 'low', count: 15 },
          { _id: 'medium', count: 20 },
          { _id: 'high', count: 7 }
        ],
        reportsOverTime: [
          { month: '2025-01', count: 5 },
          { month: '2025-02', count: 8 },
          { month: '2025-03', count: 6 },
          { month: '2025-04', count: 12 },
          { month: '2025-05', count: 11 }
        ]
      };
      
      return res.json(mockStatistics);
    }
    
    // Real database queries (only run if connected)
    const totalReports = await Report.countDocuments();
    
    // Count reports by status
    const statusCounts = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Count reports by category
    const categoryCounts = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Average resolution time (for resolved reports)
    const resolvedReports = await Report.find({ status: 'resolved' });
    let avgResolutionTime = 0;
    
    if (resolvedReports.length > 0) {
      const totalResolutionTime = resolvedReports.reduce((total, report) => {
        const createdDate = new Date(report.createdAt);
        const updatedDate = new Date(report.updatedAt);
        return total + (updatedDate - createdDate);
      }, 0);
      
      avgResolutionTime = totalResolutionTime / resolvedReports.length / (1000 * 60 * 60 * 24); // in days
    }
    
    // Reports by urgency level
    const urgencyData = await Report.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $lte: ['$urgency', 1] }, 'low',
              { $cond: [{ $lte: ['$urgency', 3] }, 'medium', 'high'] }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Reports over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const reportsOverTime = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' }, 
            month: { $month: '$createdAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      totalReports,
      statusCounts: statusCounts.reduce((obj, item) => {
        obj[item._id] = item.count;
        return obj;
      }, {}),
      categoryCounts: categoryCounts.reduce((obj, item) => {
        obj[item._id] = item.count;
        return obj;
      }, {}),
      avgResolutionTime,
      urgencyLevels: urgencyData.reduce((obj, item) => {
        obj[item._id] = item.count;
        return obj;
      }, {}),
      reportsOverTime
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

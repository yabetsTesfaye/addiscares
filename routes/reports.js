const express = require('express');
const router = express.Router();
const { auth, admin, government, reporter } = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');
const multer = require('multer');
const { reportValidation, statusValidation, commentValidation } = require('../middleware/validate');
const { sendStatusUpdateNotification, sendCommentNotification } = require('../utils/notifications');

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the report
 *         title:
 *           type: string
 *           description: The title of the report
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *         location:
 *           type: string
 *           description: Location where the issue was reported
 *         category:
 *           type: string
 *           enum: [road, public_service, environment, other]
 *           description: Category of the report
 *         status:
 *           type: string
 *           enum: [pending, in_progress, resolved, escalated]
 *           default: pending
 *           description: Current status of the report
 *         reporter:
 *           $ref: '#/components/schemas/User'
 *         assignedTo:
 *           $ref: '#/components/schemas/User'
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Array of base64-encoded images
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the report was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the report was last updated
 * 
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 * 
 *     Comment:
 *       type: object
 *       properties:
 *         text:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Report management endpoints
 */

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [road, public_service, environment, other]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, upload.array('images', 5), [...reportValidation], async (req, res) => {
  try {
    console.log('Creating new report with files:', req.files?.length || 0);
    const { title, description, location, category } = req.body;

    const report = new Report({
      title,
      description,
      location,
      category,
      reporter: req.user.id
    });

    // Save images if provided
    if (req.files && req.files.length > 0) {
      console.log('Processing', req.files.length, 'images');
      for (const file of req.files) {
        try {
          // Convert image to base64 and add data URI prefix
          const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          report.images.push(base64Image);
          console.log('Added image:', file.originalname);
        } catch (error) {
          console.error('Error processing image:', file.originalname, error);
        }
      }
    }

    await report.save();
    console.log('Report saved with', report.images.length, 'images');
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Get all reports (for government and admin users)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved, escalated]
 *         description: Filter reports by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [road, public_service, environment, other]
 *         description: Filter reports by category
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User role not authorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      console.log('MongoDB disconnected, returning mock report data');
      
      // Return mock reports data
      const mockReports = [
        {
          _id: '507f1f77bcf86cd799439101',
          title: 'Pothole on Main Street',
          description: 'Large pothole damaging vehicles',
          location: 'Main Street near City Hall',
          category: 'road',
          status: 'pending',
          reporter: {
            _id: '507f1f77bcf86cd799439001',
            name: 'Mock Reporter',
            email: 'reporter@example.com'
          },
          assignedTo: null,
          comments: [],
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          _id: '507f1f77bcf86cd799439102',
          title: 'Broken Street Light',
          description: 'Street light not working for past week',
          location: 'Park Avenue and 5th Street',
          category: 'public_service',
          status: 'in_progress',
          reporter: {
            _id: '507f1f77bcf86cd799439002',
            name: 'Another Reporter',
            email: 'reporter2@example.com'
          },
          assignedTo: {
            _id: '507f1f77bcf86cd799439011',
            name: 'Government Official',
            email: 'gov@example.com'
          },
          comments: [
            {
              text: 'We are looking into this issue',
              user: '507f1f77bcf86cd799439011',
              createdAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
            }
          ],
          createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        },
        {
          _id: '507f1f77bcf86cd799439103',
          title: 'Garbage Collection Missed',
          description: 'Garbage has not been collected for two weeks',
          location: 'Residential Area Zone 3',
          category: 'environment',
          status: 'resolved',
          reporter: {
            _id: '507f1f77bcf86cd799439003',
            name: 'Third Reporter',
            email: 'reporter3@example.com'
          },
          assignedTo: {
            _id: '507f1f77bcf86cd799439012',
            name: 'Government Official 2',
            email: 'gov2@example.com'
          },
          comments: [
            {
              text: 'Issue reported to sanitation department',
              user: '507f1f77bcf86cd799439012',
              createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            {
              text: 'Garbage collection completed',
              user: '507f1f77bcf86cd799439012',
              createdAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
            }
          ],
          createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        }
      ];
      
      return res.json(mockReports);
    }
    
    // Real database query (only runs if connected)
    const reports = await Report.find({}, '-images') // Exclude images field
      .populate('reporter', ['name', 'email'])
      .populate('assignedTo', ['name', 'email'])
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript objects
      
    // Add imageCount field to each report
    const reportsWithImageCount = reports.map(report => ({
      ...report,
      imageCount: report.images ? report.images.length : 0
    }));
    
    res.json(reportsWithImageCount);
  } catch (err) {
    console.error('Error getting reports:', err.message);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Get reports for logged-in user
router.get('/user', auth, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user.id })
      .populate('reporter', ['name', 'email'])
      .populate('assignedTo', ['name', 'email'])
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get reports from other users (for reporters to see other reports)
router.get('/others', auth, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: { $ne: req.user.id } })
      .populate('reporter', ['name', 'email'])
      .populate('assignedTo', ['name', 'email'])
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get single report
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      console.log(`MongoDB disconnected, returning mock report data for ID: ${req.params.id}`);
      
      // Check if the ID is a valid MongoDB ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid report ID format' });
      }
      
      // Use pre-defined IDs for mock data to ensure consistency
      const mockReportMap = {
        '507f1f77bcf86cd799439101': {
          _id: '507f1f77bcf86cd799439101',
          title: 'Pothole on Main Street',
          description: 'Large pothole damaging vehicles',
          location: 'Main Street near City Hall',
          category: 'road',
          status: 'pending',
          reporter: {
            _id: '507f1f77bcf86cd799439001',
            name: 'Mock Reporter',
            email: 'reporter@example.com'
          },
          assignedTo: null,
          comments: [],
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          images: []
        },
        '507f1f77bcf86cd799439102': {
          _id: '507f1f77bcf86cd799439102',
          title: 'Broken Street Light',
          description: 'Street light not working for past week',
          location: 'Park Avenue and 5th Street',
          category: 'public_service',
          status: 'in_progress',
          reporter: {
            _id: '507f1f77bcf86cd799439002',
            name: 'Another Reporter',
            email: 'reporter2@example.com'
          },
          assignedTo: {
            _id: '507f1f77bcf86cd799439011',
            name: 'Government Official',
            email: 'gov@example.com'
          },
          comments: [
            {
              text: 'We are looking into this issue',
              user: {
                _id: '507f1f77bcf86cd799439011',
                name: 'Government Official'
              },
              createdAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
            }
          ],
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          images: []
        },
        '507f1f77bcf86cd799439103': {
          _id: '507f1f77bcf86cd799439103',
          title: 'Garbage Collection Missed',
          description: 'Garbage has not been collected for two weeks',
          location: 'Residential Area Zone 3',
          category: 'environment',
          status: 'resolved',
          reporter: {
            _id: '507f1f77bcf86cd799439003',
            name: 'Third Reporter',
            email: 'reporter3@example.com'
          },
          assignedTo: {
            _id: '507f1f77bcf86cd799439012',
            name: 'Government Official 2',
            email: 'gov2@example.com'
          },
          comments: [
            {
              text: 'Issue reported to sanitation department',
              user: {
                _id: '507f1f77bcf86cd799439012',
                name: 'Government Official 2'
              },
              createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            {
              text: 'Garbage collection completed',
              user: {
                _id: '507f1f77bcf86cd799439012',
                name: 'Government Official 2'
              },
              createdAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
            }
          ],
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          images: []
        }
      };
      
      // Return the mock report if it exists in our predefined map
      const mockReport = mockReportMap[req.params.id] || {
        _id: req.params.id,
        title: 'Mock Report',
        description: 'This is a mock report created for development purposes',
        location: 'Test Location',
        category: 'other',
        status: 'pending',
        reporter: {
          _id: '507f1f77bcf86cd799439001',
          name: 'Mock Reporter',
          email: 'reporter@example.com'
        },
        assignedTo: null,
        comments: [],
        createdAt: new Date().toISOString(),
        images: []
      };
      
      return res.json(mockReport);
    }
    
    // Real database query (only runs if connected)
    const report = await Report.findById(req.params.id)
      .populate('reporter', ['name', 'email'])
      .populate('assignedTo', ['name', 'email']);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    res.json(report);
  } catch (err) {
    console.error('Error getting single report:', err.message);
    res.status(500).send('Server error: ' + err.message);
  }
});

// Update report
router.put('/:id', [auth], async (req, res) => {
  try {
    const { title, description, location, category, status, assignedTo } = req.body;
    
    // Validate status if provided
    if (status && !['pending', 'in_progress', 'resolved', 'rejected', 'escalated'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value' });
    }
    
    // Validate category if provided
    if (category && !['road', 'building', 'environment', 'public_service', 'other'].includes(category)) {
      return res.status(400).json({ msg: 'Invalid category' });
    }
    
    // Validate assignedTo format if provided
    if (assignedTo && !/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
      return res.status(400).json({ msg: 'Invalid assignedTo ID format' });
    }
    
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      console.log('MongoDB disconnected, handling mock report update');
      
      // Create a mock updated report
      const mockReport = {
        _id: req.params.id,
        title: title || 'Mock Updated Report',
        description: description || 'This is a mock report updated for development purposes',
        location: location || 'Test Location',
        category: category || 'other',
        status: status || 'pending',
        reporter: {
          _id: '507f1f77bcf86cd799439001',
          name: 'Mock Reporter',
          email: 'reporter@example.com'
        },
        assignedTo: assignedTo ? {
          _id: assignedTo,
          name: 'Assigned Official',
          email: 'official@example.com'
        } : null,
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: []
      };
      
      console.log('Mock report updated successfully');
      return res.json(mockReport);
    }
    
    // Real database update (only runs if connected)
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Update fields if they exist in the request
    if (title) report.title = title;
    if (description) report.description = description;
    if (location) report.location = location;
    if (category) report.category = category;
    if (status) report.status = status;
    if (assignedTo) report.assignedTo = assignedTo;
    
    report.updatedAt = Date.now();
    
    await report.save();
    
    // Populate the reporter and assignedTo fields for the response
    const updatedReport = await Report.findById(report._id)
      .populate('reporter', ['name', 'email'])
      .populate('assignedTo', ['name', 'email']);
      
    res.json(updatedReport);
  } catch (err) {
    console.error('Error updating report:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: 'Invalid ID format' });
    }
    res.status(500).send('Server error: ' + err.message);
  }
});

// Update report status (Government only)
router.put('/:id/status', [auth, government, ...statusValidation], async (req, res) => {
  try {
    console.log('Received status update request:', req.body);
    console.log('Report ID:', req.params.id);
    
    const { status, assignedTo } = req.body;
    console.log('Status:', status);
    console.log('AssignedTo:', assignedTo);
    
    // Check if MongoDB is connected
    if (!global.isMongoConnected) {
      console.log('MongoDB disconnected, handling mock status update');
      
      // Validate report ID format
      if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid report ID format' });
      }
      
      // Validate assignedTo format if provided
      if (assignedTo && !/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
        console.log('Invalid assignedTo format:', assignedTo);
        return res.status(400).json({ msg: 'Invalid assignedTo ID format' });
      }
      
      // Create a mock updated report
      const mockReport = {
        _id: req.params.id,
        title: 'Mock Updated Report',
        description: 'This is a mock report updated for development purposes',
        location: 'Test Location',
        category: 'other',
        status: status, // Use the requested status
        reporter: {
          _id: '507f1f77bcf86cd799439001',
          name: 'Mock Reporter',
          email: 'reporter@example.com'
        },
        assignedTo: assignedTo ? {
          _id: assignedTo,
          name: 'Assigned Official',
          email: 'official@example.com'
        } : null,
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: []
      };
      
      console.log('Mock report status updated successfully');
      return res.json(mockReport);
    }
    
    // Real database update (only runs if connected)
    const report = await Report.findById(req.params.id);

    if (!report) {
      console.log('Report not found with ID:', req.params.id);
      return res.status(404).json({ msg: 'Report not found' });
    }
    
    console.log('Current report status:', report.status);
    console.log('Current assignedTo:', report.assignedTo);
    
    report.status = status;
    if (assignedTo) {
      // Check if assignedTo is a valid MongoDB ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
        console.log('Invalid assignedTo format:', assignedTo);
        return res.status(400).json({ msg: 'Invalid assignedTo ID format' });
      }
      report.assignedTo = assignedTo;
    }

    console.log('Saving updated report');
    await report.save();
    console.log('Report saved successfully');
    
    // Send notification to the reporter about the status update
    if (report.reporter && report.reporter.toString() !== req.user.id) {
      try {
        await sendStatusUpdateNotification({
          reportId: report._id,
          reporterId: report.reporter,
          status: status,
          updatedById: req.user.id
        });
        console.log('Status update notification sent');
      } catch (notifError) {
        console.error('Error sending status update notification:', notifError);
        // Don't fail the request if notification fails
      }
    }
    
    res.json(report);
  } catch (err) {
    console.error('Error updating report status:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ msg: 'Invalid ID format' });
    }
    res.status(500).send('Server error: ' + err.message);
  }
});

// Add comment to report
router.post('/:id/comment', [auth, ...commentValidation], async (req, res) => {
  try {
    const { text } = req.body;
    const report = await Report.findById(req.params.id).populate('reporter', 'id');

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    
    // Don't send notification if user is commenting on their own report
    const shouldSendNotification = report.reporter && 
                                 report.reporter._id.toString() !== req.user.id;

    const newComment = {
      user: req.user.id,
      text,
      name: req.user.name,
      avatar: req.user.avatar
    };

    report.comments.unshift(newComment);
    await report.save();
    
    // Send notification to the reporter about the new comment
    if (shouldSendNotification) {
      try {
        await sendCommentNotification({
          reportId: report._id,
          reporterId: report.reporter._id,
          commenterId: req.user.id,
          commentText: text
        });
        console.log('Comment notification sent');
      } catch (notifError) {
        console.error('Error sending comment notification:', notifError);
        // Don't fail the request if notification fails
      }
    }
    
    res.json(report.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Vote on report urgency (Reporter only)
router.put('/:id/vote', [auth, reporter], async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Check if user has already voted
    const existingVote = report.comments.find(
      comment => comment.user.toString() === req.user.id.toString()
    );

    if (existingVote) {
      return res.status(400).json({ msg: 'Already voted' });
    }

    report.urgency += 1;
    await report.save();
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a report
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Check if user is the reporter or admin
    if (report.reporter.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this report' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Report removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.status(500).send('Server error');
  }
});

// Delete a comment
router.delete('/:reportId/comments/:commentId', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Find the comment index
    const commentIndex = report.comments.findIndex(
      comment => comment._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Check if the user is the owner of the comment or an admin
    const comment = report.comments[commentIndex];
    const isAdmin = req.user.role === 'admin';
    const isCommentOwner = comment.user.toString() === req.user.id;

    if (!isAdmin && !isCommentOwner) {
      return res.status(403).json({ msg: 'Not authorized to delete this comment' });
    }

    // Remove the comment
    report.comments.splice(commentIndex, 1);
    await report.save();

    res.json({ msg: 'Comment removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Comment not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;

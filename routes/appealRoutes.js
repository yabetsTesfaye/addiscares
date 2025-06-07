const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const {
  submitAppeal,
  getMyAppeal,
  getAppeals,
  processAppeal
} = require('../controllers/appealController');

// User routes
router.route('/')
  .post(auth, submitAppeal);

router.get('/me', auth, getMyAppeal);

// Admin routes
router.route('/')
  .get(auth, admin, getAppeals);

router.route('/:id/process')
  .put(auth, admin, processAppeal);

module.exports = router;

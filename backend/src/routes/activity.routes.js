const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const authMiddleware = require('../middleware/auth');
const protect = authMiddleware.protect || authMiddleware.requireAuth;

if (!protect) {
  console.error("❌ CRITICAL ERROR: Auth middleware not found. Check if your file exports 'protect' or 'requireAuth'");
}

// Routes
router.get('/boards/:boardId/activity', protect, activityController.getActivityLogs);
router.get('/tickets/:ticketId/activity', protect, activityController.getTicketActivityLogs);
router.get('/boards/:boardId/timeline', protect, activityController.getActivityTimeline);
router.get('/boards/:boardId/stats', protect, activityController.getActivityStats);

module.exports = router;
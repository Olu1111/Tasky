/**
 * Activity Routes
 * Routes for accessing activity logs and audit trail
 */

const express = require("express");
const router = express.Router();
const { requireAuth, requireMember } = require("../middleware/auth");
const activityController = require("../controllers/activity.controller");

// Get activity logs for a board
// GET /api/boards/:boardId/activity
router.get("/boards/:boardId/activity", requireAuth, activityController.getActivityLogs);

// Get activity timeline grouped by date
// GET /api/boards/:boardId/activity/timeline
router.get("/boards/:boardId/activity/timeline", requireAuth, activityController.getActivityTimeline);

// Get activity stats and summary
// GET /api/boards/:boardId/activity/stats
router.get("/boards/:boardId/activity/stats", requireAuth, activityController.getActivityStats);

// Get activity logs for a specific ticket
// GET /api/tickets/:ticketId/activity
router.get("/tickets/:ticketId/activity", requireAuth, activityController.getTicketActivityLogs);

module.exports = router;

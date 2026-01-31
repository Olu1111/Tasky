/**
 * Activity Controller
 * Handles retrieving and clearing activity logs
 */

const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");

/**
 * Get activity logs for a board
 * GET /api/activity/boards/:boardId/activity
 */
const getActivityLogs = asyncHandler(async (req, res) => {
  const { boardId } = req.params;
  const { entityType, userId, action, limit = 50, skip = 0 } = req.query;

  // Build query filter with 12-hour time window
  const query = { boardId };
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  query.createdAt = { $gte: twelveHoursAgo };

  if (entityType) {
    query.entityType = entityType;
  }

  if (userId) {
    query.userId = userId;
  }

  if (action) {
    query.action = action;
  }

  // Get total count for pagination
  const total = await models.ActivityLog.countDocuments(query);

  // Fetch paginated results, sorted by most recent first
  // Max 25 items per request
  const requestLimit = Math.min(parseInt(limit) || 25, 25);
  const activities = await models.ActivityLog.find(query)
    .populate("userId", "username email")
    .sort({ createdAt: -1 })
    .limit(requestLimit)
    .skip(parseInt(skip))
    .lean();

  res.json({
    success: true,
    data: activities,
    pagination: {
      total,
      limit: requestLimit,
      skip: parseInt(skip),
      hasMore: parseInt(skip) + requestLimit < total,
    },
    metadata: {
      timeWindow: '12 hours',
      maxLimit: 50,
      forgetBefore: twelveHoursAgo.toISOString()
    }
  });
});

/**
 * Get activity logs for a specific ticket
 * GET /api/activity/tickets/:ticketId/activity
 */
const getTicketActivityLogs = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { limit = 50, skip = 0 } = req.query;

  // Query with 12-hour time window
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const query = {
    entityId: ticketId,
    createdAt: { $gte: twelveHoursAgo }
  };

  // Get total count
  const total = await models.ActivityLog.countDocuments(query);

  // Fetch activities for this ticket
  // Max 25 items per request
  const requestLimit = Math.min(parseInt(limit) || 25, 25);
  const activities = await models.ActivityLog.find(query)
    .populate("userId", "username email")
    .sort({ createdAt: -1 })
    .limit(requestLimit)
    .skip(parseInt(skip))
    .lean();

  res.json({
    success: true,
    data: activities,
    pagination: {
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      hasMore: parseInt(skip) + parseInt(limit) < total,
    },
  });
});

/**
 * Get detailed timeline of activity for a board with user info
 * GET /api/activity/boards/:boardId/timeline
 */
const getActivityTimeline = asyncHandler(async (req, res) => {
  const { boardId } = req.params;
  const { days = 7, limit = 100 } = req.query;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - parseInt(days));

  const activities = await models.ActivityLog.find({
    boardId,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate("userId", "username email")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  // Group by date
  const groupedActivities = {};
  activities.forEach((activity) => {
    const dateKey = activity.createdAt.toISOString().split("T")[0];
    if (!groupedActivities[dateKey]) {
      groupedActivities[dateKey] = [];
    }
    groupedActivities[dateKey].push(activity);
  });

  res.json({
    success: true,
    data: groupedActivities,
    dateRange: {
      start: startDate,
      end: endDate,
      days: parseInt(days),
    },
  });
});

/**
 * Get activity summary/stats for a board
 * GET /api/activity/boards/:boardId/stats
 */
const getActivityStats = asyncHandler(async (req, res) => {
  const { boardId } = req.params;
  const { days = 30 } = req.query;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - parseInt(days));

  // Aggregate stats
  const stats = await models.ActivityLog.aggregate([
    {
      $match: {
        boardId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  const userStats = await models.ActivityLog.aggregate([
    {
      $match: {
        boardId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$userId",
        actionCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        username: "$user.username",
        email: "$user.email",
        actionCount: 1,
      },
    },
    {
      $sort: { actionCount: -1 },
    },
  ]);

  res.json({
    success: true,
    data: {
      actionStats: stats,
      userStats: userStats,
      dateRange: {
        start: startDate,
        end: endDate,
        days: parseInt(days),
      },
    },
  });
});


const clearActivityLogs = asyncHandler(async (req, res) => {
  const { boardId } = req.params;
  const board = await models.Board.findById(boardId);
  if (!board) {
    return res.status(404).json({
      success: false,
      message: "Board not found",
    });
  }

  const result = await models.ActivityLog.deleteMany({ boardId });

  res.json({
    success: true,
    message: "Activity logs cleared successfully",
    count: result.deletedCount,
  });
});

module.exports = {
  getActivityLogs,
  getTicketActivityLogs,
  getActivityTimeline,
  getActivityStats,
  clearActivityLogs, 
};
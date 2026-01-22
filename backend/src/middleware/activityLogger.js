/**
 * Activity Logging Middleware
 * Logs important actions to the ActivityLog collection
 */

const models = require("../models");

/**
 * Create activity log entry
 * @param {string} action - Action type (e.g., "ticket.create")
 * @param {string} userId - User ID performing the action
 * @param {string} entityType - Type of entity (ticket, comment, board, column)
 * @param {string} entityId - ID of the entity
 * @param {string} boardId - ID of the board (for querying activities by board)
 * @param {object} metadata - Additional context (old values, new values, etc.)
 */
async function logActivity(action, userId, entityType, entityId, boardId, metadata = {}) {
  try {
    await models.ActivityLog.create({
      action,
      userId,
      entityType,
      entityId,
      boardId,
      metadata,
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("Error logging activity:", error);
  }
}

/**
 * Middleware to log ticket creation
 */
function logTicketCreation(ticket) {
  if (!ticket || !ticket._id) return;

  return logActivity(
    "ticket.create",
    ticket.createdBy,
    "ticket",
    ticket._id,
    ticket.board,
    {
      title: ticket.title,
      priority: ticket.priority,
      column: ticket.column,
    }
  );
}

/**
 * Middleware to log ticket update
 */
function logTicketUpdate(ticketId, userId, boardId, changes = {}) {
  return logActivity(
    "ticket.update",
    userId,
    "ticket",
    ticketId,
    boardId,
    {
      changes,
    }
  );
}

/**
 * Middleware to log ticket move (between columns)
 */
function logTicketMove(ticketId, userId, boardId, fromColumn, toColumn, oldIndex, newIndex) {
  return logActivity(
    "ticket.move",
    userId,
    "ticket",
    ticketId,
    boardId,
    {
      fromColumn,
      toColumn,
      oldIndex,
      newIndex,
    }
  );
}

/**
 * Middleware to log ticket deletion
 */
function logTicketDeletion(ticketId, userId, boardId, isHardDelete = false) {
  return logActivity(
    "ticket.delete",
    userId,
    "ticket",
    ticketId,
    boardId,
    {
      isHardDelete,
      timestamp: new Date(),
    }
  );
}

/**
 * Middleware to log comment addition
 */
function logCommentAddition(commentId, userId, ticketId, boardId, text = "") {
  return logActivity(
    "comment.add",
    userId,
    "comment",
    commentId,
    boardId,
    {
      ticketId,
      textLength: text.length,
    }
  );
}

/**
 * Middleware to log comment deletion
 */
function logCommentDeletion(commentId, userId, ticketId, boardId) {
  return logActivity(
    "comment.delete",
    userId,
    "comment",
    commentId,
    boardId,
    {
      ticketId,
    }
  );
}

/**
 * Middleware to log board creation
 */
function logBoardCreation(boardId, userId, title = "") {
  return logActivity(
    "board.create",
    userId,
    "board",
    boardId,
    boardId, // For board activities, boardId is the entity itself
    {
      title,
    }
  );
}

/**
 * Middleware to log board updates
 */
function logBoardUpdate(boardId, userId, changes = {}) {
  return logActivity(
    "board.update",
    userId,
    "board",
    boardId,
    boardId,
    {
      changes,
    }
  );
}

/**
 * Middleware to log board deletion
 */
function logBoardDeletion(boardId, userId) {
  return logActivity(
    "board.delete",
    userId,
    "board",
    boardId,
    boardId,
    {
      timestamp: new Date(),
    }
  );
}

/**
 * Middleware to log column creation
 */
function logColumnCreation(columnId, boardId, userId, title = "") {
  return logActivity(
    "column.create",
    userId,
    "column",
    columnId,
    boardId,
    {
      title,
    }
  );
}

/**
 * Middleware to log column updates
 */
function logColumnUpdate(columnId, boardId, userId, changes = {}) {
  return logActivity(
    "column.update",
    userId,
    "column",
    columnId,
    boardId,
    {
      changes,
    }
  );
}

/**
 * Middleware to log column deletion
 */
function logColumnDeletion(columnId, boardId, userId) {
  return logActivity(
    "column.delete",
    userId,
    "column",
    columnId,
    boardId,
    {
      timestamp: new Date(),
    }
  );
}

module.exports = {
  logActivity,
  logTicketCreation,
  logTicketUpdate,
  logTicketMove,
  logTicketDeletion,
  logCommentAddition,
  logCommentDeletion,
  logBoardCreation,
  logBoardUpdate,
  logBoardDeletion,
  logColumnCreation,
  logColumnUpdate,
  logColumnDeletion,
};

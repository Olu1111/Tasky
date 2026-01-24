/**
 * Activity Logging Middleware
 * Logs important actions to the ActivityLog collection
 */

const models = require("../models");


async function logActivity(action, userId, entityType, entityId, boardId, entityName, metadata = {}) {
  try {
    await models.ActivityLog.create({
      action,
      userId,
      entityType,
      entityId,
      entityName, 
      boardId,
      metadata,
    });
  } catch (error) {
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
    ticket.title, 
    {
      priority: ticket.priority,
      column: ticket.column,
    }
  );
}

/**
 * Middleware to log ticket update
 */
function logTicketUpdate(ticketId, userId, boardId, changes = {}) {
  const name = changes.title || "Ticket";
  
  return logActivity(
    "ticket.update",
    userId,
    "ticket",
    ticketId,
    boardId,
    name,
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
    "Ticket",
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
    "Ticket",
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
    "Comment", // Comments don't really have titles
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
    "Comment",
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
    boardId, 
    title,
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
    changes.title || "Board",
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
    "Board",
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
    title,
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
    changes.title || "Column",
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
    "Column",
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
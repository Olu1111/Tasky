const models = require('../models');
const ActivityLog = require('../models/ActivityLog'); // Import the ActivityLog model directly
const { logTicketCreation, logTicketUpdate, logTicketMove, logTicketDeletion, logCommentAddition, logCommentDeletion } = require('../middleware/activityLogger');

/**
 * Check if user can modify a ticket
 * Admin, board owner, board member, or ticket assignee can modify
 */
async function canModifyTicket(ticketId, userId, userRole) {
  try {
    const ticket = await models.Ticket.findById(ticketId).populate('board');
    if (!ticket) return false;
    
    if (userRole === 'admin') return true;
    if (ticket.assignee && ticket.assignee.toString() === userId.toString()) return true;
    if (ticket.assignees && ticket.assignees.some(a => a._id.toString() === userId.toString())) return true;
    if (ticket.board.owner.toString() === userId.toString()) return true;
    if (ticket.board.members && ticket.board.members.some(m => m.toString() === userId.toString())) return true;
    return false;
  } catch (error) {
    return false;
  }
}

exports.getMyTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, priority } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { 
      $or: [
        { assignee: req.user._id },
        { assignees: req.user._id }
      ],
      deletedAt: null 
    };

    if (priority) {
      query.priority = new RegExp(`^${priority}$`, 'i');
    }

    const [tickets, total] = await Promise.all([
      models.Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignee', 'name email')
        .populate('assignees', 'name email')
        .populate('board', 'title') 
        .populate('column', 'title'),
      models.Ticket.countDocuments(query)
    ]);

    res.json({
      ok: true,
      data: {
        tickets,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get My Tickets Error:", error);
    res.status(500).json({ ok: false, error: 'Failed to fetch your tickets' });
  }
};

exports.searchTickets = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q) return res.json({ ok: true, data: { results: [], total: 0 } });

    const accessibleBoards = await models.Board.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    }).select('_id');
    const boardIds = accessibleBoards.map(b => b._id);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Search tickets
    const ticketQuery = {
      board: { $in: boardIds },
      deletedAt: null,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };

    // Search boards
    const boardQuery = {
      $or: [{ owner: req.user._id }, { members: req.user._id }],
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };

    const [tickets, boards, ticketTotal, boardTotal] = await Promise.all([
      models.Ticket.find(ticketQuery)
        .sort({ createdAt: -1 }) 
        .limit(parseInt(limit))
        .populate('assignee', 'name email')
        .populate('board', 'title')
        .populate('column', 'title'),
      models.Board.find(boardQuery)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .select('_id title description'),
      models.Ticket.countDocuments(ticketQuery),
      models.Board.countDocuments(boardQuery)
    ]);

    // Combine and interleave results
    const results = [];
    tickets.forEach(t => results.push({ type: 'ticket', data: t }));
    boards.forEach(b => results.push({ type: 'board', data: b }));
    
    res.json({
      ok: true,
      data: {
        results,
        total: ticketTotal + boardTotal,
        ticketTotal,
        boardTotal
      }
    });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ ok: false, error: 'Internal search error' });
  }
};

async function checkBoardAccess(boardId, userId, userRole) {
  try {
    const board = await models.Board.findById(boardId);
    if (!board) return false;
    if (userRole === 'admin') return true;
    const isOwner = board.owner.toString() === userId.toString();
    const isMember = board.members && board.members.some(member => member.toString() === userId.toString());
    return isOwner || isMember;
  } catch (error) {
    return false;
  }
}

exports.listTickets = async (req, res) => {
  try {
    const { assignee, status, priority, page = 1, limit = 20, sort = "createdAt", order = "desc" } = req.query;
    const query = { deletedAt: null };
    const boards = await models.Board.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    }).select('_id');
    const boardIds = boards.map(b => b._id);
    query.board = { $in: boardIds };

    if (assignee) query.assignee = assignee;
    if (priority) query.priority = new RegExp(`^${priority}$`, 'i');
    if (status) {
      if (status.match(/^[0-9a-fA-F]{24}$/)) query.column = status;
      else query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    if (["priority", "createdAt"].includes(sort)) sortObj[sort] = order === "asc" ? 1 : -1;
    else sortObj["createdAt"] = -1;

    const [tickets, total] = await Promise.all([
      models.Ticket.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignee', 'name email')
        .populate('assignees', 'name email')
        .populate('createdBy', 'name email')
        .populate('board', 'title')
        .populate('column', 'title'),
      models.Ticket.countDocuments(query)
    ]);

    res.json({ ok: true, data: { tickets, total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to list tickets' });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, boardId, columnId, assignee, assignees } = req.body;
    if (!title || !boardId || !columnId) return res.status(400).json({ ok: false, error: "Title, boardId, and columnId are required" });

    const hasAccess = await checkBoardAccess(boardId, req.user._id, req.user.role);
    if (!hasAccess) return res.status(403).json({ ok: false, error: "You don't have access to this board" });

    // Find column and verify it belongs to this board
    const column = await models.Column.findById(columnId).populate('board');
    if (!column) return res.status(400).json({ ok: false, error: "Column not found" });
    
    // Compare board IDs as strings to avoid type issues
    const columnBoardId = column.board._id || column.board;
    if (columnBoardId.toString() !== boardId.toString()) {
      return res.status(400).json({ ok: false, error: "Invalid column for this board" });
    }

    const lastTicket = await models.Ticket.findOne({ column: columnId, deletedAt: null }).sort({ position: -1 });
    const position = lastTicket ? lastTicket.position + 1 : 0;
    
    // Support both assignee (single) and assignees (array)
    const ticketData = {
      title: title.trim(),
      description: description || "",
      priority: priority || "Medium",
      board: boardId,
      column: columnId,
      createdBy: req.user._id,
      position
    };
    
    if (assignees && Array.isArray(assignees) && assignees.length > 0) {
      ticketData.assignees = assignees;
    } else if (assignee) {
      ticketData.assignee = assignee;
    }
    
    const ticket = await models.Ticket.create(ticketData);

    const populatedTicket = await models.Ticket.findById(ticket._id)
      .populate('assignee', 'name email')
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email')
      .populate('board', 'title')
      .populate('column', 'title');
    
    // TRIGGER NOTIFICATION
    await ActivityLog.create({
      action: "ticket.create",
      userId: req.user._id,
      entityType: "ticket",
      entityId: ticket._id,
      entityName: ticket.title,
      boardId: boardId
    });

    await logTicketCreation(populatedTicket);
    
    res.status(201).json({ ok: true, data: { ticket: populatedTicket } });
  } catch (error) {
    res.status(500).json({ ok: false, error: `Failed to create ticket: ${error.message}` });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await models.Ticket.canUserAccess(id, req.user._id);
    if (!hasAccess) return res.status(403).json({ ok: false, error: "You don't have access to this ticket" });

    const ticket = await models.Ticket.findById(id)
      .populate('assignee', 'name email')
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email')
      .populate('board', 'title')
      .populate('column', 'title')
      .populate({ path: 'comments', populate: { path: 'author', select: 'name email' } });

    if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found" });
    
    // Filter out deleted comments
    const activeComments = (ticket.comments || []).filter(c => !c.isDeleted);
    
    const ticketData = ticket.toObject();
    ticketData.comments = activeComments;
    ticketData.commentCount = activeComments.length;
    
    res.json({ ok: true, data: { ticket: ticketData } });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to fetch ticket" });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const hasAccess = await models.Ticket.canUserAccess(id, req.user._id);
    if (!hasAccess) return res.status(403).json({ ok: false, error: "You don't have access to this ticket" });

    delete updates._id; delete updates.createdAt; delete updates.updatedAt; delete updates.createdBy; delete updates.board;

    if (updates.column) {
      const ticket = await models.Ticket.findById(id);
      const column = await models.Column.findOne({ _id: updates.column, board: ticket.board });
      if (!column) return res.status(400).json({ ok: false, error: "Invalid column for this board" });
    }

    const ticket = await models.Ticket.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('assignee', 'name email')
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email')
      .populate('board', 'title')
      .populate('column', 'title')
      .populate({ path: 'comments', populate: { path: 'author', select: 'name email' } });

    if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found" });
    
    // Filter out deleted comments
    const activeComments = (ticket.comments || []).filter(c => !c.isDeleted);
    
    const ticketData = ticket.toObject();
    ticketData.comments = activeComments;
    ticketData.commentCount = activeComments.length;
    
    // TRIGGER NOTIFICATION
    await ActivityLog.create({
      action: "ticket.update",
      userId: req.user._id,
      entityType: "ticket",
      entityId: ticket._id,
      entityName: ticket.title,
      boardId: ticket.board._id,
      metadata: updates
    });

    await logTicketUpdate(id, req.user._id, ticket.board._id, updates);
    
    res.json({ ok: true, data: { ticket: ticketData } });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to update ticket" });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query;
    const hasAccess = await models.Ticket.canUserAccess(id, req.user._id);
    if (!hasAccess) return res.status(403).json({ ok: false, error: "You don't have access to this ticket" });

    const ticket = await models.Ticket.findById(id);
    if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found" });

    // TRIGGER NOTIFICATION
    await ActivityLog.create({
      action: "ticket.delete",
      userId: req.user._id,
      entityType: "ticket",
      entityId: ticket._id,
      entityName: ticket.title,
      boardId: ticket.board
    });

    if (hardDelete === 'true' && req.user.role === 'admin') {
      await models.Ticket.findByIdAndDelete(id);
      await logTicketDeletion(id, req.user._id, ticket.board, true);
      res.json({ ok: true, message: "Ticket permanently deleted" });
    } else {
      ticket.deletedAt = new Date();
      await ticket.save();
      await logTicketDeletion(id, req.user._id, ticket.board, false);
      res.json({ ok: true, message: "Ticket deleted" });
    }
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to delete ticket" });
  }
};

exports.moveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { columnId, index } = req.body;
    if (!columnId || typeof index !== 'number') return res.status(400).json({ ok: false, error: "columnId and index are required" });

    const hasAccess = await models.Ticket.canUserAccess(id, req.user._id);
    if (!hasAccess) return res.status(403).json({ ok: false, error: "You don't have access to this ticket" });

    const ticket = await models.Ticket.findById(id);
    const destinationColumn = await models.Column.findOne({ _id: columnId, board: ticket.board }).populate('board');
    
    const getStatusFromColumn = (columnTitle) => {
      const statusMap = { 'Backlog': 'backlog', 'Todo': 'todo', 'Doing': 'in_progress', 'Reviewing': 'review', 'Finished': 'done' };
      return statusMap[columnTitle] || 'backlog';
    };

    const newStatus = getStatusFromColumn(destinationColumn.title);
    const oldColumnId = ticket.column._id || ticket.column;
    const oldIndex = ticket.position;
    let result;
    try {
      const session = await models.Ticket.startSession();
      await session.withTransaction(async () => {
        if (ticket.column.toString() === columnId) {
          if (ticket.position < index) {
            await models.Ticket.updateMany({ column: columnId, position: { $gt: ticket.position, $lte: index }, _id: { $ne: ticket._id } }, { $inc: { position: -1 } }, { session });
          } else {
            await models.Ticket.updateMany({ column: columnId, position: { $gte: index, $lt: ticket.position }, _id: { $ne: ticket._id } }, { $inc: { position: 1 } }, { session });
          }
        } else {
          await models.Ticket.updateMany({ column: ticket.column, position: { $gt: ticket.position } }, { $inc: { position: -1 } }, { session });
          await models.Ticket.updateMany({ column: columnId, position: { $gte: index } }, { $inc: { position: 1 } }, { session });
        }
        result = await models.Ticket.findByIdAndUpdate(id, { column: columnId, position: index, status: newStatus }, { new: true, session })
          .populate('assignee', 'name email').populate('createdBy', 'name email').populate('board', 'title').populate('column', 'title');
      });
      session.endSession();
    } catch (err) {
      result = await models.Ticket.findByIdAndUpdate(id, { column: columnId, position: index, status: newStatus }, { new: true })
        .populate('assignee', 'name email').populate('createdBy', 'name email').populate('board', 'title').populate('column', 'title');
    }
    
    // TRIGGER NOTIFICATION
    await ActivityLog.create({
      action: "ticket.move",
      userId: req.user._id,
      entityType: "ticket",
      entityId: result._id,
      entityName: result.title,
      boardId: result.board._id,
      metadata: { fromColumn: oldColumnId, toColumn: columnId }
    });

    await logTicketMove(id, req.user._id, result.board._id, oldColumnId, columnId, oldIndex, index);
    
    res.json({ ok: true, data: { ticket: result } });
  } catch (error) {
    res.status(500).json({ ok: false, error: `Failed to move ticket` });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ ok: false, error: "Comment text is required" });

    const ticket = await models.Ticket.findById(id);
    if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found" });

    const comment = await models.Comment.create({
      ticket: id,
      author: req.user._id,
      text: text.trim()
    });

    ticket.comments.push(comment._id);
    await ticket.save();

    await comment.populate('author', 'name');
    
    // TRIGGER NOTIFICATION
    await ActivityLog.create({
      action: "comment.add",
      userId: req.user._id,
      entityType: "comment",
      entityId: comment._id,
      entityName: ticket.title, // Associated with the ticket name
      boardId: ticket.board
    });

    await logCommentAddition(comment._id, req.user._id, id, ticket.board, text.trim());
    
    res.status(201).json({ ok: true, data: { comment } });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to add comment" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await models.Comment.findById(commentId);
    if (!comment) return res.status(404).json({ ok: false, error: "Comment not found" });

    if (req.user.role !== 'admin' && comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized to delete this comment" });
    }

    const ticket = await models.Ticket.findById(comment.ticket);
    
    // TRIGGER NOTIFICATION
    await ActivityLog.create({
      action: "comment.delete",
      userId: req.user._id,
      entityType: "comment",
      entityId: comment._id,
      entityName: ticket.title,
      boardId: ticket.board
    });

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.text = "This comment has been deleted.";
    await comment.save();

    await logCommentDeletion(commentId, req.user._id, comment.ticket, ticket.board);

    // Return updated ticket with filtered comments (non-deleted only)
    const updatedTicket = await models.Ticket.findById(comment.ticket)
      .populate('assignee', 'name email')
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email')
      .populate('board', 'title')
      .populate('column', 'title')
      .populate({ 
        path: 'comments',
        populate: { path: 'author', select: 'name email' }
      });

    // Filter out deleted comments for the response
    const activeComments = (updatedTicket.comments || []).filter(c => !c.isDeleted);
    
    res.json({ 
      ok: true, 
      message: "Comment deleted",
      data: { 
        ticket: {
          ...updatedTicket.toObject(),
          comments: activeComments,
          commentCount: activeComments.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Internal server error during comment deletion" });
  }
};
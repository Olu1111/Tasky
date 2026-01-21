const models = require('../models');

exports.searchTickets = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q) return res.json({ ok: true, data: { tickets: [], total: 0 } });

    const accessibleBoards = await models.Board.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    }).select('_id');
    const boardIds = accessibleBoards.map(b => b._id);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {
      board: { $in: boardIds },
      deletedAt: null,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };

    const [tickets, total] = await Promise.all([
      models.Ticket.find(query)
        .sort({ createdAt: -1 }) 
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignee', 'name email')
        .populate('board', 'title')
        .populate('column', 'title'),
      models.Ticket.countDocuments(query)
    ]);

    console.log(`Search query "${q}" found ${total} results`);

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
    console.error("Search Error:", error);
    res.status(500).json({ ok: false, error: 'Internal search error' });
  }
};

async function checkBoardAccess(boardId, userId) {
  try {
    console.log('Checking board access for user:', userId, 'board:', boardId);
    const board = await models.Board.findById(boardId);
    if (!board) {
      console.log('Board not found:', boardId);
      return false;
    }
    const isOwner = board.owner.toString() === userId.toString();
    const isMember = board.members && board.members.some(member => member.toString() === userId.toString());
    console.log('Board access check:', { isOwner, isMember, owner: board.owner, members: board.members });
    return isOwner || isMember;
  } catch (error) {
    console.error('Error checking board access:', error);
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
        .populate('createdBy', 'name email')
        .populate('board', 'title')
        .populate('column', 'title'),
      models.Ticket.countDocuments(query)
    ]);

    res.json({ ok: true, data: { tickets, page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({ ok: false, error: 'Failed to list tickets' });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, boardId, columnId, assignee } = req.body;
    if (!title || !boardId || !columnId) return res.status(400).json({ ok: false, error: "Title, boardId, and columnId are required" });

    console.log('Creating ticket with data:', { title, description, priority, boardId, columnId, assignee, userId: req.user._id });

    const hasAccess = await checkBoardAccess(boardId, req.user._id);
    if (!hasAccess) {
      console.log('User does not have access to board:', boardId);
      return res.status(403).json({ ok: false, error: "You don't have access to this board" });
    }

    const column = await models.Column.findOne({ _id: columnId, board: boardId });
    if (!column) return res.status(400).json({ ok: false, error: "Invalid column for this board" });

    const lastTicket = await models.Ticket.findOne({ column: columnId, deletedAt: null }).sort({ position: -1 });
    const position = lastTicket ? lastTicket.position + 1 : 0;

    const ticket = await models.Ticket.create({
      title: title.trim(),
      description: description || "",
      priority: priority || "Medium",
      board: boardId,
      column: columnId,
      assignee: assignee || null,
      createdBy: req.user._id,
      position
    });

    const populatedTicket = await models.Ticket.findById(ticket._id)
      .populate('assignee', 'name email').populate('createdBy', 'name email').populate('board', 'title').populate('column', 'title');
    
    res.status(201).json({ ok: true, data: { ticket: populatedTicket } });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ ok: false, error: `Failed to create ticket: ${error.message}` });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const hasAccess = await models.Ticket.canUserAccess(id, req.user._id);
    if (!hasAccess) return res.status(403).json({ ok: false, error: "You don't have access to this ticket" });

    const ticket = await models.Ticket.findById(id)
      .populate('assignee', 'name email').populate('createdBy', 'name email').populate('board', 'title').populate('column', 'title')
      .populate({ path: 'comments', populate: { path: 'author', select: 'name email' } });

    if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found" });
    res.json({ ok: true, data: { ticket } });
  } catch (error) {
    console.error('Get ticket error:', error);
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
      .populate('assignee', 'name email').populate('createdBy', 'name email').populate('board', 'title').populate('column', 'title');

    if (!ticket) return res.status(404).json({ ok: false, error: "Ticket not found" });
    res.json({ ok: true, data: { ticket } });
  } catch (error) {
    console.error('Update ticket error:', error);
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

    if (hardDelete === 'true' && req.user.role === 'admin') {
      await models.Ticket.findByIdAndDelete(id);
      res.json({ ok: true, message: "Ticket permanently deleted" });
    } else {
      ticket.deletedAt = new Date();
      await ticket.save();
      res.json({ ok: true, message: "Ticket deleted" });
    }
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ ok: false, error: "Failed to delete ticket" });
  }
};

exports.moveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { columnId, index } = req.body;
    if (!columnId || typeof index !== 'number') return res.status(400).json({ ok: false, error: "columnId and index are required" });

    console.log('Move ticket request:', { id, columnId, index });

    const hasAccess = await models.Ticket.canUserAccess(id, req.user._id);
    if (!hasAccess) return res.status(403).json({ ok: false, error: "You don't have access to this ticket" });

    const ticket = await models.Ticket.findById(id);
    const destinationColumn = await models.Column.findOne({ _id: columnId, board: ticket.board }).populate('board');
    
    const getStatusFromColumn = (columnTitle) => {
      const statusMap = { 'Backlog': 'backlog', 'Todo': 'todo', 'Doing': 'in_progress', 'Reviewing': 'review', 'Finished': 'done' };
      return statusMap[columnTitle] || 'backlog';
    };

    const newStatus = getStatusFromColumn(destinationColumn.title);
    console.log('Updating ticket:', { ticketId: ticket._id, newStatus, newColumn: columnId, newPosition: index });

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
      console.warn('Session-based move failed, falling back:', err.message);
      result = await models.Ticket.findByIdAndUpdate(id, { column: columnId, position: index, status: newStatus }, { new: true })
        .populate('assignee', 'name email').populate('createdBy', 'name email').populate('board', 'title').populate('column', 'title');
    }
    console.log('Move completed successfully');
    res.json({ ok: true, data: { ticket: result } });
  } catch (error) {
    console.error('Move ticket error:', error);
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
    res.status(201).json({ ok: true, data: { comment } });
  } catch (error) {
    console.error('Add comment error:', error);
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

    comment.isDeleted = true;
    comment.text = "This comment has been deleted.";
    await comment.save();

    res.json({ ok: true, message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ ok: false, error: "Internal server error during comment deletion" });
  }
};
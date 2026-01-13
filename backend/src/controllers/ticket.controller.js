// LIST: GET /api/tickets - with filtering, pagination, sorting
exports.listTickets = async (req, res) => {
  try {
    const { assignee, status, priority, page = 1, limit = 20, sort = "createdAt", order = "desc" } = req.query;
    const query = { deletedAt: null };

    // Only show tickets user has access to (board owner or member)
    // Find boards user can access
    const boards = await models.Board.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    }).select('_id');
    const boardIds = boards.map(b => b._id);
    query.board = { $in: boardIds };

    if (assignee) query.assignee = assignee;
    if (priority) query.priority = new RegExp(`^${priority}$`, 'i');
    if (status) {
      // status can be a columnId or a status string
      if (status.match(/^[0-9a-fA-F]{24}$/)) {
        query.column = status;
      } else {
        query.status = status;
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    if (["priority", "createdAt"].includes(sort)) {
      sortObj[sort] = order === "asc" ? 1 : -1;
    } else {
      sortObj["createdAt"] = -1;
    }

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

    res.json({
      ok: true,
      data: {
        tickets,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({ ok: false, error: 'Failed to list tickets' });
  }
};
const models = require('../models');

// Helper function to check board access
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
    
    // Check if user is owner or member
    return isOwner || isMember;
  } catch (error) {
    console.error('Error checking board access:', error);
    return false;
  }
}

// CREATE: POST /api/tickets
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, boardId, columnId, assignee } = req.body;
    
    // Validate required fields
    if (!title || !boardId || !columnId) {
      return res.status(400).json({ 
        ok: false, 
        error: "Title, boardId, and columnId are required" 
      });
    }

    console.log('Creating ticket with data:', { title, description, priority, boardId, columnId, assignee, userId: req.user._id });

    // Check if user has access to the board
    const hasAccess = await checkBoardAccess(boardId, req.user._id);
    if (!hasAccess) {
      console.log('User does not have access to board:', boardId);
      return res.status(403).json({ 
        ok: false, 
        error: "You don't have access to this board" 
      });
    }

    // Validate column belongs to board
    const column = await models.Column.findOne({ _id: columnId, board: boardId });
    if (!column) {
      console.log('Column not found or does not belong to board:', { columnId, boardId });
      return res.status(400).json({ 
        ok: false, 
        error: "Invalid column for this board" 
      });
    }

    // Get the highest position in the column for default placement
    const lastTicket = await models.Ticket.findOne({ 
      column: columnId, 
      deletedAt: null 
    }).sort({ position: -1 });
    const position = lastTicket ? lastTicket.position + 1 : 0;

    console.log('Creating ticket with position:', position);

    // Create the ticket
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

    console.log('Ticket created successfully:', ticket._id);

    // Fetch the ticket again with populated fields
    const populatedTicket = await models.Ticket.findById(ticket._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('board', 'title')
      .populate('column', 'title');
    
    res.status(201).json({ 
      ok: true, 
      data: { ticket: populatedTicket } 
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        ok: false, 
        error: `Validation error: ${Object.values(error.errors).map(e => e.message).join(', ')}` 
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        ok: false, 
        error: `Invalid ID format: ${error.path}` 
      });
    }
    res.status(500).json({ 
      ok: false, 
      error: `Failed to create ticket: ${error.message}` 
    });
  }
};

// READ: GET /api/tickets/:id
exports.getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access using the static method
    const hasAccess = await models.Ticket.canUserAccess(id, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ 
        ok: false, 
        error: "You don't have access to this ticket" 
      });
    }

    const ticket = await models.Ticket.findById(id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('board', 'title')
      .populate('column', 'title')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name email'
        }
      });

    if (!ticket) {
      return res.status(404).json({ 
        ok: false, 
        error: "Ticket not found" 
      });
    }

    res.json({ 
      ok: true, 
      data: { ticket } 
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ 
      ok: false, 
      error: "Failed to fetch ticket" 
    });
  }
};

// UPDATE: PUT/PATCH /api/tickets/:id
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check access
    const hasAccess = await models.Ticket.canUserAccess(id, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ 
        ok: false, 
        error: "You don't have access to this ticket" 
      });
    }

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.createdBy;
    delete updates.board; // Board changes should be handled separately

    // Validate priority if provided
    if (updates.priority && !['Low', 'Medium', 'High'].includes(updates.priority)) {
      return res.status(400).json({ 
        ok: false, 
        error: "Priority must be Low, Medium, or High" 
      });
    }

    // If column is being changed, validate it belongs to the same board
    if (updates.column) {
      const ticket = await models.Ticket.findById(id);
      const column = await models.Column.findOne({ 
        _id: updates.column, 
        board: ticket.board 
      });
      if (!column) {
        return res.status(400).json({ 
          ok: false, 
          error: "Invalid column for this board" 
        });
      }
    }

    // Trim title if provided
    if (updates.title) {
      updates.title = updates.title.trim();
    }

    const ticket = await models.Ticket.findByIdAndUpdate(
      id,
      updates,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('assignee', 'name email')
     .populate('createdBy', 'name email')
     .populate('board', 'title')
     .populate('column', 'title');

    if (!ticket) {
      return res.status(404).json({ 
        ok: false, 
        error: "Ticket not found" 
      });
    }

    res.json({ 
      ok: true, 
      data: { ticket } 
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        ok: false, 
        error: error.message 
      });
    }
    res.status(500).json({ 
      ok: false, 
      error: "Failed to update ticket" 
    });
  }
};

// DELETE: DELETE /api/tickets/:id (soft delete by default)
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query; // Query param for hard delete
    
    // Check access
    const hasAccess = await models.Ticket.canUserAccess(id, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({ 
        ok: false, 
        error: "You don't have access to this ticket" 
      });
    }

    const ticket = await models.Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ 
        ok: false, 
        error: "Ticket not found" 
      });
    }

    if (hardDelete === 'true' && req.user.role === 'admin') {
      // Hard delete - only admins can do this
      await models.Ticket.findByIdAndDelete(id);
      res.json({ 
        ok: true, 
        message: "Ticket permanently deleted" 
      });
    } else {
      // Soft delete
      ticket.deletedAt = new Date();
      await ticket.save();
      res.json({ 
        ok: true, 
        message: "Ticket deleted" 
      });
    }
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ 
      ok: false, 
      error: "Failed to delete ticket" 
    });
  }
};

// MOVE: PATCH /api/tickets/:id/move
exports.moveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { columnId, index } = req.body;

    console.log('Move ticket request:', { id, columnId, index });

    // Validate required parameters
    if (!columnId || typeof index !== 'number') {
      return res.status(400).json({
        ok: false,
        error: "columnId and index are required"
      });
    }

    // Check access
    const hasAccess = await models.Ticket.canUserAccess(id, req.user._id);
    if (!hasAccess) {
      return res.status(403).json({
        ok: false,
        error: "You don't have access to this ticket"
      });
    }

    // Get the ticket
    const ticket = await models.Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        ok: false,
        error: "Ticket not found"
      });
    }

    // Validate column belongs to same board and get column details
    const destinationColumn = await models.Column.findOne({
      _id: columnId,
      board: ticket.board
    }).populate('board');

    if (!destinationColumn) {
      return res.status(400).json({
        ok: false,
        error: "Invalid column for this board"
      });
    }

    // Map column title to status
    const getStatusFromColumn = (columnTitle) => {
      const statusMap = {
        'Backlog': 'backlog',
        'Todo': 'todo',
        'Doing': 'in_progress',
        'Reviewing': 'review',
        'Finished': 'done'
      };
      return statusMap[columnTitle] || 'backlog';
    };

    const newStatus = getStatusFromColumn(destinationColumn.title);

    console.log('Updating ticket:', { ticketId: ticket._id, newStatus, newColumn: columnId, newPosition: index });

    // Handle position updates - reorder tickets in the destination column
    // Try to use sessions, but fall back if not available
    let result;
    
    try {
      const session = await models.Ticket.startSession();
      await session.withTransaction(async () => {
        // If moving within the same column, adjust positions
        if (ticket.column.toString() === columnId) {
          if (ticket.position < index) {
            // Moving down: shift tickets up
            await models.Ticket.updateMany(
              {
                column: columnId,
                position: { $gt: ticket.position, $lte: index },
                _id: { $ne: ticket._id }
              },
              { $inc: { position: -1 } },
              { session }
            );
          } else if (ticket.position > index) {
            // Moving up: shift tickets down
            await models.Ticket.updateMany(
              {
                column: columnId,
                position: { $gte: index, $lt: ticket.position },
                _id: { $ne: ticket._id }
              },
              { $inc: { position: 1 } },
              { session }
            );
          }
        } else {
          // Moving to different column
          // Remove from source column (shift up positions after current)
          await models.Ticket.updateMany(
            {
              column: ticket.column,
              position: { $gt: ticket.position }
            },
            { $inc: { position: -1 } },
            { session }
          );

          // Make space in destination column (shift down positions from index)
          await models.Ticket.updateMany(
            {
              column: columnId,
              position: { $gte: index }
            },
            { $inc: { position: 1 } },
            { session }
          );
        }

        // Update the ticket
        result = await models.Ticket.findByIdAndUpdate(
          id,
          {
            column: columnId,
            position: index,
            status: newStatus
          },
          { new: true, session }
        ).populate('assignee', 'name email')
         .populate('createdBy', 'name email')
         .populate('board', 'title')
         .populate('column', 'title');
      });

      await session.commitTransaction();
      session.endSession();
    } catch (sessionError) {
      console.warn('Session-based move failed, falling back to non-transactional update:', sessionError.message);
      
      // Fallback: Simple update without transactions
      result = await models.Ticket.findByIdAndUpdate(
        id,
        {
          column: columnId,
          position: index,
          status: newStatus
        },
        { new: true }
      ).populate('assignee', 'name email')
       .populate('createdBy', 'name email')
       .populate('board', 'title')
       .populate('column', 'title');
    }

    // Get updated column data (both source and destination if different)
    const affectedColumns = [];
    const destinationColumnData = await models.Column.findById(columnId).populate({
      path: 'board',
      select: 'title'
    });

    // Get tickets in the destination column
    const destinationTickets = await models.Ticket.find({
      column: columnId,
      deletedAt: null
    })
    .sort({ position: 1 })
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');

    affectedColumns.push({
      ...destinationColumnData.toObject(),
      items: destinationTickets
    });

    // If moved to different column, also include source column data
    if (ticket.column.toString() !== columnId) {
      const sourceColumnData = await models.Column.findById(ticket.column).populate({
        path: 'board',
        select: 'title'
      });

      const sourceTickets = await models.Ticket.find({
        column: ticket.column,
        deletedAt: null
      })
      .sort({ position: 1 })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

      affectedColumns.push({
        ...sourceColumnData.toObject(),
        items: sourceTickets
      });
    }

    console.log('Move completed successfully');

    res.json({
      ok: true,
      data: {
        ticket: result,
        affectedColumns
      }
    });

  } catch (error) {
    console.error('Move ticket error:', error);
    res.status(500).json({
      ok: false,
      error: `Failed to move ticket: ${error.message}`
    });
  }
};
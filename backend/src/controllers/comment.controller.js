const models = require('../models');

// POST /api/tickets/:id/comments - Add comment to ticket
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params; // ticket id
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ ok: false, error: 'Comment text is required' });
    }
    // Check ticket exists
    const ticket = await models.Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: 'Ticket not found' });
    }
    // Create comment
    const comment = await models.Comment.create({
      ticket: id,
      author: req.user._id,
      text: text.trim()
    });
    // Add comment to ticket's comments array
    ticket.comments.push(comment._id);
    await ticket.save();
    // Populate author for response
    await comment.populate('author', 'name email');
    res.status(201).json({ ok: true, data: { comment } });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ ok: false, error: 'Failed to add comment' });
  }
};

// GET /api/tickets/:id/comments - Get all comments for a ticket
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params; // ticket id
    // Check ticket exists
    const ticket = await models.Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ ok: false, error: 'Ticket not found' });
    }
    // Get comments, newest first
    const comments = await models.Comment.find({ ticket: id })
      .sort({ createdAt: -1 })
      .populate('author', 'name email');
    res.json({ ok: true, data: { comments } });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ ok: false, error: 'Failed to get comments' });
  }
};

// DELETE /api/comments/:id - Delete comment (admin or author only)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params; // comment id
    const comment = await models.Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ ok: false, error: 'Comment not found' });
    }
    // Only author or admin can delete
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ ok: false, error: 'Not authorized to delete this comment' });
    }
    // Remove from ticket's comments array
    await models.Ticket.findByIdAndUpdate(comment.ticket, {
      $pull: { comments: comment._id }
    });
    await comment.deleteOne();
    res.json({ ok: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete comment' });
  }
};

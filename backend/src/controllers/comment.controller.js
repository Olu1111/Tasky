const models = require('../models');

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ ok: false, error: 'Comment text is required' });
    }
    
    // Only members and admins can add comments
    if (!["admin", "member"].includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Only members and admins can add comments" });
    }

    const ticket = await models.Ticket.findById(id).populate('board');
    if (!ticket) {
      return res.status(404).json({ ok: false, error: 'Ticket not found' });
    }

    // Check if user has access to the board/ticket
    const isAdmin = req.user.role === 'admin';
    const isAssignee = ticket.assignee && ticket.assignee.toString() === req.user._id.toString();
    const isBoardOwner = ticket.board && ticket.board.owner.toString() === req.user._id.toString();
    const isBoardMember = ticket.board && ticket.board.members.some(m => m.toString() === req.user._id.toString());

    if (!isAdmin && !isAssignee && !isBoardOwner && !isBoardMember) {
      return res.status(403).json({ ok: false, error: "You don't have access to this ticket" });
    }

    const comment = await models.Comment.create({
      ticket: id,
      author: req.user._id,
      text: text.trim()
    });

    ticket.comments.push(comment._id);
    await ticket.save();

    await comment.populate('author', 'name email');
    res.status(201).json({ ok: true, data: { comment } });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ ok: false, error: 'Failed to add comment' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params; 
    const comment = await models.Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ ok: false, error: 'Comment not found' });
    }

    // Only members and admins can delete comments
    if (!["admin", "member"].includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Only members and admins can delete comments" });
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ ok: false, error: 'Not authorized to delete this comment' });
    }

    await models.Ticket.findByIdAndUpdate(comment.ticket, {
      $pull: { comments: comment._id }
    });

    await comment.deleteOne();

    res.json({ ok: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete comment' });
  }
};
const models = require('../models');

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ ok: false, error: 'Comment text is required' });
    }

    const ticket = await models.Ticket.findById(id).populate('board');
    if (!ticket) {
      return res.status(404).json({ ok: false, error: 'Ticket not found' });
    }

    // Check if user has access to the board/ticket
    const isAdmin = req.user.role === 'admin';
    const isCreator = ticket.createdBy.toString() === req.user._id.toString();
    const isAssignee = ticket.assignees && ticket.assignees.some(a => a.toString() === req.user._id.toString());
    const isBoardOwner = ticket.board && ticket.board.owner.toString() === req.user._id.toString();
    const isBoardMember = ticket.board && ticket.board.members.some(m => m.toString() === req.user._id.toString());

    if (!isAdmin && !isCreator && !isAssignee && !isBoardOwner && !isBoardMember) {
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

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ ok: false, error: 'Comment text is required' });
    }

    const comment = await models.Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ ok: false, error: 'Comment not found' });
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ ok: false, error: 'Not authorized to edit this comment' });
    }

    comment.text = text.trim();
    await comment.save();
    await comment.populate('author', 'name email');

    res.json({ ok: true, data: { comment } });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ ok: false, error: 'Failed to update comment' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params; 
    const comment = await models.Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ ok: false, error: 'Comment not found' });
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
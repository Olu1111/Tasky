const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { requireAuth, requireMember } = require('../middleware/auth');

router.use(requireAuth);

// Only members and admins can add and delete comments
router.post('/:id/comments', requireMember, commentController.addComment);
router.delete('/:id/comments/:commentId', requireMember, commentController.deleteComment);

module.exports = router; 
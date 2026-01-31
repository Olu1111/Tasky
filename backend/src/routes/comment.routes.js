const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// All authenticated users can add comments
router.post('/:id/comments', commentController.addComment);

// All authenticated users can update their own comments (or admins can update any)
router.put('/:id/comments/:commentId', commentController.updateComment);

// All authenticated users can delete their own comments (or admins can delete any)
router.delete('/:id/comments/:commentId', commentController.deleteComment);

module.exports = router; 
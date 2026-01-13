const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { requireAuth } = require('../middleware/auth');

// All comment routes require authentication
router.use(requireAuth);


// DELETE /api/comments/:id - Delete comment (admin or author only)
router.delete('/:id', commentController.deleteComment);

module.exports = router;

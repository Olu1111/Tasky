const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);
router.post('/:id/comments', commentController.addComment);
router.delete('/:id/comments/:commentId', commentController.deleteComment);
module.exports = router; 
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All ticket routes require authentication
router.use(requireAuth);


// LIST: GET /api/tickets (with filters, pagination, sorting)
router.get('/', ticketController.listTickets);

// CREATE: POST /api/tickets
router.post('/', ticketController.createTicket);

// READ: GET /api/tickets/:id
router.get('/:id', ticketController.getTicket);

// UPDATE: PUT /api/tickets/:id
router.put('/:id', ticketController.updateTicket);
router.patch('/:id', ticketController.updateTicket);

// MOVE: PATCH /api/tickets/:id/move
router.patch('/:id/move', ticketController.moveTicket);

// DELETE: DELETE /api/tickets/:id
// Soft delete by default, hard delete with ?hardDelete=true (admin only)
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;

// --- Comment routes for tickets ---
const commentController = require('../controllers/comment.controller');

// POST /api/tickets/:id/comments - Add comment to ticket
router.post('/:id/comments', commentController.addComment);

// GET /api/tickets/:id/comments - Get all comments for a ticket
router.get('/:id/comments', commentController.getComments);
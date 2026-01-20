const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { requireAuth } = require('../middleware/auth');

// All ticket routes require authentication
router.use(requireAuth);
router.get('/search', ticketController.searchTickets);

// --- Standard Ticket Routes ---
// LIST: GET /api/tickets
router.get('/', ticketController.listTickets);

// CREATE: POST /api/tickets
router.post('/', ticketController.createTicket);

// READ: GET /api/tickets/:id
router.get('/:id', ticketController.getTicket);

// UPDATE: PUT/PATCH /api/tickets/:id
router.put('/:id', ticketController.updateTicket);
router.patch('/:id', ticketController.updateTicket);

// MOVE: PATCH /api/tickets/:id/move
router.patch('/:id/move', ticketController.moveTicket);

// DELETE: DELETE /api/tickets/:id
router.delete('/:id', ticketController.deleteTicket);

// POST /api/tickets/:id/comments - Add comment
router.post('/:id/comments', ticketController.addComment);

// DELETE /api/tickets/:id/comments/:commentId - Delete comment
router.delete('/:id/comments/:commentId', ticketController.deleteComment);

module.exports = router;
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { requireAuth, requireMember } = require('../middleware/auth');

// All ticket endpoints require authentication
router.use(requireAuth);

// GET endpoints - viewers, members, and admins can search and list
router.get('/search', ticketController.searchTickets);
router.get('/mine', ticketController.getMyTickets);
router.get('/', ticketController.listTickets);
router.get('/:id', ticketController.getTicket);

// POST/PUT/PATCH/DELETE endpoints - all authenticated users can modify
router.post('/', requireAuth, ticketController.createTicket);
router.put('/:id', requireAuth, ticketController.updateTicket);
router.patch('/:id', requireAuth, ticketController.updateTicket);
router.patch('/:id/move', requireAuth, ticketController.moveTicket);
router.delete('/:id', requireAuth, ticketController.deleteTicket);

// Comments - all authenticated users can add/delete
router.post('/:id/comments', requireAuth, ticketController.addComment);
router.delete('/:id/comments/:commentId', requireAuth, ticketController.deleteComment);

module.exports = router;
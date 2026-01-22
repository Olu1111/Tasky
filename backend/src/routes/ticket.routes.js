const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { requireAuth } = require('../middleware/auth');


router.use(requireAuth);
router.get('/search', ticketController.searchTickets);
router.get('/mine', ticketController.getMyTickets);
router.get('/', ticketController.listTickets);
router.post('/', ticketController.createTicket);
router.get('/:id', ticketController.getTicket);
router.put('/:id', ticketController.updateTicket);
router.patch('/:id', ticketController.updateTicket);
router.patch('/:id/move', ticketController.moveTicket);
router.delete('/:id', ticketController.deleteTicket);
router.post('/:id/comments', ticketController.addComment);
router.delete('/:id/comments/:commentId', ticketController.deleteComment);
module.exports = router;
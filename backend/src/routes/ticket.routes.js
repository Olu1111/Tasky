const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { requireAuth } = require('../middleware/auth'); 

router.patch('/:id/move', requireAuth, ticketController.moveTicket);

module.exports = router;
const models = require('../models');

exports.moveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { columnId, index } = req.body;

    const ticket = await models.Ticket.findByIdAndUpdate(
      id,
      { column: columnId, position: index },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ ok: false, error: "Ticket not found" });
    }

    res.json({ ok: true, data: ticket });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Failed to move ticket" });
  }
};
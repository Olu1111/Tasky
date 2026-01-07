const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");

// Add a column to a board (admin-only)
async function addColumn(req, res) {
  const boardId = req.params.id;
  const { title, position } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ ok: false, error: "`title` is required" });
  }

  try {
    const board = await models.Board.findById(boardId);
    if (!board) return res.status(404).json({ ok: false, error: "Board not found" });

    // determine position
    let pos = position;
    if (pos === undefined || pos === null) {
      const max = await models.Column.find({ board: boardId }).sort({ position: -1 }).limit(1);
      pos = max.length ? max[0].position + 1 : 0;
    } else {
      // shift existing columns at >= pos
      await models.Column.updateMany({ board: boardId, position: { $gte: pos } }, { $inc: { position: 1 } });
    }

    const column = await models.Column.create({ title: title.trim(), board: boardId, position: pos });
    return res.status(201).json({ ok: true, data: { column } });
  } catch (err) {
    console.error("addColumn error:", err);
    return res.status(500).json({ ok: false, error: "Failed to add column" });
  }
}

// Update column (rename or reposition) (admin-only)
async function updateColumn(req, res) {
  const columnId = req.params.id;
  const { title, position } = req.body;

  try {
    const column = await models.Column.findById(columnId);
    if (!column) return res.status(404).json({ ok: false, error: "Column not found" });

    const updates = {};
    if (title !== undefined) {
      if (!title || typeof title !== "string" || !title.trim()) return res.status(400).json({ ok: false, error: "`title` must be a non-empty string" });
      updates.title = title.trim();
    }

    if (position !== undefined && position !== column.position) {
      const boardId = column.board;
      const oldPos = column.position;
      const newPos = Number(position);
      if (isNaN(newPos) || newPos < 0) return res.status(400).json({ ok: false, error: "`position` must be a non-negative number" });

      // shift other columns between oldPos and newPos
      if (newPos > oldPos) {
        await models.Column.updateMany({ board: boardId, position: { $gt: oldPos, $lte: newPos } }, { $inc: { position: -1 } });
      } else if (newPos < oldPos) {
        await models.Column.updateMany({ board: boardId, position: { $gte: newPos, $lt: oldPos } }, { $inc: { position: 1 } });
      }
      updates.position = newPos;
    }

    Object.assign(column, updates);
    await column.save();
    return res.json({ ok: true, data: { column } });
  } catch (err) {
    console.error("updateColumn error:", err);
    return res.status(500).json({ ok: false, error: "Failed to update column" });
  }
}

// Delete column (admin-only). Prevent deletion if tickets exist.
async function deleteColumn(req, res) {
  const columnId = req.params.id;
  try {
    const column = await models.Column.findById(columnId);
    if (!column) return res.status(404).json({ ok: false, error: "Column not found" });

    const ticketCount = await models.Ticket.countDocuments({ column: columnId });
    if (ticketCount > 0) {
      return res.status(400).json({ ok: false, error: "Cannot delete column with existing tickets" });
    }

    const boardId = column.board;
    const removedPos = column.position;
    await column.deleteOne();

    // shift positions of remaining columns
    await models.Column.updateMany({ board: boardId, position: { $gt: removedPos } }, { $inc: { position: -1 } });

    return res.json({ ok: true, data: { message: "Deleted" } });
  } catch (err) {
    console.error("deleteColumn error:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete column" });
  }
}

module.exports = {
  addColumn: asyncHandler(addColumn),
  updateColumn: asyncHandler(updateColumn),
  deleteColumn: asyncHandler(deleteColumn),
};

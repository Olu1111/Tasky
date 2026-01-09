const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");

// GET /api/boards/:id/columns 
async function listColumns(req, res) {
  const boardId = req.params.id;
  try {
    const columns = await models.Column.find({ board: boardId }).sort({ position: 1 }).lean();
    const tickets = await models.Ticket.find({ board: boardId }).sort({ position: 1 }).lean();

    const combinedData = columns.map(col => ({
      ...col,
      items: tickets.filter(t => t.column.toString() === col._id.toString())
    }));

    return res.json(combinedData);
  } catch (err) {
    console.error("listColumns error:", err);
    return res.status(500).json({ ok: false, error: "Failed to list columns" });
  }
}

async function addColumn(req, res) {
  const boardId = req.params.id;
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ ok: false, error: "Title is required" });

  try {
    const count = await models.Column.countDocuments({ board: boardId });
    const column = await models.Column.create({ 
      title: title.trim(), 
      board: boardId, 
      position: count 
    });
    return res.status(201).json({ ok: true, data: { column } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Failed to add column" });
  }
}

async function updateColumn(req, res) {
  const { id } = req.params;
  const { title, position } = req.body;
  try {
    const column = await models.Column.findByIdAndUpdate(id, { title, position }, { new: true });
    return res.json({ ok: true, data: { column } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Failed to update column" });
  }
}

async function deleteColumn(req, res) {
  const { id } = req.params;
  try {
    await models.Column.findByIdAndDelete(id);
    return res.json({ ok: true, message: "Column deleted" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Failed to delete column" });
  }
}

module.exports = {
  listColumns: asyncHandler(listColumns),
  addColumn: asyncHandler(addColumn),
  updateColumn: asyncHandler(updateColumn),
  deleteColumn: asyncHandler(deleteColumn)
};
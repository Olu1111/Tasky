const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");


const addColumn = asyncHandler(async (req, res) => {
  const boardId = req.params.id; // grabs board ID from URL
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ ok: false, error: "Title is required" });
  }

  // Determine position: find the count and put it at the end
  const columnCount = await models.Column.countDocuments({ board: boardId });
  
  const column = await models.Column.create({
    title: title.trim(),
    board: boardId,
    position: columnCount
  });

  // Frontend expects data.column
  return res.status(201).json({ ok: true, data: { column } });
});

const listColumnsByBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id;

  // Fetch all columns for this board
  const columns = await models.Column.find({ board: boardId }).sort("position");
  const columnsWithItems = await Promise.all(columns.map(async (col) => {
    const tickets = await models.Ticket.find({ column: col._id }).sort("position");
    return { ...col.toObject(), items: tickets };
  }));

  res.json(columnsWithItems);
});

const updateColumn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const column = await models.Column.findByIdAndUpdate(id, { title }, { new: true });
  if (!column) return res.status(404).json({ ok: false, error: "Column not found" });
  res.json({ ok: true, data: { column } });
});

const deleteColumn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await models.Column.findByIdAndDelete(id);
  res.json({ ok: true, data: { message: "Deleted" } });
});

module.exports = {
  addColumn,
  listColumnsByBoard,
  updateColumn,
  deleteColumn
};
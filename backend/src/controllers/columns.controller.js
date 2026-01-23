const models = require("../models");
const ActivityLog = require("../models/ActivityLog"); // 🎯 ADDED
const { asyncHandler } = require("../utils/asyncHandler");

/**
 * Check if user can modify a board
 */
const canModifyBoard = async (boardId, user) => {
  try {
    const board = await models.Board.findById(boardId);
    if (!board) return false;
    if (user.role === 'admin') return true;
    if (board.owner.toString() === user._id.toString()) return true;
    return false;
  } catch (error) {
    return false;
  }
};

const addColumn = asyncHandler(async (req, res) => {
  const boardId = req.params.id; 
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ ok: false, error: "Title is required" });
  }

  const hasPermission = await canModifyBoard(boardId, req.user);
  if (!hasPermission) {
    return res.status(403).json({ ok: false, error: "You do not have permission to modify this board" });
  }

  const board = await models.Board.findById(boardId);
  if (!board) {
    return res.status(404).json({ ok: false, error: "Board not found" });
  }

  const columnCount = await models.Column.countDocuments({ board: boardId });
  
  const column = await models.Column.create({
    title: title.trim(),
    board: boardId,
    position: columnCount
  });

  await ActivityLog.create({
    action: "column.create",
    userId: req.user._id,
    entityType: "column",
    entityId: column._id,
    entityName: column.title,
    boardId: boardId
  });

  return res.status(201).json({ ok: true, data: { column } });
});

const listColumnsByBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id;

  const board = await models.Board.findById(boardId);
  if (!board) {
    return res.status(404).json({ ok: false, error: "Board not found" });
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = board.owner.toString() === req.user._id.toString();
  const isMember = board.members.some(m => m.toString() === req.user._id.toString());

  if (!isAdmin && !isOwner && !isMember) {
    return res.status(403).json({ ok: false, error: "You do not have access to this board" });
  }

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
  
  const column = await models.Column.findById(id);
  if (!column) return res.status(404).json({ ok: false, error: "Column not found" });

  const hasPermission = await canModifyBoard(column.board, req.user);
  if (!hasPermission) {
    return res.status(403).json({ ok: false, error: "You do not have permission to modify this column" });
  }

  const updatedColumn = await models.Column.findByIdAndUpdate(id, { title }, { new: true });

  await ActivityLog.create({
    action: "column.update",
    userId: req.user._id,
    entityType: "column",
    entityId: id,
    entityName: updatedColumn.title,
    boardId: updatedColumn.board
  });

  res.json({ ok: true, data: { column: updatedColumn } });
});

const deleteColumn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const column = await models.Column.findById(id);
  if (!column) return res.status(404).json({ ok: false, error: "Column not found" });

  const hasPermission = await canModifyBoard(column.board, req.user);
  if (!hasPermission) {
    return res.status(403).json({ ok: false, error: "You do not have permission to delete this column" });
  }


  await ActivityLog.create({
    action: "column.delete",
    userId: req.user._id,
    entityType: "column",
    entityId: id,
    entityName: column.title,
    boardId: column.board
  });

  await models.Column.findByIdAndDelete(id);
  res.json({ ok: true, data: { message: "Deleted" } });
});

module.exports = {
  addColumn,
  listColumnsByBoard,
  updateColumn,
  deleteColumn
};
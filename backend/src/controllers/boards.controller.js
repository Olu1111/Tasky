const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");

// GET /api/boards/:id
const getBoardById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const board = await models.Board.findById(id);
    if (!board) return res.status(404).json({ ok: false, error: "Board not found" });
    return res.json({ ok: true, data: { board } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Failed to fetch board" });
  }
});

// GET /api/boards
const listBoards = asyncHandler(async (req, res) => {
  const actor = req.user;
  if (!actor) return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    let boards;
    if (actor.role === "admin") {
      // Admins see everything
      boards = await models.Board.find().sort({ createdAt: -1 });
    } else {
      // Members see their own boards
      boards = await models.Board.find({ 
        $or: [{ owner: actor._id }, { members: actor._id }] 
      }).sort({ createdAt: -1 });
    }
    return res.json({ ok: true, data: { boards } });
  } catch (err) {
    console.error("listBoards error:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch boards" });
  }
});

// POST /api/boards
const createBoard = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ ok: false, error: "`title` is required" });
  }

  const ownerId = req.user && req.user._id;
  let board;
  try {
    board = await models.Board.create({ title: title.trim(), description: description || "", owner: ownerId });

    // Create default columns in order
    const columnsData = ["Backlog", "Todo", "In Progress", "Review", "Done"];
    const colsToCreate = columnsData.map((t, i) => ({ title: t, board: board._id, position: i }));
    const createdColumns = await models.Column.insertMany(colsToCreate);

    return res.status(201).json({ ok: true, data: { board, columns: createdColumns } });
  } catch (err) {
    console.error("createBoard error:", err);
    if (board && board._id) await models.Board.findByIdAndDelete(board._id);
    return res.status(500).json({ ok: false, error: "Failed to create board" });
  }
});

module.exports = {
  getBoardById,
  listBoards,
  createBoard
};
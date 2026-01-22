const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");
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

const listBoards = asyncHandler(async (req, res) => {
  const actor = req.user;
  if (!actor) return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    let boards;
    if (actor.role === "admin") {
      boards = await models.Board.find().sort({ createdAt: -1 });
    } else {
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

const deleteBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const board = await models.Board.findById(id);
    if (!board) {
      return res.status(404).json({ ok: false, error: "Board not found" });
    }

    const isOwner = board.owner.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ ok: false, error: "Unauthorized to delete this board" });
    }

    await models.Board.findByIdAndDelete(id);
    await models.Column.deleteMany({ board: id });
    await models.Ticket.deleteMany({ board: id });

    return res.json({ ok: true, message: "Board and all associated data deleted" });
  } catch (err) {
    console.error("deleteBoard error:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete board" });
  }
});

module.exports = {
  getBoardById,
  listBoards,
  createBoard,
  deleteBoard 
};
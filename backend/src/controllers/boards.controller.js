const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");

async function createBoard(req, res) {
  const { title, description } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ ok: false, error: "`title` is required" });
  }

  const ownerId = req.user && req.user._id;
  let board;
  try {
    board = await models.Board.create({ title: title.trim(), description: description || "", owner: ownerId });

    // Create default columns in order and persist their positions
    const columnsData = ["Backlog", "Todo", "In Progress", "Review", "Done"];
    const colsToCreate = columnsData.map((t, i) => ({ title: t, board: board._id, position: i }));
    const createdColumns = await models.Column.insertMany(colsToCreate);

    return res.status(201).json({ ok: true, data: { board, columns: createdColumns } });
  } catch (err) {
    console.error("createBoard error:", err);
    // cleanup partial board if created
    try {
      if (board && board._id) await models.Board.findByIdAndDelete(board._id);
    } catch (cleanupErr) {
      console.error("Failed to cleanup board after error:", cleanupErr);
    }
    return res.status(500).json({ ok: false, error: "Failed to create board" });
  }
}

module.exports = { createBoard: asyncHandler(createBoard) };

async function listBoards(req, res) {
  const actor = req.user;
  if (!actor) return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    let boards;
    if (actor.role === "admin") {
      boards = await models.Board.find().sort({ createdAt: -1 });
    } else {
      boards = await models.Board.find({ owner: actor._id }).sort({ createdAt: -1 });
    }

    return res.json({ ok: true, data: { boards } });
  } catch (err) {
    console.error("listBoards error:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch boards" });
  }
}

module.exports.listBoards = asyncHandler(listBoards);

const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");

async function getBoardById(req, res) {
  const { id } = req.params;
  try {
    const board = await models.Board.findById(id);
    if (!board) return res.status(404).json({ ok: false, error: "Board not found" });
    return res.json({ ok: true, data: { board } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Failed to fetch board" });
  }
}

async function listBoards(req, res) {
  try {
    const boards = await models.Board.find({ 
      $or: [{ owner: req.user._id }, { members: req.user._id }] 
    }).sort({ createdAt: -1 });
    return res.json({ ok: true, data: { boards } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Failed to fetch boards" });
  }
}

async function createBoard(req, res) {
  const { title } = req.body;
  try {
    const board = await models.Board.create({ title, owner: req.user._id });
    const defaults = ["Backlog", "Todo", "In Progress", "Done"];
    await models.Column.insertMany(defaults.map((t, i) => ({ title: t, board: board._id, position: i })));
    return res.status(201).json({ ok: true, data: { board } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Failed to create board" });
  }
}

module.exports = {
  getBoardById: asyncHandler(getBoardById),
  listBoards: asyncHandler(listBoards),
  createBoard: asyncHandler(createBoard)
};
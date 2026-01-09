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
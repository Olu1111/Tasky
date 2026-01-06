const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");

async function createBoard(req, res) {
  const { title, description } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ ok: false, error: "`title` is required" });
  }

  const ownerId = req.user && req.user._id;
  try {
    const board = await models.Board.create({ title: title.trim(), description: description || "", owner: ownerId });
    return res.status(201).json({ ok: true, data: { board } });
  } catch (err) {
    console.error("createBoard error:", err);
    return res.status(500).json({ ok: false, error: "Failed to create board" });
  }
}

module.exports = { createBoard: asyncHandler(createBoard) };

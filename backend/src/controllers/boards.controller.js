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

const models = require("../models");
const ActivityLog = require("../models/ActivityLog"); // 🎯 ADDED
const { asyncHandler } = require("../utils/asyncHandler");
const { logBoardCreation, logBoardDeletion } = require("../middleware/activityLogger");

/**
 * Check if user has access to view a board
 */
const canAccessBoard = (user, board) => {
  if (user.role === "admin") return true;
  if (board.owner.toString() === user._id.toString()) return true;
  if (board.members.some(m => m.toString() === user._id.toString())) return true;
  return false;
};

/**
 * Check if user can modify a board (edit/delete)
 */
const canModifyBoard = (user, board) => {
  if (user.role === "admin") return true;
  if (board.owner.toString() === user._id.toString()) return true;
  return false;
};

const getBoardById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const board = await models.Board.findById(id).populate("owner members", "name email role");
    if (!board) return res.status(404).json({ ok: false, error: "Board not found" });
    
    if (!canAccessBoard(req.user, board)) {
      return res.status(403).json({ ok: false, error: "You do not have access to this board" });
    }
    
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
      boards = await models.Board.find().sort({ createdAt: -1 }).populate("owner members", "name email role");
    } else {
      boards = await models.Board.find({ 
        $or: [{ owner: actor._id }, { members: actor._id }] 
      }).sort({ createdAt: -1 }).populate("owner members", "name email role");
    }
    return res.json({ ok: true, data: { boards } });
  } catch (err) {
    console.error("listBoards error:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch boards" });
  }
});

const createBoard = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ ok: false, error: "`title` is required" });
  }

  if (!["admin", "member"].includes(req.user.role)) {
    return res.status(403).json({ ok: false, error: "Only members and admins can create boards" });
  }

  const ownerId = req.user && req.user._id;
  let board;
  try {
    board = await models.Board.create({ 
      title: title.trim(), 
      description: description || "", 
      owner: ownerId,
      members: [] 
    });

    const columnsData = ["Backlog", "Todo", "In Progress", "Review", "Done"];
    const colsToCreate = columnsData.map((t, i) => ({ title: t, board: board._id, position: i }));
    const createdColumns = await models.Column.insertMany(colsToCreate);

    await ActivityLog.create({
      action: "board.create",
      userId: req.user._id,
      entityType: "board",
      entityId: board._id,
      entityName: board.title,
      boardId: board._id
    });

    await logBoardCreation(board._id, req.user._id, title.trim());

    return res.status(201).json({ ok: true, data: { board, columns: createdColumns } });
  } catch (err) {
    console.error("createBoard error:", err);
    if (board && board._id) await models.Board.findByIdAndDelete(board._id);
    return res.status(500).json({ ok: false, error: "Failed to create board" });
  }
});

const deleteBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const board = await models.Board.findById(id);
    if (!board) {
      return res.status(404).json({ ok: false, error: "Board not found" });
    }

    if (!canModifyBoard(req.user, board)) {
      return res.status(403).json({ ok: false, error: "You do not have permission to delete this board" });
    }

    await ActivityLog.create({
      action: "board.delete",
      userId: req.user._id,
      entityType: "board",
      entityId: id,
      entityName: board.title,
      boardId: id
    });

    await models.Board.findByIdAndDelete(id);
    await models.Column.deleteMany({ board: id });
    await models.Ticket.deleteMany({ board: id });

    await logBoardDeletion(id, req.user._id);

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
  deleteBoard,
  canAccessBoard,
  canModifyBoard
};
const router = require("express").Router();
const { requireAuth, requireMember } = require("../middleware/auth");
const boardsCtrl = require("../controllers/boards.controller");
const colCtrl = require("../controllers/columns.controller");

// Standard Board Routes
// GET - viewers, members, and admins can list boards
router.get("/", requireAuth, boardsCtrl.listBoards);

// GET - viewers, members, and admins can view boards
router.get("/:id", requireAuth, boardsCtrl.getBoardById);

// POST - only members and admins can create boards
router.post("/", requireAuth, requireMember, boardsCtrl.createBoard);

// DELETE - only board owner or admin can delete
router.delete("/:id", requireAuth, requireMember, boardsCtrl.deleteBoard);

// --- COLUMN SUB-ROUTES ---
// GET - viewers, members, and admins can list columns
router.get("/:id/columns", requireAuth, colCtrl.listColumnsByBoard);

// POST - only members and admins can add columns
router.post("/:id/columns", requireAuth, requireMember, colCtrl.addColumn);

module.exports = router;
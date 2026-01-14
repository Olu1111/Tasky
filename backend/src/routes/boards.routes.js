const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const boardsCtrl = require("../controllers/boards.controller");
const colCtrl = require("../controllers/columns.controller");

// Standard Board Routes
router.get("/", requireAuth, boardsCtrl.listBoards);
router.get("/:id", requireAuth, boardsCtrl.getBoardById);
router.post("/", requireAuth, requireAdmin, boardsCtrl.createBoard);

// --- COLUMN SUB-ROUTES ---

// 1. GET /api/boards/:id/columns
router.get("/:id/columns", requireAuth, colCtrl.listColumnsByBoard);

// 2. POST /api/boards/:id/columns
router.post("/:id/columns", requireAuth, requireAdmin, colCtrl.addColumn);

module.exports = router;
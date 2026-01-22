const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const boardsCtrl = require("../controllers/boards.controller");
const colCtrl = require("../controllers/columns.controller");

// Standard Board Routes
router.get("/", requireAuth, boardsCtrl.listBoards);
router.get("/:id", requireAuth, boardsCtrl.getBoardById);
router.post("/", requireAuth, requireAdmin, boardsCtrl.createBoard);
router.delete("/:id", requireAuth, requireAdmin, boardsCtrl.deleteBoard);

// --- COLUMN SUB-ROUTES ---
router.get("/:id/columns", requireAuth, colCtrl.listColumnsByBoard);
router.post("/:id/columns", requireAuth, requireAdmin, colCtrl.addColumn);

module.exports = router;
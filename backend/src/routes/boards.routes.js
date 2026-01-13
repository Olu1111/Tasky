const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const boardCtrl = require("../controllers/boards.controller");
const colCtrl = require("../controllers/columns.controller");

// Middleware to check if user owns the board
async function requireBoardOwner(req, res, next) {
  try {
    const board = await require("../models").Board.findById(req.params.id);
    if (!board) return res.status(404).json({ ok: false, error: "Board not found" });
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "You don't own this board" });
    }
    req.board = board; // Attach board to request for later use
    next();
  } catch (err) {
    res.status(500).json({ ok: false, error: "Authorization check failed" });
  }
}

router.get("/", requireAuth, boardCtrl.listBoards);
router.get("/:id", requireAuth, boardCtrl.getBoardById);
router.get("/:id/columns", requireAuth, colCtrl.listColumns);

router.post("/", requireAuth, requireAdmin, boardCtrl.createBoard);
router.post("/:id/columns", requireAuth, requireBoardOwner, colCtrl.addColumn);

module.exports = router;
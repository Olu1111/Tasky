const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const boardCtrl = require("../controllers/boards.controller");
const colCtrl = require("../controllers/columns.controller");

router.get("/", requireAuth, boardCtrl.listBoards);
router.get("/:id", requireAuth, boardCtrl.getBoardById);
router.get("/:id/columns", requireAuth, colCtrl.listColumns);

router.post("/", requireAuth, requireAdmin, boardCtrl.createBoard);
router.post("/:id/columns", requireAuth, requireAdmin, colCtrl.addColumn);

module.exports = router;
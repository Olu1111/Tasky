const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { createBoard, listBoards } = require("../controllers/boards.controller");

// GET /api/boards - list boards visible to the current user
router.get("/", requireAuth, listBoards);

// POST /api/boards - create board (admin-only)
router.post("/", requireAuth, requireAdmin, createBoard);

module.exports = router;

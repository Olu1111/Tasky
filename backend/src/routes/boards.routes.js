const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { createBoard } = require("../controllers/boards.controller");

// POST /api/boards - create board (admin-only)
router.post("/", requireAuth, requireAdmin, createBoard);

module.exports = router;

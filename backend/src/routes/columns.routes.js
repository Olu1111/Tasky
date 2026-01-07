const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { updateColumn, deleteColumn } = require("../controllers/columns.controller");

// PATCH /api/columns/:id - rename or reposition column (admin-only)
router.patch("/:id", requireAuth, requireAdmin, updateColumn);

// DELETE /api/columns/:id - delete column (admin-only)
router.delete("/:id", requireAuth, requireAdmin, deleteColumn);

module.exports = router;

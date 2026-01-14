const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { updateColumn, deleteColumn } = require("../controllers/columns.controller");

router.patch("/:id", requireAuth, requireAdmin, updateColumn);
router.delete("/:id", requireAuth, requireAdmin, deleteColumn);

module.exports = router;
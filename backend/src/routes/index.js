const express = require("express");
const router = express.Router();

// 1. Mount standard authentication routes (/api/auth/login, etc.)
router.use("/auth", require("./auth.routes"));

// 2. MOUNT USER LIST: allows fetch('http://localhost:4000/api/users') to work
// It points to auth.routes to where 'listUsers' function is defined
router.use("/users", require("./auth.routes"));

// 3. Mount domain routes for Kanban functionality
router.use("/boards", require("./boards.routes"));
router.use("/columns", require("./columns.routes"));
router.use("/tickets", require("./ticket.routes"));
router.use("/comments", require("./comment.routes"));

// Minimal API root
router.get("/", (req, res) => {
  res.json({ ok: true, message: "API root" });
});

module.exports = router;
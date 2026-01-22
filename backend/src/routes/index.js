const express = require("express");
const router = express.Router();

// Mount each domain's routes
router.use("/auth", require("./auth.routes"));
router.use("/boards", require("./boards.routes"));
router.use("/columns", require("./columns.routes"));
router.use("/tickets", require("./ticket.routes"));

router.use("/users", require("./auth.routes"));

router.use("/tickets", require("./comment.routes"));

// Minimal API root
router.get("/", (req, res) => {
  res.json({ ok: true, message: "API root" });
});

module.exports = router;
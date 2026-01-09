const express = require("express");
const router = express.Router();

// Mount all domain routes for the dynamic board
router.use("/auth", require("./auth.routes"));
router.use("/boards", require("./boards.routes"));
router.use("/columns", require("./columns.routes"));
router.use("/tickets", require("./ticket.routes"));

router.get("/", (req, res) => {
  res.json({ ok: true, message: "API root" });
});

module.exports = router;
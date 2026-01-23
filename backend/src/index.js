const express = require("express");
const router = express.Router();

// Mount each domain's routes
router.use("/auth", require("./auth.routes"));
router.use("/boards", require("./boards.routes"));
router.use("/columns", require("./columns.routes"));
router.use("/tickets", require("./ticket.routes"));
router.use("/comments", require("./comment.routes"));
router.use("/activity", require("./activity.routes"));
router.get("/", (req, res) => {
  res.json({ ok: true, message: "API root" });
});

module.exports = router;
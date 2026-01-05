const router = require("express").Router();

// Later you’ll mount these:
// router.use("/auth", require("./auth.routes"));
// router.use("/boards", require("./boards.routes"));

router.get("/", (req, res) => {
  res.json({ ok: true, message: "API root" });
});

module.exports = router;

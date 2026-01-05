const router = require("express").Router();

// Mount authentication routes
router.use("/auth", require("./routes/auth.routes"));

// TODO: mount other domain routes (boards, tickets, etc.)

router.get("/", (req, res) => {
  res.json({ ok: true, message: "API root" });
});

module.exports = router;

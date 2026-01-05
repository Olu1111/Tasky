const express = require("express");

const router = express.Router();

// Minimal API root to avoid `app.use` receiving a non-function
router.get("/", (req, res) => {
	res.json({ ok: true, message: "API root" });
});

module.exports = router;

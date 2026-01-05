const router = require("express").Router();
const { register, login, me, changePassword } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, changePassword);

module.exports = router;

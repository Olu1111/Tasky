const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { authLimiter, registerLimiter } = require("../middleware/rateLimiter");
const authController = require("../controllers/auth.controller");

// Standard Auth
router.post("/register", registerLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/me", requireAuth, authController.getMe);

// This handles GET /api/users (it's mounted at /users in index.js)
router.get("/", requireAuth, authController.listUsers); 

module.exports = router;
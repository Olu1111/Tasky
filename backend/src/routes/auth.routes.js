const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { authLimiter, registerLimiter } = require("../middleware/rateLimiter");
const { validateRegistration, validateLogin } = require("../middleware/validation");
const authController = require("../controllers/auth.controller");

// Standard Auth with rate limiting and validation
router.post("/register", registerLimiter, validateRegistration, authController.register);
router.post("/login", authLimiter, validateLogin, authController.login);
router.get("/me", requireAuth, authController.getMe);

// This handles GET /api/users (it's mounted at /users in index.js)
router.get("/", requireAuth, authController.listUsers); 

module.exports = router;
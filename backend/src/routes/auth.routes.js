const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { authLimiter, registerLimiter } = require("../middleware/rateLimiter");
const authController = require("../controllers/auth.controller");

// Standard Auth
router.post("/register", registerLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/me", requireAuth, authController.getMe);

// Authenticated users: Get team members for assignment
router.get("/team", requireAuth, authController.getTeamMembers);

// Admin only: Get all users and update user roles
router.get("/", requireAuth, authController.listUsers);
router.put("/:userId/role", requireAuth, authController.updateUserRole);

module.exports = router;
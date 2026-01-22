const rateLimit = require("express-rate-limit");

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    ok: false,
    error: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests to avoid blocking legitimate users
  skipSuccessfulRequests: false,
});

// Rate limiting for registration endpoint (slightly more strict)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    ok: false,
    error: "Too many registration attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, registerLimiter };

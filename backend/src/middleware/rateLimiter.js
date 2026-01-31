/**
 * Rate Limiting Configuration
 * Specific rate limits for different endpoints
 */

const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter
 * 1000 requests per 15 minutes (supports polling + normal usage)
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 300 to support polling (30s interval = ~30 requests/15min per client)
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === "/health";
  },
});

/**
 * Authentication rate limiter
 * Strict: 5 attempts per 15 minutes per IP
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many login attempts. Please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to auth endpoints
    return !req.path.includes("/auth");
  },
});

/**
 * Registration rate limiter
 * Strict: 3 attempts per hour per IP
 * Prevents account creation spam
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many account creation attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path !== "/auth/register";
  },
});

/**
 * Search rate limiter
 * Moderate: 30 requests per minute
 * Prevents search abuse/DoS
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: "Too many search requests. Please try again in a minute.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path !== "/tickets/search";
  },
});

/**
 * Create/Write operations limiter
 * Moderate: 50 requests per 5 minutes
 * Prevents bulk modifications
 */
const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  message: "Too many write operations. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to POST, PUT, PATCH, DELETE
    return !["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  searchLimiter,
  writeLimiter,
};

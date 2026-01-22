const jwt = require("jsonwebtoken");
const models = require("../models");

async function requireAuth(req, res, next) {
  const auth = req.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Missing token" });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await models.User.findById(payload.sub).select("-password");
    if (!user) return res.status(401).json({ ok: false, error: "Invalid token" });
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: "Not authenticated" });
  if (req.user.role !== "admin") return res.status(403).json({ ok: false, error: "Admin access required" });
  return next();
}

/**
 * Require member role (admin > member)
 */
function requireMember(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: "Not authenticated" });
  if (!["admin", "member"].includes(req.user.role)) {
    return res.status(403).json({ ok: false, error: "Member access required" });
  }
  return next();
}

/**
 * Check if user has a minimum role level
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        ok: false, 
        error: `Required role(s): ${roles.join(", ")}` 
      });
    }
    return next();
  };
}

module.exports = { requireAuth, requireAdmin, requireMember, requireRole };

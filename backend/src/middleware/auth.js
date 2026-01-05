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

module.exports = { requireAuth, requireAdmin };


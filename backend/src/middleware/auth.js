function requireAuth(req, res, next) {
  // TODO: verify JWT, attach user to req.user
  return res.status(501).json({ ok: false, error: "Auth not implemented yet" });
}

function requireAdmin(req, res, next) {
  // TODO: check req.user.role === "admin"
  return res.status(501).json({ ok: false, error: "Admin auth not implemented yet" });
}

module.exports = { requireAuth, requireAdmin };

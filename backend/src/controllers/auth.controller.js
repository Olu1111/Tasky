const jwt = require("jsonwebtoken");
const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");
const { logAuthEvent } = require("../middleware/logger");

// POST Helper to sign tokens
function signToken(user) {
  const payload = { sub: user._id.toString(), role: user.role };
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body; 
  
  // Validation is handled by middleware

  const exists = await models.User.findOne({ email });
  if (exists) {
    logAuthEvent(req, "REGISTER_FAILED", { reason: "email_exists", email });
    return res.status(409).json({ ok: false, error: "Email already in use" });
  }

  const user = await models.User.create({ name, email, password });
  const token = signToken(user);
  logAuthEvent(req, "REGISTER_SUCCESS", { userId: user._id.toString(), email });
  return res.status(201).json({ ok: true, data: { user: user.toJSON(), token } });
});

// /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Validation is handled by middleware

  const user = await models.User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    logAuthEvent(req, "LOGIN_FAILED", { reason: "invalid_credentials", email });
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  const token = signToken(user);
  logAuthEvent(req, "LOGIN_SUCCESS", { userId: user._id.toString(), email });
  return res.json({ ok: true, data: { user: user.toJSON(), token } });
});

// GET /api/users - Feeds the Assignee Dropdown
const listUsers = asyncHandler(async (req, res) => {
  const users = await models.User.find({}, "name email _id"); 
  return res.json({ ok: true, data: { users } });
});

const getMe = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "Not authenticated" });
  return res.json({ ok: true, data: req.user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await models.User.findById(req.user._id);
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ ok: false, error: "Current password incorrect" });
  }
  user.password = newPassword;
  await user.save();
  res.json({ ok: true, data: { message: "Password updated" } });
});

module.exports = { register, login, getMe, listUsers, changePassword };
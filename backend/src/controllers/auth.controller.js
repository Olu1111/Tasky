const jwt = require("jsonwebtoken");
const models = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");

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
  
  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email format" });
  }

  const exists = await models.User.findOne({ email });
  if (exists) return res.status(409).json({ ok: false, error: "Email already in use" });

  const user = await models.User.create({ name, email, password });
  const token = signToken(user);
  return res.status(201).json({ ok: true, data: { user: user.toJSON(), token } });
});

// /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, error: "Missing email/password" });

  const user = await models.User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  const token = signToken(user);
  return res.json({ ok: true, data: { user: user.toJSON(), token } });
});

// GET /api/users - Admin only: Get all users with roles
const listUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: "Admin access required" });
  }
  const users = await models.User.find({}, "name email _id role createdAt").sort({ createdAt: -1 }); 
  return res.json({ ok: true, data: { users } });
});

// PUT /api/users/:userId/role - Admin only: Update user role
const updateUserRole = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: "Admin access required" });
  }
  
  const { userId } = req.params;
  const { role } = req.body;
  
  if (!['admin', 'member', 'viewer'].includes(role)) {
    return res.status(400).json({ ok: false, error: "Invalid role" });
  }
  
  const user = await models.User.findByIdAndUpdate(userId, { role }, { new: true }).select("name email _id role");
  if (!user) return res.status(404).json({ ok: false, error: "User not found" });
  
  return res.json({ ok: true, data: { user } });
});

const getMe = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ ok: false, error: "Not authenticated" });
  
  // Get user with permissions
  const user = await models.User.findById(req.user._id).lean();
  if (!user) return res.status(404).json({ ok: false, error: "User not found" });
  
  // Map role to permissions
  const permissions = {
    admin: ['create_board', 'edit_board', 'delete_board', 'create_ticket', 'edit_ticket', 'delete_ticket', 'assign_ticket', 'create_comment', 'edit_comment', 'delete_comment', 'create_column', 'manage_users'],
    member: ['create_ticket', 'edit_ticket', 'assign_ticket', 'create_comment', 'edit_comment', 'create_board'],
    viewer: ['view_board', 'view_ticket', 'view_comment']
  };
  
  const rolePermissions = permissions[user.role] || [];
  
  res.json({ 
    ok: true, 
    data: {
      ...user,
      role: user.role,
      permissions: rolePermissions,
      isAdmin: user.role === 'admin',
      isMember: user.role === 'member' || user.role === 'admin',
      isViewer: user.role === 'viewer' || user.role === 'member' || user.role === 'admin'
    }
  });
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

// GET /api/users/team - Authenticated users: Get list of team members for assignment
const getTeamMembers = asyncHandler(async (req, res) => {
  const users = await models.User.find({}, "name email _id").sort({ name: 1 });
  res.json({ ok: true, data: { users } });
});

module.exports = { register, login, getMe, listUsers, getTeamMembers, changePassword, updateUserRole };
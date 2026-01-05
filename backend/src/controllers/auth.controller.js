const jwt = require("jsonwebtoken");
const models = require("../models");

function signToken(user) {
  const payload = { sub: user._id.toString(), role: user.role };
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ ok: false, error: "Missing fields" });

  try {
    const exists = await models.User.findOne({ email });
    if (exists) return res.status(409).json({ ok: false, error: "Email already in use" });

    const user = await models.User.create({ name, email, password });
    const token = signToken(user);
    return res.status(201).json({ ok: true, data: { user: user.toJSON(), token } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Registration failed" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, error: "Missing email or password" });

  try {
    const user = await models.User.findOne({ email });
    if (!user) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const token = signToken(user);
    return res.json({ ok: true, data: { user: user.toJSON(), token } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Login failed" });
  }
}

async function me(req, res) {
  const user = req.user;
  if (!user) return res.status(401).json({ ok: false, error: "Not authenticated" });
  return res.json({ ok: true, data: user });
}

async function changePassword(req, res) {
  const actor = req.user; // loaded by requireAuth
  if (!actor) return res.status(401).json({ ok: false, error: "Not authenticated" });

  const { currentPassword, newPassword, userId } = req.body;

  try {
    // If admin is changing another user's password
    if (userId && actor.role === "admin") {
      const target = await models.User.findById(userId);
      if (!target) return res.status(404).json({ ok: false, error: "User not found" });
      target.password = newPassword;
      await target.save();
      return res.json({ ok: true, data: { message: "Password updated for user" } });
    }

    // Otherwise, user must provide currentPassword and change their own
    if (!currentPassword || !newPassword) return res.status(400).json({ ok: false, error: "Missing currentPassword or newPassword" });

    const user = await models.User.findById(actor._id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ ok: false, error: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    return res.json({ ok: true, data: { message: "Password updated" } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Could not update password" });
  }
}

module.exports = { register, login, me };

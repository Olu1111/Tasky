const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "member", "viewer"], default: "admin" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Role hierarchy helper methods
userSchema.statics.roleHierarchy = {
  admin: 3,
  member: 2,
  viewer: 1
};

userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

userSchema.methods.isMember = function () {
  return this.role === "member" || this.role === "admin";
};

userSchema.methods.isViewer = function () {
  return this.role === "viewer" || this.role === "member" || this.role === "admin";
};

userSchema.methods.hasRoleLevel = function (requiredRole) {
  const hierarchy = mongoose.model("User").roleHierarchy;
  return (hierarchy[this.role] || 0) >= (hierarchy[requiredRole] || 0);
};

module.exports = mongoose.model("User", userSchema);

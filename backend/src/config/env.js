const required = ["MONGODB_URI", "JWT_SECRET"];

function loadEnv() {
  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  });

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 4000),
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  };
}

module.exports = { loadEnv };

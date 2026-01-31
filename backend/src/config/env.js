const required = ["MONGODB_URI", "JWT_SECRET"];

function loadEnv() {
  // Check required environment variables
  required.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  });

  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  return {
    nodeEnv,
    port: Number(process.env.PORT || 4000),
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || (isProduction ? "24h" : "7d"),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    // Production settings
    isProduction,
    logLevel: process.env.LOG_LEVEL || (isProduction ? "warn" : "debug"),
  };
}

module.exports = { loadEnv };

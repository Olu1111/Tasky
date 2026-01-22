const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error");
const { devFormat, auditFormat } = require("./middleware/logger");

function createApp({ corsOrigin }) {
  const app = express();

  // Security / basics
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );

  // Enhanced logging for audit trail
  const logFormat = process.env.NODE_ENV === "production" ? auditFormat : devFormat;
  app.use(morgan(logFormat));

  // Simple rate limit (MVP-level)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Health check
  app.get("/health", (req, res) => {
    res.json({ ok: true, status: "healthy" });
  });

  // API routes
  app.use("/api", routes);

  // Errors
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

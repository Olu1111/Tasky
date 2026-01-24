const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error");
const { generalLimiter, writeLimiter, searchLimiter } = require("./middleware/rateLimiter");

function createApp({ corsOrigin }) {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );

  const logsDir = path.join(__dirname, "../logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  morgan.token("user-id", (req) => req.user?._id || "anonymous");
  morgan.token("user-role", (req) => req.user?.role || "none");
  morgan.token("response-time-ms", (req, res) => res.getHeader("x-response-time") || "N/A");

  const securityLogFormat =
    ":remote-addr :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\" user=:user-id role=:user-role :response-time-ms ms";

  const auditStream = fs.createWriteStream(path.join(logsDir, "audit.log"), { flags: "a" });
  app.use(morgan(securityLogFormat, { stream: auditStream }));

  if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
  }

  app.use(generalLimiter);
  app.use(writeLimiter);
  app.use(searchLimiter);
  app.get("/health", (req, res) => {
    res.json({ ok: true, status: "healthy" });
  });

  app.use("/api", routes);

  // Errors
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
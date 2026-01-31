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
  const isProduction = process.env.NODE_ENV === "production";
  
  // Security headers with production-specific CSP
  app.use(helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", corsOrigin]
      }
    } : false
  }));
  
  app.use(express.json({ limit: "1mb" }));
  
  // Enhanced CORS configuration for production
  const corsOptions = {
    origin: function(origin, callback) {
      const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
      if (isProduction) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));

  // Logging setup
  const logsDir = path.join(__dirname, "../logs");
  if (!isProduction && !fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  morgan.token("user-id", (req) => req.user?._id || "anonymous");
  morgan.token("user-role", (req) => req.user?.role || "none");
  morgan.token("response-time-ms", (req, res) => res.getHeader("x-response-time") || "N/A");

  const securityLogFormat =
    ":remote-addr :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\" user=:user-id role=:user-role :response-time-ms ms";

  // File logging for development, console for production
  if (isProduction) {
    app.use(morgan(securityLogFormat));
  } else {
    const auditStream = fs.createWriteStream(path.join(logsDir, "audit.log"), { flags: "a" });
    app.use(morgan(securityLogFormat, { stream: auditStream }));
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
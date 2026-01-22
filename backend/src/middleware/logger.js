const morgan = require("morgan");

// Custom token to include user ID if authenticated
morgan.token("user-id", (req) => {
  return req.user ? req.user._id.toString() : "anonymous";
});

// Custom token for request body (limited to avoid logging sensitive data)
morgan.token("body", (req) => {
  // Don't log password fields
  if (req.body && req.body.password) {
    const sanitized = { ...req.body };
    delete sanitized.password;
    return JSON.stringify(sanitized);
  }
  return req.body ? JSON.stringify(req.body) : "{}";
});

// Development logging format
const devFormat = ":method :url :status :response-time ms - :res[content-length]";

// Production/audit logging format with more details
const auditFormat =
  ":remote-addr - :user-id [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\" :response-time ms";

// Authentication event logger
function logAuthEvent(req, eventType, details = {}) {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("user-agent") || "unknown";
  
  console.log(
    JSON.stringify({
      timestamp,
      type: "AUTH_EVENT",
      event: eventType,
      ip,
      userAgent,
      userId: req.user ? req.user._id.toString() : null,
      ...details,
    })
  );
}

module.exports = {
  devFormat,
  auditFormat,
  logAuthEvent,
};
